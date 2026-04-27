<?php

namespace App\Actions\Dashboard;

use App\Models\Enrollment;

class UnpaidStudentsAlert
{
    private const UNPAID_THRESHOLD = 2;

    private const TOP_LIMIT = 5;

    /**
     * @return array{count: int, items: array<int, array{student_id: int, student_name: string, unpaid_count: int, total_due: float}>}
     */
    public function __invoke(): array
    {
        $rows = [];

        Enrollment::query()
            ->with(['student', 'payments'])
            ->where(function ($q) {
                $q->where('active', true)->orWhereNull('end_date');
            })
            ->chunk(200, function ($enrollments) use (&$rows) {
                foreach ($enrollments as $enrollment) {
                    if (! $enrollment->student) {
                        continue;
                    }

                    $unpaidCount = count($enrollment->unpaidPeriods());

                    if ($unpaidCount < self::UNPAID_THRESHOLD) {
                        continue;
                    }

                    $studentId = $enrollment->student_id;
                    $totalDue = $unpaidCount * (float) $enrollment->monthly_fee;

                    if (! isset($rows[$studentId])) {
                        $rows[$studentId] = [
                            'student_id' => $studentId,
                            'student_name' => trim($enrollment->student->first_name.' '.$enrollment->student->last_name),
                            'unpaid_count' => 0,
                            'total_due' => 0.0,
                        ];
                    }

                    $rows[$studentId]['unpaid_count'] = max($rows[$studentId]['unpaid_count'], $unpaidCount);
                    $rows[$studentId]['total_due'] += $totalDue;
                }
            });

        usort($rows, fn ($a, $b) => $b['total_due'] <=> $a['total_due']);

        return [
            'count' => count($rows),
            'items' => array_slice($rows, 0, self::TOP_LIMIT),
        ];
    }
}
