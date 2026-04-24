<?php

namespace App\Http\Requests;

use App\Models\Subject;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', Subject::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'level_id' => ['required', 'exists:levels,id'],
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('subjects')
                    ->where('school_id', $this->user()->school_id)
                    ->where('level_id', $this->input('level_id')),
            ],
        ];
    }
}
