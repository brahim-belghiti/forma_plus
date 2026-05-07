<?php

namespace App\Models;

use App\Enums\UserRole;
use Database\Factories\SchoolFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable(['name', 'default_salary_rate'])]
class School extends Model
{
    /** @use HasFactory<SchoolFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'default_salary_rate' => 'decimal:2',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function admin(): HasOne
    {
        return $this->hasOne(User::class)->where('role', UserRole::Admin);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function teachers(): HasMany
    {
        return $this->hasMany(Teacher::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }

    public function hasData(): bool
    {
        return $this->students()->exists()
            || $this->teachers()->exists()
            || $this->payments()->exists()
            || $this->expenses()->exists()
            || $this->users()->where('role', UserRole::Secretary)->exists();
    }
}
