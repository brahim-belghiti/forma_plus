<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = config('auth.super_admin.email');
        $password = config('auth.super_admin.password');
        $name = config('auth.super_admin.name', 'Super Admin');

        if (! $email || ! $password) {
            $this->command?->warn('Skipping SuperAdminSeeder: SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set in .env');

            return;
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make($password),
                'role' => UserRole::SuperAdmin,
                'school_id' => null,
                'email_verified_at' => now(),
            ],
        );
    }
}
