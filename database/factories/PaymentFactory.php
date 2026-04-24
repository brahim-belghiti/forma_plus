<?php

namespace Database\Factories;

use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'enrollment_id' => Enrollment::factory(),
            'amount' => fake()->randomFloat(2, 100, 1000),
            'period_month' => fake()->numberBetween(1, 12),
            'period_year' => fake()->numberBetween(2024, 2026),
            'paid_at' => fake()->date(),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
