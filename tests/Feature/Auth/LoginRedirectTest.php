<?php

use App\Enums\UserRole;
use App\Models\School;
use App\Models\User;

test('super admin is redirected to admin dashboard after login', function () {
    $superAdmin = User::factory()->superAdmin()->create();

    $response = $this->post(route('login.store'), [
        'email' => $superAdmin->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($superAdmin);
    $response->assertRedirect(route('admin.dashboard', absolute: false));
});

test('school admin is redirected to the regular dashboard after login', function () {
    $school = School::factory()->create();
    $admin = User::factory()->admin()->create(['school_id' => $school->id]);

    $response = $this->post(route('login.store'), [
        'email' => $admin->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($admin);
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('secretary is redirected to the regular dashboard after login', function () {
    $school = School::factory()->create();
    $secretary = User::factory()->create([
        'school_id' => $school->id,
        'role' => UserRole::Secretary,
    ]);

    $response = $this->post(route('login.store'), [
        'email' => $secretary->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticatedAs($secretary);
    $response->assertRedirect(route('dashboard', absolute: false));
});
