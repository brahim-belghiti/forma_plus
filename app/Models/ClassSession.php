<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Database\Factories\ClassSessionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;

#[Fillable(['school_id', 'group_id', 'date', 'teacher_present', 'notes'])]
class ClassSession extends Model
{
    /** @use HasFactory<ClassSessionFactory> */
    use BelongsToSchool, HasFactory;

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'teacher_present' => 'boolean',
        ];
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function teacher(): HasOneThrough
    {
        return $this->hasOneThrough(Teacher::class, Group::class, 'id', 'id', 'group_id', 'teacher_id');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }
}
