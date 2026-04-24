<?php

namespace Database\Factories;

use App\Models\Level;
use App\Models\School;
use App\Models\Subject;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Subject>
 */
class SubjectFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->randomElement([
                'Mathematiques',
                'Physique-Chimie',
                'Sciences de la Vie et de la Terre',
                'Francais',
                'Anglais',
                'Arabe',
            ]),
            'school_id' => School::factory(),
            'level_id' => Level::factory(),
        ];
    }
}
