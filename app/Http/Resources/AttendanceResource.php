<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'class_session_id' => $this->class_session_id,
            'student_id' => $this->student_id,
            'present' => $this->present,
            'notes' => $this->notes,
            'student' => new StudentResource($this->whenLoaded('student')),
        ];
    }
}
