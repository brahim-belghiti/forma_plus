<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassSessionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'group_id' => $this->group_id,
            'date' => $this->date?->toDateString(),
            'teacher_present' => $this->teacher_present,
            'notes' => $this->notes,
            'group' => new GroupResource($this->whenLoaded('group')),
            'attendances' => AttendanceResource::collection($this->whenLoaded('attendances')),
            'present_count' => $this->when(
                isset($this->present_count),
                fn () => (int) $this->present_count,
            ),
            'attendances_count' => $this->when(
                isset($this->attendances_count),
                fn () => (int) $this->attendances_count,
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
