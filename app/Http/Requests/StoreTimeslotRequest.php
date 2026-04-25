<?php

namespace App\Http\Requests;

use App\Concerns\ValidatesTimeslotConflicts;
use App\Enums\DayOfWeek;
use App\Models\Timeslot;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTimeslotRequest extends FormRequest
{
    use ValidatesTimeslotConflicts;

    public function authorize(): bool
    {
        return $this->user()->can('create', Timeslot::class);
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
