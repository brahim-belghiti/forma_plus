<?php

namespace Database\Factories;

use App\Models\Salary;
use App\Models\School;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Salary>
 */
class SalaryFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'teacher_id' => Teacher::factory(),
            'amount' => fake()->randomFloat(2, 500, 5000),
            'period_month' => fake()->numberBetween(1, 12),
            'period_year' => fake()->numberBetween(2024, 2026),
            'paid_at' => fake()->date(),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
