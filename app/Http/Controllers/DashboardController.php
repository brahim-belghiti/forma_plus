<?php

namespace App\Http\Controllers;

use App\Actions\Dashboard\ActivitySummary;
use App\Actions\Dashboard\IdleTeachersAlert;
use App\Actions\Dashboard\LowAttendanceStudentsAlert;
use App\Actions\Dashboard\MoneyForMonth;
use App\Actions\Dashboard\OutstandingTotal;
use App\Actions\Dashboard\UnderEnrolledGroupsAlert;
use App\Actions\Dashboard\UnpaidStudentsAlert;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Salary;
use App\Models\Student;
use App\Models\Teacher;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
        $moneyForMonth = new MoneyForMonth;
        $month = $moneyForMonth($now);
        $previous = $moneyForMonth($now->subMonth());

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
            'outstanding' => (new OutstandingTotal)(),
            'alerts' => [
                'unpaid' => (new UnpaidStudentsAlert)(),
                'under_enrolled' => (new UnderEnrolledGroupsAlert)(),
                'idle_teachers' => (new IdleTeachersAlert)(),
                'low_attendance' => (new LowAttendanceStudentsAlert)(),
            ],
            'activity' => (new ActivitySummary)($now),
            'totals' => [
                'students' => Student::count(),
                'teachers' => Teacher::count(),
                'all_time_revenue' => (float) Payment::sum('amount'),
                'all_time_salaries' => (float) Salary::sum('amount'),
                'all_time_expenses' => (float) Expense::sum('amount'),
            ],
        ]);
    }
}
