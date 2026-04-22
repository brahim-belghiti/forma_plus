<?php

namespace Database\Factories;

use App\Models\Level;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Level>
 */
class LevelFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->unique()->randomElement([
                '1ere Annee College',
                '2eme Annee College',
                '3eme Annee College',
                'Tronc Commun',
                '1ere Bac',
                '2eme Bac',
            ]),
            'school_id' => School::factory(),
        ];
    }
}
