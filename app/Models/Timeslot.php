<?php

namespace App\Models;

use App\Enums\DayOfWeek;
use App\Models\Traits\BelongsToSchool;
use Database\Factories\TimeslotFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['teacher_id', 'subject_id', 'level_id', 'classroom_id', 'day_of_week', 'start_time', 'end_time', 'school_id'])]
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

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function level(): BelongsTo
    {
        return $this->belongsTo(Level::class);
    }

    public function classroom(): BelongsTo
    {
        return $this->belongsTo(Classroom::class);
    }
}
