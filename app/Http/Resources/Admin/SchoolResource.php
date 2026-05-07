<?php

namespace App\Http\Resources\Admin;

use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin School */
class SchoolResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'default_salary_rate' => $this->default_salary_rate,
            'created_at' => $this->created_at,
            'admin' => $this->whenLoaded('admin', fn () => [
                'id' => $this->admin->id,
                'name' => $this->admin->name,
                'email' => $this->admin->email,
            ]),
            'students_count' => $this->whenCounted('students'),
            'teachers_count' => $this->whenCounted('teachers'),
            'payments_count' => $this->whenCounted('payments'),
        ];
    }
}
