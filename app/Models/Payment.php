<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable(['school_id', 'enrollment_id', 'amount', 'period_month', 'period_year', 'paid_at', 'notes', 'recorded_by'])]
class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use BelongsToSchool, HasFactory;

    protected static function booted(): void
    {
        static::creating(function (Payment $payment) {
            $payment->receipt_number ??= (string) Str::ulid();
        });
    }

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

    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
