<?php

namespace Database\Factories;

use App\Models\Enrollment;
use App\Models\Group;
use App\Models\School;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Enrollment>
 */
class EnrollmentFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'student_id' => Student::factory(),
            'group_id' => Group::factory(),
            'monthly_fee' => fake()->randomElement([200, 250, 300, 350, 400]),
            'start_date' => now()->subMonths(fake()->numberBetween(0, 6))->toDateString(),
            'end_date' => null,
            'active' => true,
        ];
    }

    public function ended(): static
    {
        return $this->state(fn () => [
            'end_date' => now()->toDateString(),
            'active' => false,
        ]);
    }
}
