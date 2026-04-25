<?php

namespace App\Http\Requests;

use App\Models\ClassSession;
use Illuminate\Foundation\Http\FormRequest;

class StoreClassSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->can('create', ClassSession::class);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'group_id' => ['required', 'exists:groups,id'],
            'date' => ['required', 'date'],
            'teacher_present' => ['boolean'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (! $this->filled(['group_id', 'date'])) {
                return;
            }

            $exists = ClassSession::query()
                ->where('group_id', $this->integer('group_id'))
                ->whereDate('date', $this->date('date'))
                ->exists();

            if ($exists) {
                $validator->errors()->add('date', 'Une séance existe déjà pour ce groupe à cette date.');
            }
        });
    }
}
