<?php

use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\Group;
use App\Models\Level;
use App\Models\School;
use App\Models\Student;
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
    $this->group = Group::factory()->create([
        'school_id' => $this->school->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
    ]);
});

test('authenticated user can view sessions index', function () {
    ClassSession::factory()->count(3)->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
    ])->each(function ($session, $index) {
        $session->update(['date' => now()->subDays($index)->toDateString()]);
    });

    $response = $this->actingAs($this->user)->get(route('sessions.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('sessions/index')
        ->has('sessions.data', 3)
        ->has('groups.data')
    );
});

test('user only sees sessions from their school', function () {
    ClassSession::factory()->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
    ]);
    ClassSession::factory()->create();

    $response = $this->actingAs($this->user)->get(route('sessions.index'));

    $response->assertInertia(fn ($page) => $page->has('sessions.data', 1));
});

test('user can create a session', function () {
    $response = $this->actingAs($this->user)->post(route('sessions.store'), [
        'group_id' => $this->group->id,
        'date' => '2026-04-20',
        'teacher_present' => true,
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('class_sessions', [
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
        'date' => '2026-04-20',
        'teacher_present' => true,
    ]);
});

test('session requires group and date', function () {
    $this->actingAs($this->user)->post(route('sessions.store'), [])
        ->assertSessionHasErrors(['group_id', 'date']);
});

test('cannot create two sessions for same group on same date', function () {
    ClassSession::factory()->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
        'date' => '2026-04-20',
    ]);

    $this->actingAs($this->user)->post(route('sessions.store'), [
        'group_id' => $this->group->id,
        'date' => '2026-04-20',
    ])->assertSessionHasErrors('date');
});

test('session show exposes roster of enrolled students at that date', function () {
    $enrolled = Student::factory()->create(['school_id' => $this->school->id]);
    Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $enrolled->id,
        'group_id' => $this->group->id,
        'start_date' => '2026-03-01',
    ]);

    $notYetEnrolled = Student::factory()->create(['school_id' => $this->school->id]);
    Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $notYetEnrolled->id,
        'group_id' => $this->group->id,
        'start_date' => '2026-05-01',
    ]);

    $session = ClassSession::factory()->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
        'date' => '2026-04-15',
    ]);

    $response = $this->actingAs($this->user)->get(route('sessions.show', $session));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('sessions/show')
        ->has('roster.data', 1)
        ->where('roster.data.0.id', $enrolled->id)
    );
});

test('user can update session teacher_present and notes', function () {
    $session = ClassSession::factory()->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
        'teacher_present' => true,
    ]);

    $this->actingAs($this->user)->put(route('sessions.update', $session), [
        'teacher_present' => false,
        'notes' => 'Prof absent, séance reportée',
    ])->assertRedirect();

    $fresh = $session->fresh();
    expect($fresh->teacher_present)->toBeFalse();
    expect($fresh->notes)->toBe('Prof absent, séance reportée');
});

test('user can delete a session', function () {
    $session = ClassSession::factory()->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
    ]);

    $this->actingAs($this->user)->delete(route('sessions.destroy', $session))->assertRedirect();
    $this->assertDatabaseMissing('class_sessions', ['id' => $session->id]);
});

test('guest cannot access sessions', function () {
    $this->get(route('sessions.index'))->assertRedirect(route('login'));
});
