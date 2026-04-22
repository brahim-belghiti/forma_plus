<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        $school = School::create([
            'name' => 'Forma+',
            'default_salary_rate' => 60.00,
        ]);

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@forma.plus',
            'role' => UserRole::Admin,
            'school_id' => $school->id,
        ]);

        User::factory()->create([
            'name' => 'Secretary',
            'email' => 'secretary@forma.plus',
            'role' => UserRole::Secretary,
            'school_id' => $school->id,
        ]);
    }
}
