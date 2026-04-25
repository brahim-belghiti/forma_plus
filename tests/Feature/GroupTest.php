<?php

use App\Models\Group;
use App\Models\Level;
use App\Models\School;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;

beforeEach(function () {
    $this->school = School::factory()->create();
    $this->user = User::factory()->create(['school_id' => $this->school->id]);
    $this->teacher = Teacher::factory()->create(['school_id' => $this->school->id]);
    $this->level = Level::factory()->create(['school_id' => $this->school->id]);
    $this->subject = Subject::factory()->create([
        'school_id' => $this->school->id,
        'level_id' => $this->level->id,
    ]);
});

test('authenticated user can view groups index', function () {
    Group::factory()->count(3)->create([
        'school_id' => $this->school->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
    ]);

    $response = $this->actingAs($this->user)->get(route('groups.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('groups/index')
        ->has('groups.data', 3)
        ->has('subjects.data')
        ->has('teachers.data')
    );
});

test('user only sees groups from their school', function () {
    Group::factory()->create([
        'school_id' => $this->school->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'name' => 'Mine',
    ]);
    Group::factory()->create(['name' => 'Other']);

    $response = $this->actingAs($this->user)->get(route('groups.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('groups.data', 1)
        ->where('groups.data.0.name', 'Mine')
    );
});

test('groups can be filtered by search', function () {
    Group::factory()->create([
        'school_id' => $this->school->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'name' => '1ac-1',
    ]);
    Group::factory()->create([
        'school_id' => $this->school->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'name' => '2ac-1',
    ]);

    $response = $this->actingAs($this->user)->get(route('groups.index', ['search' => '1ac']));

    $response->assertInertia(fn ($page) => $page->has('groups.data', 1));
});

test('user can create a group', function () {
    $response = $this->actingAs($this->user)->post(route('groups.store'), [
        'name' => '1ac-1',
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'active' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('groups', [
        'school_id' => $this->school->id,
        'name' => '1ac-1',
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
    ]);
});

test('group can store a default monthly fee', function () {
    $this->actingAs($this->user)->post(route('groups.store'), [
        'name' => 'math-1ac',
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'default_monthly_fee' => 350.50,
        'active' => true,
    ])->assertRedirect();

    $group = Group::where('name', 'math-1ac')->first();
    expect((float) $group->default_monthly_fee)->toBe(350.50);
});

test('default monthly fee must be non-negative', function () {
    $this->actingAs($this->user)->post(route('groups.store'), [
        'name' => 'math-1ac',
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'default_monthly_fee' => -10,
    ])->assertSessionHasErrors('default_monthly_fee');
});

test('group requires name, subject, and teacher', function () {
    $this->actingAs($this->user)->post(route('groups.store'), [])
        ->assertSessionHasErrors(['name', 'subject_id', 'teacher_id']);
});

test('user can update a group', function () {
    $group = Group::factory()->create([
        'school_id' => $this->school->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'name' => 'Old',
    ]);

    $response = $this->actingAs($this->user)->put(route('groups.update', $group), [
        'name' => 'New',
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
        'active' => true,
    ]);

    $response->assertRedirect();
    expect($group->fresh()->name)->toBe('New');
});

test('user can delete a group', function () {
    $group = Group::factory()->create([
        'school_id' => $this->school->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
    ]);

    $response = $this->actingAs($this->user)->delete(route('groups.destroy', $group));

    $response->assertRedirect();
    $this->assertDatabaseMissing('groups', ['id' => $group->id]);
});

test('user cannot update a group from another school', function () {
    $otherSchool = School::factory()->create();
    $otherLevel = Level::factory()->create(['school_id' => $otherSchool->id]);
    $otherSubject = Subject::factory()->create([
        'school_id' => $otherSchool->id,
        'level_id' => $otherLevel->id,
    ]);
    $otherTeacher = Teacher::factory()->create(['school_id' => $otherSchool->id]);
    $otherGroup = Group::factory()->create([
        'school_id' => $otherSchool->id,
        'subject_id' => $otherSubject->id,
        'teacher_id' => $otherTeacher->id,
    ]);

    $this->actingAs($this->user)->put(route('groups.update', $otherGroup), [
        'name' => 'Hacked',
        'subject_id' => $otherSubject->id,
        'teacher_id' => $otherTeacher->id,
    ])->assertNotFound();
});

test('guest cannot access groups', function () {
    $this->get(route('groups.index'))->assertRedirect(route('login'));
});
