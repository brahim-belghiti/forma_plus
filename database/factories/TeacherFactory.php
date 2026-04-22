<?php

namespace Database\Factories;

use App\Models\School;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Teacher>
 */
class TeacherFactory extends Factory
{
    public function definition(): array
    {
        return [
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'phone' => fake()->phoneNumber(),
            'salary_rate' => null,
            'school_id' => School::factory(),
        ];
    }

    public function withSalaryRate(float $rate = 50.00): static
    {
        return $this->state(fn () => ['salary_rate' => $rate]);
    }
}
