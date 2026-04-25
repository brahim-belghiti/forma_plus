<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSalaryRequest;
use App\Http\Requests\UpdateSalaryRequest;
use App\Http\Resources\SalaryResource;
use App\Http\Resources\TeacherResource;
use App\Models\Attendance;
use App\Models\ClassSession;
use App\Models\Payment;
use App\Models\Salary;
use App\Models\Teacher;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SalaryController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Salary::class);

        $query = Salary::with('teacher')
            ->orderByDesc('paid_at')
            ->orderByDesc('id');

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->whereHas('teacher', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('month') && $request->filled('year')) {
            $query->where('period_month', $request->integer('month'))
                ->where('period_year', $request->integer('year'));
        }

        return Inertia::render('salaries/index', [
            'salaries' => SalaryResource::collection($query->paginate(20)->withQueryString()),
            'teachers' => TeacherResource::collection(Teacher::orderBy('first_name')->get()),
            'filters' => $request->only(['search', 'month', 'year']),
            'context' => $this->context($request),
        ]);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function context(Request $request): ?array
    {
        if (! $request->filled(['teacher_id', 'month', 'year'])) {
            return null;
        }

        $teacher = Teacher::find($request->integer('teacher_id'));
        if (! $teacher) {
            return null;
        }

        $month = $request->integer('month');
        $year = $request->integer('year');

        $start = CarbonImmutable::createFromDate($year, $month, 1)->startOfMonth();
        $end = $start->endOfMonth();

        $sessionsCount = ClassSession::query()
            ->whereHas('group', fn ($q) => $q->where('teacher_id', $teacher->id))
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->where('teacher_present', true)
            ->count();

        $presentAttendances = Attendance::query()
            ->where('present', true)
            ->whereHas('classSession', function ($q) use ($teacher, $start, $end) {
                $q->whereHas('group', fn ($g) => $g->where('teacher_id', $teacher->id))
                    ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
                    ->where('teacher_present', true);
            })
            ->count();

        $feesCollected = (float) Payment::query()
            ->where('period_month', $month)
            ->where('period_year', $year)
            ->whereHas('enrollment.group', fn ($q) => $q->where('teacher_id', $teacher->id))
            ->sum('amount');

        $rate = $teacher->effectiveSalaryRate();
        $suggestedAmount = round($feesCollected * $rate / 100, 2);

        return [
            'teacher_id' => $teacher->id,
            'month' => $month,
            'year' => $year,
            'sessions_count' => $sessionsCount,
            'present_attendances' => $presentAttendances,
            'fees_collected' => $feesCollected,
            'rate' => $rate,
            'suggested_amount' => $suggestedAmount,
        ];
    }

    public function store(StoreSalaryRequest $request): RedirectResponse
    {
        Salary::create($request->validated());

        return back();
    }

    public function update(UpdateSalaryRequest $request, Salary $salary): RedirectResponse
    {
        $salary->update($request->validated());

        return back();
    }

    public function destroy(Salary $salary): RedirectResponse
    {
        Gate::authorize('delete', $salary);

        $salary->delete();

        return back();
    }
}
