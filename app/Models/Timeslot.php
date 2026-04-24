<?php

namespace App\Models;

use App\Enums\DayOfWeek;
use App\Models\Traits\BelongsToSchool;
use Database\Factories\TimeslotFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['school_id', 'group_id', 'classroom_id', 'day_of_week', 'start_time', 'end_time'])]
class Timeslot extends Model
{
    /** @use HasFactory<TimeslotFactory> */
    use BelongsToSchool, HasFactory;

    protected function casts(): array
    {
        return [
            'day_of_week' => DayOfWeek::class,
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }
}
