<?php

use App\Models\Level;
use App\Models\School;
use App\Models\Subject;
use App\Models\User;

beforeEach(function () {
    $this->school = School::factory()->create();
    $this->user = User::factory()->create(['school_id' => $this->school->id]);
    $this->level = Level::factory()->create(['school_id' => $this->school->id]);
});

test('authenticated user can view subjects index', function () {
    Subject::factory()->count(3)->create([
        'school_id' => $this->school->id,
        'level_id' => $this->level->id,
    ]);

    $response = $this->actingAs($this->user)->get(route('subjects.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('subjects/index')
        ->has('subjects.data', 3)
        ->has('levels.data')
    );
});

test('user only sees subjects from their school', function () {
    Subject::factory()->create([
        'school_id' => $this->school->id,
        'level_id' => $this->level->id,
        'name' => 'My Subject',
    ]);
    Subject::factory()->create(['name' => 'Other School Subject']);

    $response = $this->actingAs($this->user)->get(route('subjects.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('subjects.data', 1)
        ->where('subjects.data.0.name', 'My Subject')
    );
});

test('user can create a subject', function () {
    $response = $this->actingAs($this->user)->post(route('subjects.store'), [
        'name' => 'Mathematiques',
        'level_id' => $this->level->id,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('subjects', [
        'name' => 'Mathematiques',
        'school_id' => $this->school->id,
        'level_id' => $this->level->id,
    ]);
});

test('subject name must be unique within a school and level', function () {
    Subject::factory()->create([
        'school_id' => $this->school->id,
        'level_id' => $this->level->id,
        'name' => 'Mathematiques',
    ]);

    $response = $this->actingAs($this->user)->post(route('subjects.store'), [
        'name' => 'Mathematiques',
        'level_id' => $this->level->id,
    ]);

    $response->assertSessionHasErrors('name');
});

test('same subject name is allowed at different levels', function () {
    $otherLevel = Level::factory()->create(['school_id' => $this->school->id]);
    Subject::factory()->create([
        'school_id' => $this->school->id,
        'level_id' => $this->level->id,
        'name' => 'Mathematiques',
    ]);

    $response = $this->actingAs($this->user)->post(route('subjects.store'), [
        'name' => 'Mathematiques',
        'level_id' => $otherLevel->id,
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
});

test('user can update a subject', function () {
    $subject = Subject::factory()->create([
        'school_id' => $this->school->id,
        'level_id' => $this->level->id,
        'name' => 'Old Name',
    ]);

    $response = $this->actingAs($this->user)->put(route('subjects.update', $subject), [
        'name' => 'New Name',
        'level_id' => $this->level->id,
    ]);

    $response->assertRedirect();
    expect($subject->fresh()->name)->toBe('New Name');
});

test('user can delete a subject', function () {
    $subject = Subject::factory()->create([
        'school_id' => $this->school->id,
        'level_id' => $this->level->id,
    ]);

    $response = $this->actingAs($this->user)->delete(route('subjects.destroy', $subject));

    $response->assertRedirect();
    $this->assertDatabaseMissing('subjects', ['id' => $subject->id]);
});

test('guest cannot access subjects', function () {
    $response = $this->get(route('subjects.index'));

    $response->assertRedirect(route('login'));
});
