<?php

namespace App\Actions\Dashboard;

use App\Models\Attendance;
use App\Models\Student;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class LowAttendanceStudentsAlert
{
    private const LOOKBACK_DAYS = 30;

    private const MIN_SESSIONS = 4;

    private const ATTENDANCE_THRESHOLD = 0.5;

    private const TOP_LIMIT = 5;

    /**
     * @return array{count: int, items: array<int, array<string, mixed>>}
     */
    public function __invoke(): array
    {
        $since = CarbonImmutable::now()->subDays(self::LOOKBACK_DAYS)->toDateString();

        $rows = Attendance::query()
            ->select('student_id', DB::raw('SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) as present_count'), DB::raw('COUNT(*) as total_count'))
            ->whereHas('classSession', fn ($q) => $q->where('date', '>=', $since))
            ->groupBy('student_id')
            ->havingRaw('COUNT(*) >= '.self::MIN_SESSIONS)
            ->havingRaw('(SUM(CASE WHEN present = 1 THEN 1 ELSE 0 END) * 1.0 / COUNT(*)) < '.self::ATTENDANCE_THRESHOLD)
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
            'items' => $items->take(self::TOP_LIMIT)->all(),
        ];
    }
}
