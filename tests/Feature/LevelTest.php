<?php

use App\Models\Level;
use App\Models\School;
use App\Models\User;

beforeEach(function () {
    $this->school = School::factory()->create();
    $this->user = User::factory()->create(['school_id' => $this->school->id]);
});

test('authenticated user can view levels index', function () {
    Level::factory()->count(3)->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->get(route('levels.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('levels/index')
        ->has('levels.data', 3)
    );
});

test('user only sees levels from their school', function () {
    Level::factory()->create(['school_id' => $this->school->id, 'name' => 'My Level']);
    Level::factory()->create(['name' => 'Other School Level']);

    $response = $this->actingAs($this->user)->get(route('levels.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('levels.data', 1)
        ->where('levels.data.0.name', 'My Level')
    );
});

test('user can create a level', function () {
    $response = $this->actingAs($this->user)->post(route('levels.store'), [
        'name' => '2eme Bac',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('levels', [
        'name' => '2eme Bac',
        'school_id' => $this->school->id,
    ]);
});

test('level name must be unique within a school', function () {
    Level::factory()->create(['school_id' => $this->school->id, 'name' => '2eme Bac']);

    $response = $this->actingAs($this->user)->post(route('levels.store'), [
        'name' => '2eme Bac',
    ]);

    $response->assertSessionHasErrors('name');
});

test('same level name can exist in different schools', function () {
    Level::factory()->create(['school_id' => $this->school->id, 'name' => '2eme Bac']);

    $otherSchool = School::factory()->create();
    $otherUser = User::factory()->create(['school_id' => $otherSchool->id]);

    $response = $this->actingAs($otherUser)->post(route('levels.store'), [
        'name' => '2eme Bac',
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();
});

test('user can update a level', function () {
    $level = Level::factory()->create(['school_id' => $this->school->id, 'name' => 'Old Name']);

    $response = $this->actingAs($this->user)->put(route('levels.update', $level), [
        'name' => 'New Name',
    ]);

    $response->assertRedirect();
    expect($level->fresh()->name)->toBe('New Name');
});

test('user can delete a level', function () {
    $level = Level::factory()->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->delete(route('levels.destroy', $level));

    $response->assertRedirect();
    $this->assertDatabaseMissing('levels', ['id' => $level->id]);
});

test('guest cannot access levels', function () {
    $response = $this->get(route('levels.index'));

    $response->assertRedirect(route('login'));
});
