<?php

namespace App\Http\Requests;

use App\Concerns\ValidatesTimeslotConflicts;
use App\Enums\DayOfWeek;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTimeslotRequest extends FormRequest
{
    use ValidatesTimeslotConflicts;

    public function authorize(): bool
    {
        return $this->user()->can('update', $this->route('timeslot'));
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'group_id' => ['required', 'exists:groups,id'],
            'classroom_id' => ['required', 'exists:classrooms,id'],
            'day_of_week' => ['required', Rule::enum(DayOfWeek::class)],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
        ];
    }
}
