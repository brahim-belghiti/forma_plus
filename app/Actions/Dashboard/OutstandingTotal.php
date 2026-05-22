<?php

namespace App\Actions\Dashboard;

use App\Models\Enrollment;

class OutstandingTotal
{
    public function __invoke(): float
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
}
