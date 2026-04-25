<?php

namespace Database\Factories;

use App\Models\ClassSession;
use App\Models\Group;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ClassSession>
 */
class ClassSessionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'group_id' => Group::factory(),
            'date' => fake()->dateTimeBetween('-3 months', 'now')->format('Y-m-d'),
            'teacher_present' => true,
            'notes' => null,
        ];
    }
}
