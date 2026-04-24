<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnrollmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'student_id' => $this->student_id,
            'group_id' => $this->group_id,
            'monthly_fee' => $this->monthly_fee,
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),
            'active' => $this->active,
            'student' => new StudentResource($this->whenLoaded('student')),
            'group' => new GroupResource($this->whenLoaded('group')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
