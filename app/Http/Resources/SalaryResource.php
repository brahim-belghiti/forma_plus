<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SalaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'teacher_id' => $this->teacher_id,
            'amount' => $this->amount,
            'period_month' => $this->period_month,
            'period_year' => $this->period_year,
            'paid_at' => $this->paid_at->toDateString(),
            'notes' => $this->notes,
            'teacher' => new TeacherResource($this->whenLoaded('teacher')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
