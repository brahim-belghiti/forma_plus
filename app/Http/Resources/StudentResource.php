<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $this->fullName(),
            'phone' => $this->phone,
            'guardian_name' => $this->guardian_name,
            'guardian_phone' => $this->guardian_phone,
            'level' => new LevelResource($this->whenLoaded('level')),
            'level_id' => $this->level_id,
            'enrollments' => EnrollmentResource::collection($this->whenLoaded('enrollments')),
            'enrollments_count' => $this->whenCounted('enrollments'),
            'active_enrollments_count' => $this->when(
                isset($this->active_enrollments_count),
                fn () => $this->active_enrollments_count,
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
