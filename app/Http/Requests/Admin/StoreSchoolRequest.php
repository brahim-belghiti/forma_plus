<?php

namespace App\Http\Requests\Admin;

use App\Concerns\PasswordValidationRules;
use App\Concerns\ProfileValidationRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSchoolRequest extends FormRequest
{
    use PasswordValidationRules, ProfileValidationRules;

    public function authorize(): bool
    {
        return (bool) $this->user()?->isSuperAdmin();
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('schools', 'name')],
            'default_salary_rate' => ['nullable', 'numeric', 'min:0'],
            'admin' => ['required', 'array'],
            'admin.name' => $this->nameRules(),
            'admin.email' => $this->emailRules(),
            'admin.password' => $this->passwordRules(),
        ];
    }
}
