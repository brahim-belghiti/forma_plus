<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Database\Factories\TeacherFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['first_name', 'last_name', 'phone', 'salary_rate', 'school_id', 'user_id'])]
class Teacher extends Model
{
    /** @use HasFactory<TeacherFactory> */
    use BelongsToSchool, HasFactory;

    protected function casts(): array
    {
        return [
            'salary_rate' => 'decimal:2',
        ];
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class);
    }

    public function levels(): BelongsToMany
    {
        return $this->belongsToMany(Level::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function fullName(): string
    {
        return $this->first_name.' '.$this->last_name;
    }

    public function effectiveSalaryRate(): float
    {
        return (float) ($this->salary_rate ?? $this->school->default_salary_rate);
    }
}
