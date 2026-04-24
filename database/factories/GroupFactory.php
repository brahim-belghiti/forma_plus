<?php

namespace Database\Factories;

use App\Models\Group;
use App\Models\School;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Group>
 */
class GroupFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'subject_id' => Subject::factory(),
            'teacher_id' => Teacher::factory(),
            'name' => 'Groupe '.fake()->bothify('??-##'),
            'active' => true,
        ];
    }
}
