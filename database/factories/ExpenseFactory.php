<?php

namespace Database\Factories;

use App\Models\Expense;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Expense>
 */
class ExpenseFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'description' => fake()->sentence(3),
            'amount' => fake()->randomFloat(2, 50, 2000),
            'spent_at' => fake()->date(),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
