<?php

namespace Database\Factories;

use App\Enums\DayOfWeek;
use App\Models\Classroom;
use App\Models\Group;
use App\Models\School;
use App\Models\Timeslot;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Timeslot>
 */
class TimeslotFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $hour = fake()->numberBetween(8, 20);

        return [
            'school_id' => School::factory(),
            'group_id' => Group::factory(),
            'classroom_id' => Classroom::factory(),
            'day_of_week' => fake()->randomElement(DayOfWeek::cases()),
            'start_time' => sprintf('%02d:00', $hour),
            'end_time' => sprintf('%02d:00', $hour + 2),
        ];
    }
}
