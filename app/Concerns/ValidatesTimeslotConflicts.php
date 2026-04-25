<?php

namespace App\Concerns;

use App\Models\Group;
use App\Models\Timeslot;
use Illuminate\Validation\Validator;

trait ValidatesTimeslotConflicts
{
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $errors = $v->errors();

            if ($errors->hasAny(['classroom_id', 'group_id', 'day_of_week', 'start_time', 'end_time'])) {
                return;
            }

            $excludeId = $this->route('timeslot')?->id;
            $start = $this->input('start_time');
            $end = $this->input('end_time');
            $day = $this->input('day_of_week');

            $classroomConflict = Timeslot::query()
                ->where('classroom_id', $this->input('classroom_id'))
                ->where('day_of_week', $day)
                ->where('start_time', '<', $end)
                ->where('end_time', '>', $start)
                ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
                ->exists();

            if ($classroomConflict) {
                $v->errors()->add('classroom_id', 'Cette salle est déjà réservée pour ce créneau.');
            }

            $group = Group::find($this->input('group_id'));

            if ($group !== null) {
                $teacherConflict = Timeslot::query()
                    ->whereHas('group', fn ($q) => $q->where('teacher_id', $group->teacher_id))
                    ->where('day_of_week', $day)
                    ->where('start_time', '<', $end)
                    ->where('end_time', '>', $start)
                    ->when($excludeId, fn ($q) => $q->where('id', '!=', $excludeId))
                    ->exists();

                if ($teacherConflict) {
                    $v->errors()->add('group_id', 'Ce professeur a déjà un autre cours à ce moment.');
                }
            }
        });
    }
}
