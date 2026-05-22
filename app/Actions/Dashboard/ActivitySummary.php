<?php

namespace App\Actions\Dashboard;

use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\Teacher;
use App\Models\Timeslot;
use Carbon\CarbonImmutable;

class ActivitySummary
{
    private const OPEN_HOURS_PER_DAY = 13;

    private const OPEN_DAYS_PER_WEEK = 6;

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
    public function __invoke(CarbonImmutable $month): array
    {
        $start = $month->startOfMonth();
        $end = $month->endOfMonth();

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
        $openMinutesPerClassroom = self::OPEN_HOURS_PER_DAY * 60 * self::OPEN_DAYS_PER_WEEK;

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
