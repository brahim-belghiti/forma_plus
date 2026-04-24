<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['school_id', 'enrollment_id', 'amount', 'period_month', 'period_year', 'paid_at', 'notes'])]
class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use BelongsToSchool, HasFactory;

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_at' => 'date',
        ];
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }
}
