<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TimeslotResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'teacher_id' => $this->teacher_id,
            'subject_id' => $this->subject_id,
            'level_id' => $this->level_id,
            'classroom_id' => $this->classroom_id,
            'day_of_week' => $this->day_of_week->value,
            'day_of_week_label' => $this->day_of_week->label(),
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'teacher' => new TeacherResource($this->whenLoaded('teacher')),
            'subject' => new SubjectResource($this->whenLoaded('subject')),
            'level' => new LevelResource($this->whenLoaded('level')),
            'classroom' => new ClassroomResource($this->whenLoaded('classroom')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
