<?php

namespace App\Http\Requests;

use App\Models\Payment;
use Illuminate\Foundation\Http\FormRequest;

class StorePaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Payment::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'enrollment_id' => ['required', 'exists:enrollments,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'period_month' => ['required', 'integer', 'between:1,12'],
            'period_year' => ['required', 'integer', 'min:2020'],
            'paid_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (! $this->filled(['enrollment_id', 'period_year', 'period_month'])) {
                return;
            }

            $exists = Payment::query()
                ->where('enrollment_id', $this->integer('enrollment_id'))
                ->where('period_year', $this->integer('period_year'))
                ->where('period_month', $this->integer('period_month'))
                ->exists();

            if ($exists) {
                $validator->errors()->add('period_month', 'Cette période est déjà payée pour cette inscription.');
            }
        });
    }
}
