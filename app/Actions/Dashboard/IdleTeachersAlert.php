<?php

namespace App\Actions\Dashboard;

use App\Models\Teacher;

class IdleTeachersAlert
{
    private const TOP_LIMIT = 5;

    /**
     * @return array{count: int, items: array<int, array<string, mixed>>}
     */
    public function __invoke(): array
    {
        $teachers = Teacher::query()
            ->whereDoesntHave('groups.timeslots')
            ->limit(self::TOP_LIMIT)
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
}
