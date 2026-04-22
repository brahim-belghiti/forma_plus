<?php

namespace App\Http\Requests;

use App\Models\Salary;
use Illuminate\Foundation\Http\FormRequest;

class StoreSalaryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Salary::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'teacher_id' => ['required', 'exists:teachers,id'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'period_month' => ['required', 'integer', 'between:1,12'],
            'period_year' => ['required', 'integer', 'min:2020'],
            'paid_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
