<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Database\Factories\ExpenseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['description', 'amount', 'spent_at', 'notes', 'school_id'])]
class Expense extends Model
{
    /** @use HasFactory<ExpenseFactory> */
    use BelongsToSchool, HasFactory;

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'spent_at' => 'date',
        ];
    }
}
