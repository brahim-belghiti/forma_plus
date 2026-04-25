<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GroupResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'default_monthly_fee' => $this->default_monthly_fee,
            'active' => $this->active,
            'subject_id' => $this->subject_id,
            'teacher_id' => $this->teacher_id,
            'subject' => new SubjectResource($this->whenLoaded('subject')),
            'teacher' => new TeacherResource($this->whenLoaded('teacher')),
            'active_enrollments_count' => $this->when(
                isset($this->active_enrollments_count),
                fn () => $this->active_enrollments_count,
            ),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
