<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherResource extends JsonResource
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
            'salary_rate' => $this->salary_rate,
            'effective_salary_rate' => $this->effectiveSalaryRate(),
            'subjects' => SubjectResource::collection($this->whenLoaded('subjects')),
            'levels' => LevelResource::collection($this->whenLoaded('levels')),
            'subjects_count' => $this->whenCounted('subjects'),
            'levels_count' => $this->whenCounted('levels'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
