<?php

use App\Enums\UserRole;
use App\Models\School;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    $this->school = School::factory()->create();
    $this->admin = User::factory()->admin()->create(['school_id' => $this->school->id]);
});

test('admin can view personnel index', function () {
    User::factory()->count(2)->create([
        'school_id' => $this->school->id,
        'role' => UserRole::Secretary,
    ]);

    $response = $this->actingAs($this->admin)->get(route('personnel.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('personnel/index')
        ->has('personnel.data', 2)
    );
});

test('admin only sees secretaries from their school', function () {
    User::factory()->create([
        'school_id' => $this->school->id,
        'role' => UserRole::Secretary,
        'name' => 'Mine',
    ]);
    User::factory()->create([
        'role' => UserRole::Secretary,
        'name' => 'Other',
    ]);

    $response = $this->actingAs($this->admin)->get(route('personnel.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('personnel.data', 1)
        ->where('personnel.data.0.name', 'Mine')
    );
});

test('admin index does not include other admins', function () {
    User::factory()->admin()->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->admin)->get(route('personnel.index'));

    $response->assertInertia(fn ($page) => $page->has('personnel.data', 0));
});

test('secretary cannot access personnel index', function () {
    $secretary = User::factory()->create([
        'school_id' => $this->school->id,
        'role' => UserRole::Secretary,
    ]);

    $response = $this->actingAs($secretary)->get(route('personnel.index'));

    $response->assertForbidden();
});

test('admin can create a secretary', function () {
    $response = $this->actingAs($this->admin)->post(route('personnel.store'), [
        'name' => 'Sara Secrétaire',
        'email' => 'sara@example.com',
        'password' => 'StrongPass!1',
        'password_confirmation' => 'StrongPass!1',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'name' => 'Sara Secrétaire',
        'email' => 'sara@example.com',
        'role' => UserRole::Secretary->value,
        'school_id' => $this->school->id,
    ]);
});

test('store rejects mismatched password confirmation', function () {
    $response = $this->actingAs($this->admin)->post(route('personnel.store'), [
        'name' => 'Sara',
        'email' => 'sara@example.com',
        'password' => 'StrongPass!1',
        'password_confirmation' => 'Different!1',
    ]);

    $response->assertSessionHasErrors('password');
});

test('secretary cannot create another secretary', function () {
    $secretary = User::factory()->create([
        'school_id' => $this->school->id,
        'role' => UserRole::Secretary,
    ]);

    $response = $this->actingAs($secretary)->post(route('personnel.store'), [
        'name' => 'New',
        'email' => 'new@example.com',
        'password' => 'StrongPass!1',
        'password_confirmation' => 'StrongPass!1',
    ]);

    $response->assertForbidden();
});

test('admin can update a secretary in their school', function () {
    $secretary = User::factory()->create([
        'school_id' => $this->school->id,
        'role' => UserRole::Secretary,
    ]);

    $response = $this->actingAs($this->admin)->put(
        route('personnel.update', ['personnel' => $secretary]),
        ['name' => 'Updated', 'email' => 'updated@example.com'],
    );

    $response->assertRedirect();
    expect($secretary->fresh()->name)->toBe('Updated');
});

test('admin cannot update a secretary from another school', function () {
    $other = User::factory()->create(['role' => UserRole::Secretary]);

    $response = $this->actingAs($this->admin)->put(
        route('personnel.update', ['personnel' => $other]),
        ['name' => 'Hacked', 'email' => 'hacked@example.com'],
    );

    $response->assertForbidden();
});

test('admin cannot update another admin via personnel route', function () {
    $otherAdmin = User::factory()->admin()->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->admin)->put(
        route('personnel.update', ['personnel' => $otherAdmin]),
        ['name' => 'Hacked', 'email' => 'hacked@example.com'],
    );

    $response->assertForbidden();
});

test('admin can delete a secretary', function () {
    $secretary = User::factory()->create([
        'school_id' => $this->school->id,
        'role' => UserRole::Secretary,
    ]);

    $response = $this->actingAs($this->admin)->delete(
        route('personnel.destroy', ['personnel' => $secretary]),
    );

    $response->assertRedirect();
    $this->assertDatabaseMissing('users', ['id' => $secretary->id]);
});

test('admin can reset a secretary password', function () {
    $secretary = User::factory()->create([
        'school_id' => $this->school->id,
        'role' => UserRole::Secretary,
    ]);

    $response = $this->actingAs($this->admin)->put(
        route('personnel.password', ['personnel' => $secretary]),
        ['password' => 'BrandNew!1', 'password_confirmation' => 'BrandNew!1'],
    );

    $response->assertRedirect();
    expect(Hash::check('BrandNew!1', $secretary->fresh()->password))->toBeTrue();
});

test('admin cannot reset a secretary password in another school', function () {
    $other = User::factory()->create(['role' => UserRole::Secretary]);

    $response = $this->actingAs($this->admin)->put(
        route('personnel.password', ['personnel' => $other]),
        ['password' => 'BrandNew!1', 'password_confirmation' => 'BrandNew!1'],
    );

    $response->assertForbidden();
});

test('guest cannot access personnel routes', function () {
    $this->get(route('personnel.index'))->assertRedirect(route('login'));
});
