<?php

namespace App\Actions\Dashboard;

use App\Models\Enrollment;

class UnpaidStudentsAlert
{
    private const UNPAID_THRESHOLD = 2;

    private const TOP_LIMIT = 5;

    /**
     * @return array{
     *     count: int,
     *     items: array<int, array{
     *         student_id: int,
     *         student_name: string,
     *         unpaid_count: int,
     *         total_due: float,
     *         enrollments: array<int, array{id: int, group_name: string, monthly_fee: float, unpaid_periods: array<int, array{year: int, month: int}>}>
     *     }>
     * }
     */
    public function __invoke(): array
    {
        $rows = [];

        Enrollment::query()
            ->with(['student', 'payments', 'group'])
            ->where(function ($q) {
                $q->where('active', true)->orWhereNull('end_date');
            })
            ->chunk(200, function ($enrollments) use (&$rows) {
                foreach ($enrollments as $enrollment) {
                    if (! $enrollment->student) {
                        continue;
                    }

                    $unpaidPeriods = $enrollment->unpaidPeriods();

                    if (empty($unpaidPeriods)) {
                        continue;
                    }

                    $studentId = $enrollment->student_id;
                    $unpaidCount = count($unpaidPeriods);
                    $totalDue = $unpaidCount * (float) $enrollment->monthly_fee;

                    if (! isset($rows[$studentId])) {
                        $rows[$studentId] = [
                            'student_id' => $studentId,
                            'student_name' => trim($enrollment->student->first_name.' '.$enrollment->student->last_name),
                            'unpaid_count' => 0,
                            'total_due' => 0.0,
                            'enrollments' => [],
                        ];
                    }

                    $rows[$studentId]['unpaid_count'] = max($rows[$studentId]['unpaid_count'], $unpaidCount);
                    $rows[$studentId]['total_due'] += $totalDue;
                    $rows[$studentId]['enrollments'][] = [
                        'id' => $enrollment->id,
                        'group_name' => $enrollment->group?->name ?? '—',
                        'monthly_fee' => (float) $enrollment->monthly_fee,
                        'unpaid_periods' => $unpaidPeriods,
                    ];
                }
            });

        $rows = array_filter($rows, fn ($r) => $r['unpaid_count'] >= self::UNPAID_THRESHOLD);

        usort($rows, fn ($a, $b) => $b['total_due'] <=> $a['total_due']);

        return [
            'count' => count($rows),
            'items' => array_slice($rows, 0, self::TOP_LIMIT),
        ];
    }
}
