<?php

use App\Enums\UserRole;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->superAdmin = User::factory()->superAdmin()->create();
});

test('super admin can view schools index', function () {
    School::factory()->count(3)->create();

    $response = $this->actingAs($this->superAdmin)->get(route('admin.schools.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/schools/index')
        ->has('schools.data', 3)
    );
});

test('super admin can view a single school', function () {
    $school = School::factory()->create();
    User::factory()->admin()->create(['school_id' => $school->id]);

    $response = $this->actingAs($this->superAdmin)->get(route('admin.schools.show', $school));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('admin/schools/show')
        ->where('school.data.id', $school->id)
        ->has('school.data.admin')
    );
});

test('super admin can create a school with its admin atomically', function () {
    $response = $this->actingAs($this->superAdmin)->post(route('admin.schools.store'), [
        'name' => 'École des Cèdres',
        'default_salary_rate' => 75.50,
        'admin' => [
            'name' => 'Karim Bensalem',
            'email' => 'karim@cedres.test',
            'password' => 'StrongPass!1',
            'password_confirmation' => 'StrongPass!1',
        ],
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('schools', [
        'name' => 'École des Cèdres',
        'default_salary_rate' => 75.50,
    ]);

    $school = School::where('name', 'École des Cèdres')->first();

    $this->assertDatabaseHas('users', [
        'name' => 'Karim Bensalem',
        'email' => 'karim@cedres.test',
        'role' => UserRole::Admin->value,
        'school_id' => $school->id,
    ]);

    expect($school->admin->email_verified_at)->not->toBeNull();
});

test('store rejects mismatched admin password confirmation', function () {
    $response = $this->actingAs($this->superAdmin)->post(route('admin.schools.store'), [
        'name' => 'École X',
        'admin' => [
            'name' => 'Admin X',
            'email' => 'x@test.test',
            'password' => 'StrongPass!1',
            'password_confirmation' => 'Different!1',
        ],
    ]);

    $response->assertSessionHasErrors('admin.password');
    $this->assertDatabaseMissing('schools', ['name' => 'École X']);
});

test('store rejects duplicate school name', function () {
    School::factory()->create(['name' => 'École Existante']);

    $response = $this->actingAs($this->superAdmin)->post(route('admin.schools.store'), [
        'name' => 'École Existante',
        'admin' => [
            'name' => 'Admin',
            'email' => 'a@test.test',
            'password' => 'StrongPass!1',
            'password_confirmation' => 'StrongPass!1',
        ],
    ]);

    $response->assertSessionHasErrors('name');
});

test('super admin can update a school', function () {
    $school = School::factory()->create(['name' => 'Old Name']);

    $response = $this->actingAs($this->superAdmin)->put(
        route('admin.schools.update', $school),
        ['name' => 'New Name', 'default_salary_rate' => 90],
    );

    $response->assertRedirect();
    expect($school->fresh()->name)->toBe('New Name');
});

test('super admin can delete an empty school', function () {
    $school = School::factory()->create();
    $admin = User::factory()->admin()->create(['school_id' => $school->id]);

    $response = $this->actingAs($this->superAdmin)->delete(
        route('admin.schools.destroy', $school),
    );

    $response->assertRedirect();
    $this->assertDatabaseMissing('schools', ['id' => $school->id]);
    $this->assertDatabaseMissing('users', ['id' => $admin->id]);
});

test('delete is blocked when school has students', function () {
    $school = School::factory()->create();
    Student::factory()->create(['school_id' => $school->id]);

    $response = $this->actingAs($this->superAdmin)->delete(
        route('admin.schools.destroy', $school),
    );

    $response->assertSessionHasErrors('school');
    $this->assertDatabaseHas('schools', ['id' => $school->id]);
});

test('delete is blocked when school has teachers', function () {
    $school = School::factory()->create();
    Teacher::factory()->create(['school_id' => $school->id]);

    $response = $this->actingAs($this->superAdmin)->delete(
        route('admin.schools.destroy', $school),
    );

    $response->assertSessionHasErrors('school');
    $this->assertDatabaseHas('schools', ['id' => $school->id]);
});

test('delete is blocked when school has payments', function () {
    $school = School::factory()->create();
    Payment::factory()->create(['school_id' => $school->id]);

    $response = $this->actingAs($this->superAdmin)->delete(
        route('admin.schools.destroy', $school),
    );

    $response->assertSessionHasErrors('school');
});

test('delete is blocked when school has expenses', function () {
    $school = School::factory()->create();
    Expense::factory()->create(['school_id' => $school->id]);

    $response = $this->actingAs($this->superAdmin)->delete(
        route('admin.schools.destroy', $school),
    );

    $response->assertSessionHasErrors('school');
});

test('delete is blocked when school has secretaries', function () {
    $school = School::factory()->create();
    User::factory()->create([
        'school_id' => $school->id,
        'role' => UserRole::Secretary,
    ]);

    $response = $this->actingAs($this->superAdmin)->delete(
        route('admin.schools.destroy', $school),
    );

    $response->assertSessionHasErrors('school');
});

test('super admin can reset the school admin password', function () {
    $school = School::factory()->create();
    $admin = User::factory()->admin()->create(['school_id' => $school->id]);

    $response = $this->actingAs($this->superAdmin)->put(
        route('admin.schools.admin-password', $school),
        ['password' => 'BrandNew!1', 'password_confirmation' => 'BrandNew!1'],
    );

    $response->assertRedirect();
    expect(Hash::check('BrandNew!1', $admin->fresh()->password))->toBeTrue();
});

test('reset password fails when school has no admin', function () {
    $school = School::factory()->create();

    $response = $this->actingAs($this->superAdmin)->put(
        route('admin.schools.admin-password', $school),
        ['password' => 'BrandNew!1', 'password_confirmation' => 'BrandNew!1'],
    );

    $response->assertSessionHasErrors('admin');
});

test('school admin cannot access super admin routes', function () {
    $school = School::factory()->create();
    $admin = User::factory()->admin()->create(['school_id' => $school->id]);

    $this->actingAs($admin)->get(route('admin.schools.index'))->assertForbidden();
    $this->actingAs($admin)->get(route('admin.dashboard'))->assertForbidden();
    $this->actingAs($admin)->post(route('admin.schools.store'), [])->assertForbidden();
});

test('secretary cannot access super admin routes', function () {
    $school = School::factory()->create();
    $secretary = User::factory()->create([
        'school_id' => $school->id,
        'role' => UserRole::Secretary,
    ]);

    $this->actingAs($secretary)->get(route('admin.schools.index'))->assertForbidden();
});

test('guest cannot access super admin routes', function () {
    $this->get(route('admin.schools.index'))->assertRedirect(route('login'));
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
});
