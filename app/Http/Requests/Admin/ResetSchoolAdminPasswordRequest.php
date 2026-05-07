<?php

namespace App\Http\Requests\Admin;

use App\Concerns\PasswordValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class ResetSchoolAdminPasswordRequest extends FormRequest
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
            'password' => $this->passwordRules(),
        ];
    }
}
