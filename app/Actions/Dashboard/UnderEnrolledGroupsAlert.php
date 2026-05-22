<?php

namespace App\Actions\Dashboard;

use App\Models\Group;

class UnderEnrolledGroupsAlert
{
    private const ENROLLMENT_THRESHOLD = 3;

    private const TOP_LIMIT = 5;

    /**
     * @return array{count: int, items: array<int, array<string, mixed>>}
     */
    public function __invoke(): array
    {
        $groups = Group::query()
            ->where('active', true)
            ->withCount(['enrollments as active_count' => fn ($q) => $q->where('active', true)])
            ->with(['subject:id,name'])
            ->having('active_count', '<', self::ENROLLMENT_THRESHOLD)
            ->orderBy('active_count')
            ->limit(self::TOP_LIMIT)
            ->get();

        $totalCount = Group::query()
            ->where('active', true)
            ->withCount(['enrollments as active_count' => fn ($q) => $q->where('active', true)])
            ->having('active_count', '<', self::ENROLLMENT_THRESHOLD)
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
}
