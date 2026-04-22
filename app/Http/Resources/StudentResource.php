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
            'subjects' => SubjectResource::collection($this->whenLoaded('subjects')),
            'subjects_count' => $this->whenCounted('subjects'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
