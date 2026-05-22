<?php

namespace App\Actions\Dashboard;

use App\Models\Enrollment;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\Salary;
use Carbon\CarbonImmutable;

class MoneyForMonth
{
    /**
     * @return array{revenue: float, salaries: float, expenses: float, billable: float, collected_for_period: float}
     */
    public function __invoke(CarbonImmutable $month): array
    {
        $start = $month->startOfMonth();
        $end = $month->endOfMonth();

        return [
            'revenue' => (float) Payment::whereBetween('paid_at', [$start, $end])->sum('amount'),
            'salaries' => (float) Salary::whereBetween('paid_at', [$start, $end])->sum('amount'),
            'expenses' => (float) Expense::whereBetween('spent_at', [$start, $end])->sum('amount'),
            'billable' => $this->billableForMonth($month),
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
}
