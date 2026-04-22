<?php

use App\Models\Classroom;
use App\Models\School;
use App\Models\User;

beforeEach(function () {
    $this->school = School::factory()->create();
    $this->user = User::factory()->create(['school_id' => $this->school->id]);
});

test('authenticated user can view classrooms index', function () {
    Classroom::factory()->count(3)->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->get(route('classrooms.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('classrooms/index')
        ->has('classrooms.data', 3)
    );
});

test('user only sees classrooms from their school', function () {
    Classroom::factory()->create(['school_id' => $this->school->id, 'name' => 'Salle 1']);
    Classroom::factory()->create(['name' => 'Other School Room']);

    $response = $this->actingAs($this->user)->get(route('classrooms.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('classrooms.data', 1)
        ->where('classrooms.data.0.name', 'Salle 1')
    );
});

test('user can create a classroom', function () {
    $response = $this->actingAs($this->user)->post(route('classrooms.store'), [
        'name' => 'Salle 1',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('classrooms', [
        'name' => 'Salle 1',
        'school_id' => $this->school->id,
    ]);
});

test('classroom name must be unique within a school', function () {
    Classroom::factory()->create(['school_id' => $this->school->id, 'name' => 'Salle 1']);

    $response = $this->actingAs($this->user)->post(route('classrooms.store'), [
        'name' => 'Salle 1',
    ]);

    $response->assertSessionHasErrors('name');
});

test('same classroom name can exist in different schools', function () {
    Classroom::factory()->create(['school_id' => $this->school->id, 'name' => 'Salle 1']);

    $otherSchool = School::factory()->create();
    $otherUser = User::factory()->create(['school_id' => $otherSchool->id]);

    $response = $this->actingAs($otherUser)->post(route('classrooms.store'), [
        'name' => 'Salle 1',
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
});

test('user can update a classroom', function () {
    $classroom = Classroom::factory()->create(['school_id' => $this->school->id, 'name' => 'Old Name']);

    $response = $this->actingAs($this->user)->put(route('classrooms.update', $classroom), [
        'name' => 'New Name',
    ]);

    $response->assertRedirect();
    expect($classroom->fresh()->name)->toBe('New Name');
});

test('user can delete a classroom', function () {
    $classroom = Classroom::factory()->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->delete(route('classrooms.destroy', $classroom));

    $response->assertRedirect();
    $this->assertDatabaseMissing('classrooms', ['id' => $classroom->id]);
});

test('guest cannot access classrooms', function () {
    $response = $this->get(route('classrooms.index'));

    $response->assertRedirect(route('login'));
});
