<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Database\Factories\SalaryFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['teacher_id', 'amount', 'period_month', 'period_year', 'paid_at', 'notes', 'school_id'])]
class Salary extends Model
{
    /** @use HasFactory<SalaryFactory> */
    use BelongsToSchool, HasFactory;

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'date',
        ];
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }
}
