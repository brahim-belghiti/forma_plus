<?php

namespace App\Http\Controllers;

use App\Actions\Dashboard\UnpaidStudentsAlert;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\Expense;
use App\Models\Group;
use App\Models\Payment;
use App\Models\Salary;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\Timeslot;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('students.index');
        }

        $now = CarbonImmutable::now();
        $month = $this->moneyForMonth($now);
        $previous = $this->moneyForMonth($now->subMonth());
        $outstanding = $this->outstandingTotal();

        return Inertia::render('dashboard', [
            'month' => [
                'label' => $now->translatedFormat('F Y'),
                'revenue' => $month['revenue'],
                'salaries' => $month['salaries'],
                'expenses' => $month['expenses'],
                'profit' => $month['revenue'] - $month['salaries'] - $month['expenses'],
                'billable' => $month['billable'],
                'collected_for_period' => $month['collected_for_period'],
                'recovery_rate' => $month['billable'] > 0
                    ? round(($month['collected_for_period'] / $month['billable']) * 100, 1)
                    : null,
            ],
            'previous' => [
                'revenue' => $previous['revenue'],
                'profit' => $previous['revenue'] - $previous['salaries'] - $previous['expenses'],
                'recovery_rate' => $previous['billable'] > 0
                    ? round(($previous['collected_for_period'] / $previous['billable']) * 100, 1)
                    : null,
            ],
            'outstanding' => $outstanding,
            'alerts' => $this->buildAlerts(),
            'activity' => $this->buildActivity($now),
            'totals' => [
                'students' => Student::count(),
                'teachers' => Teacher::count(),
                'all_time_revenue' => (float) Payment::sum('amount'),
                'all_time_salaries' => (float) Salary::sum('amount'),
                'all_time_expenses' => (float) Expense::sum('amount'),
            ],
        ]);
    }

    /**
     * @return array{revenue: float, salaries: float, expenses: float, billable: float, collected_for_period: float}
     */
    private function moneyForMonth(CarbonImmutable $month): array
    {
        $start = $month->startOfMonth();
        $end = $month->endOfMonth();

        return [
            'revenue' => (float) Payment::whereBetween('paid_at', [$start, $end])->sum('amount'),
            'salaries' => (float) Salary::whereBetween('paid_at', [$start, $end])->sum('amount'),
            'expenses' => (float) Expense::whereBetween('spent_at', [$start, $end])->sum('amount'),
            'billable' => (float) $this->billableForMonth($month),
            'collected_for_period' => (float) Payment::where('period_year', $month->year)
                ->where('period_month', $month->month)
                ->sum('amount'),
        ];
    }

    private function billableForMonth(CarbonImmutable $month): float
    {
        $start = $month->startOfMonth()->toDateString();
        $end = $month->endOfMonth()->toDateString();

        return (float) Enrollment::query()
            ->where('start_date', '<=', $end)
            ->where(function ($q) use ($start) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $start);
            })
            ->sum('monthly_fee');
    }

    private function outstandingTotal(): float
    {
        $total = 0.0;

        Enrollment::with('payments')
            ->where(function ($q) {
                $q->where('active', true)->orWhereNull('end_date');
            })
            ->chunk(200, function ($enrollments) use (&$total) {
                foreach ($enrollments as $enrollment) {
                    $unpaid = count($enrollment->unpaidPeriods());
                    $total += $unpaid * (float) $enrollment->monthly_fee;
                }
            });

        return $total;
    }

    /**
     * @return array{
     *     unpaid: array{count: int, items: array<int, array<string, mixed>>},
     *     under_enrolled: array{count: int, items: array<int, array<string, mixed>>},
     *     idle_teachers: array{count: int, items: array<int, array<string, mixed>>},
     *     low_attendance: array{count: int, items: array<int, array<string, mixed>>}
     * }
     */
    private function buildAlerts(): array
    {
        return [
            'unpaid' => (new UnpaidStudentsAlert)(),
            'under_enrolled' => $this->underEnrolledGroupsAlert(),
            'idle_teachers' => $this->idleTeachersAlert(),
            'low_attendance' => $this->lowAttendanceStudentsAlert(),
        ];
    }

    /**
     * @return array{count: int, items: array<int, array<string, mixed>>}
     */
    private function underEnrolledGroupsAlert(): array
    {
        $groups = Group::query()
            ->where('active', true)
            ->withCount(['enrollments as active_count' => fn ($q) => $q->where('active', true)])
            ->with(['subject:id,name'])
            ->having('active_count', '<', 3)
            ->orderBy('active_count')
            ->limit(5)
            ->get();

        $totalCount = Group::query()
            ->where('active', true)
            ->withCount(['enrollments as active_count' => fn ($q) => $q->where('active', true)])
            ->having('active_count', '<', 3)
            ->count();

        return [
            'count' => $totalCount,
            'items' => $groups->map(fn ($g) => [
                'group_id' => $g->id,
                'group_name' => $g->name,
                'subject_name' => $g->subject?->name,
                'active_count' => (int) $g->active_count,
            ])->values()->all(),
        ];
    }

    /**
     * @return array{count: int, items: array<int, array<string, mixed>>}
     */
    private function idleTeachersAlert(): array
    {
        $teachers = Teacher::query()
            ->whereDoesntHave('groups.timeslots')
            ->limit(5)
            ->get();

        $totalCount = Teacher::query()
            ->whereDoesntHave('groups.timeslots')
            ->count();

        return [
            'count' => $totalCount,
            'items' => $teachers->map(fn ($t) => [
                'teacher_id' => $t->id,
                'full_name' => trim($t->first_name.' '.$t->last_name),
            ])->values()->all(),
        ];
    }

    /**
     * @return array{count: int, items: array<int, array<string, mixed>>}
     */
    private function lowAttendanceStudentsAlert(): array
    {
        $since = CarbonImmutable::now()->subDays(30)->toDateString();

        $rows = Attendance::query()
            ->select('student_id', DB::raw('SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present_count'), DB::raw('COUNT(*) as total_count'))
            ->whereHas('classSession', fn ($q) => $q->where('date', '>=', $since))
            ->groupBy('student_id')
            ->havingRaw('COUNT(*) >= 4')
            ->havingRaw('(SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*)) < 0.5')
            ->get();

        if ($rows->isEmpty()) {
            return ['count' => 0, 'items' => []];
        }

        $students = Student::query()
            ->whereIn('id', $rows->pluck('student_id'))
            ->get()
            ->keyBy('id');

        $items = $rows
            ->filter(fn ($r) => $students->has($r->student_id))
            ->map(function ($r) use ($students) {
                $rate = $r->total_count > 0 ? $r->present_count / $r->total_count : 0.0;
                $student = $students->get($r->student_id);

                return [
                    'student_id' => $r->student_id,
                    'student_name' => trim($student->first_name.' '.$student->last_name),
                    'rate' => round($rate * 100, 1),
                    'total_sessions' => (int) $r->total_count,
                ];
            })
            ->sortBy('rate')
            ->values();

        return [
            'count' => $items->count(),
            'items' => $items->take(5)->all(),
        ];
    }

    /**
     * @return array{
     *     active_students: int,
     *     sessions_this_month: int,
     *     teacher_absent_count: int,
     *     attendance_rate: float|null,
     *     classroom_utilization: float|null,
     *     teaching_hours_per_week: float,
     *     top_teachers: array<int, array{teacher_id: int, full_name: string, weekly_hours: float}>
     * }
     */
    private function buildActivity(CarbonImmutable $now): array
    {
        $start = $now->startOfMonth();
        $end = $now->endOfMonth();

        $activeStudents = (int) Enrollment::query()
            ->where('active', true)
            ->distinct('student_id')
            ->count('student_id');

        $sessionsThisMonth = ClassSession::query()
            ->whereBetween('date', [$start, $end])
            ->count();

        $teacherAbsentCount = ClassSession::query()
            ->whereBetween('date', [$start, $end])
            ->where('teacher_present', false)
            ->count();

        $attendanceTotals = Attendance::query()
            ->selectRaw('SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present_count, COUNT(*) as total_count')
            ->whereHas('classSession', fn ($q) => $q->whereBetween('date', [$start, $end]))
            ->first();

        $attendanceRate = $attendanceTotals && (int) $attendanceTotals->total_count > 0
            ? round(((int) $attendanceTotals->present_count / (int) $attendanceTotals->total_count) * 100, 1)
            : null;

        $totalWeeklyMinutes = Timeslot::all()->sum(fn (Timeslot $t) => $this->minutesBetween($t->start_time, $t->end_time));
        $classroomCount = Classroom::count();
        $openMinutesPerClassroom = 13 * 60 * 6;

        $classroomUtilization = $classroomCount > 0
            ? round(($totalWeeklyMinutes / ($classroomCount * $openMinutesPerClassroom)) * 100, 1)
            : null;

        $topTeachers = Teacher::with('groups.timeslots')
            ->get()
            ->map(function (Teacher $teacher) {
                $minutes = 0;

                foreach ($teacher->groups as $group) {
                    foreach ($group->timeslots as $timeslot) {
                        $minutes += $this->minutesBetween($timeslot->start_time, $timeslot->end_time);
                    }
                }

                return [
                    'teacher_id' => $teacher->id,
                    'full_name' => trim($teacher->first_name.' '.$teacher->last_name),
                    'weekly_hours' => round($minutes / 60, 1),
                ];
            })
            ->filter(fn ($r) => $r['weekly_hours'] > 0)
            ->sortByDesc('weekly_hours')
            ->take(5)
            ->values()
            ->all();

        return [
            'active_students' => $activeStudents,
            'sessions_this_month' => $sessionsThisMonth,
            'teacher_absent_count' => $teacherAbsentCount,
            'attendance_rate' => $attendanceRate,
            'classroom_utilization' => $classroomUtilization,
            'teaching_hours_per_week' => round($totalWeeklyMinutes / 60, 1),
            'top_teachers' => $topTeachers,
        ];
    }

    private function minutesBetween(string $start, string $end): int
    {
        $startParts = explode(':', $start);
        $endParts = explode(':', $end);
        $startMin = ((int) $startParts[0]) * 60 + ((int) $startParts[1]);
        $endMin = ((int) $endParts[0]) * 60 + ((int) $endParts[1]);

        return max(0, $endMin - $startMin);
    }
}
