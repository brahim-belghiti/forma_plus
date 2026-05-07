<?php

namespace App\Http\Requests\Admin;

use App\Concerns\PasswordValidationRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSchoolRequest extends FormRequest
{
    use PasswordValidationRules;

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
            'admin.name' => ['required', 'string', 'max:255'],
            'admin.email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')],
            'admin.password' => $this->passwordRules(),
        ];
    }
}
