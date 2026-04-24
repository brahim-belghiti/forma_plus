<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'enrollment_id' => $this->enrollment_id,
            'amount' => $this->amount,
            'period_month' => $this->period_month,
            'period_year' => $this->period_year,
            'paid_at' => $this->paid_at->toDateString(),
            'notes' => $this->notes,
            'enrollment' => new EnrollmentResource($this->whenLoaded('enrollment')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
