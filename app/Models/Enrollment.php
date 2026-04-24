<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Carbon\CarbonImmutable;
use Database\Factories\EnrollmentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'school_id',
    'student_id',
    'group_id',
    'monthly_fee',
    'start_date',
    'end_date',
    'active',
])]
class Enrollment extends Model
{
    /** @use HasFactory<EnrollmentFactory> */
    use BelongsToSchool, HasFactory;

    protected function casts(): array
    {
        return [
            'monthly_fee' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
            'active' => 'boolean',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(Group::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('active', true);
    }

    public function end(?string $date = null): void
    {
        $this->update([
            'end_date' => $date ?? now()->toDateString(),
            'active' => false,
        ]);
    }

    /**
     * Months between start_date and min(end_date, today) that have no payment yet.
     *
     * @return array<int, array{year: int, month: int}>
     */
    public function unpaidPeriods(): array
    {
        $cursor = CarbonImmutable::parse($this->start_date)->startOfMonth();
        $end = CarbonImmutable::parse($this->end_date ?? now())->startOfMonth();

        $paid = $this->payments
            ->map(fn (Payment $p) => $p->period_year.'-'.str_pad((string) $p->period_month, 2, '0', STR_PAD_LEFT))
            ->all();

        $periods = [];
        while ($cursor->lessThanOrEqualTo($end)) {
            $key = $cursor->year.'-'.str_pad((string) $cursor->month, 2, '0', STR_PAD_LEFT);
            if (! in_array($key, $paid, true)) {
                $periods[] = ['year' => $cursor->year, 'month' => $cursor->month];
            }
            $cursor = $cursor->addMonth();
        }

        return $periods;
    }
}
