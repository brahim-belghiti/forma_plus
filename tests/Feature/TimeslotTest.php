<?php

use App\Enums\DayOfWeek;
use App\Models\Classroom;
use App\Models\Group;
use App\Models\Level;
use App\Models\School;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Timeslot;
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
    $this->classroom = Classroom::factory()->create(['school_id' => $this->school->id]);
    $this->group = Group::factory()->create([
        'school_id' => $this->school->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
    ]);
});

test('authenticated user can view timeslots index', function () {
    Timeslot::factory()->count(3)->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
        'classroom_id' => $this->classroom->id,
    ]);

    $response = $this->actingAs($this->user)->get(route('timeslots.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('timeslots/index')
        ->has('timeslots.data', 3)
        ->has('groups.data')
        ->has('classrooms.data')
    );
});

test('user only sees timeslots from their school', function () {
    Timeslot::factory()->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
        'classroom_id' => $this->classroom->id,
    ]);
    Timeslot::factory()->create();

    $response = $this->actingAs($this->user)->get(route('timeslots.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('timeslots.data', 1)
    );
});

test('user can create a timeslot', function () {
    $response = $this->actingAs($this->user)->post(route('timeslots.store'), [
        'group_id' => $this->group->id,
        'classroom_id' => $this->classroom->id,
        'day_of_week' => DayOfWeek::Monday->value,
        'start_time' => '09:00',
        'end_time' => '11:00',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('timeslots', [
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
        'classroom_id' => $this->classroom->id,
        'day_of_week' => DayOfWeek::Monday->value,
    ]);
});

test('timeslot requires all fields', function () {
    $response = $this->actingAs($this->user)->post(route('timeslots.store'), []);

    $response->assertSessionHasErrors([
        'group_id', 'classroom_id', 'day_of_week', 'start_time', 'end_time',
    ]);
});

test('end time must be after start time', function () {
    $response = $this->actingAs($this->user)->post(route('timeslots.store'), [
        'group_id' => $this->group->id,
        'classroom_id' => $this->classroom->id,
        'day_of_week' => DayOfWeek::Monday->value,
        'start_time' => '11:00',
        'end_time' => '09:00',
    ]);

    $response->assertSessionHasErrors('end_time');
});

test('user can update a timeslot', function () {
    $timeslot = Timeslot::factory()->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
        'classroom_id' => $this->classroom->id,
        'day_of_week' => DayOfWeek::Monday,
        'start_time' => '09:00',
        'end_time' => '11:00',
    ]);

    $newClassroom = Classroom::factory()->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->put(route('timeslots.update', $timeslot), [
        'group_id' => $this->group->id,
        'classroom_id' => $newClassroom->id,
        'day_of_week' => DayOfWeek::Tuesday->value,
        'start_time' => '14:00',
        'end_time' => '16:00',
    ]);

    $response->assertRedirect();
    expect($timeslot->fresh())
        ->classroom_id->toBe($newClassroom->id)
        ->day_of_week->toBe(DayOfWeek::Tuesday);
});

test('user can delete a timeslot', function () {
    $timeslot = Timeslot::factory()->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
        'classroom_id' => $this->classroom->id,
    ]);

    $response = $this->actingAs($this->user)->delete(route('timeslots.destroy', $timeslot));

    $response->assertRedirect();
    $this->assertDatabaseMissing('timeslots', ['id' => $timeslot->id]);
});

test('guest cannot access timeslots', function () {
    $response = $this->get(route('timeslots.index'));

    $response->assertRedirect(route('login'));
});

test('cannot create a timeslot that double-books a classroom', function () {
    Timeslot::factory()->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
        'classroom_id' => $this->classroom->id,
        'day_of_week' => DayOfWeek::Monday,
        'start_time' => '09:00',
        'end_time' => '11:00',
    ]);

    $otherTeacher = Teacher::factory()->create(['school_id' => $this->school->id]);
    $otherGroup = Group::factory()->create([
        'school_id' => $this->school->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $otherTeacher->id,
    ]);

    $response = $this->actingAs($this->user)->post(route('timeslots.store'), [
        'group_id' => $otherGroup->id,
        'classroom_id' => $this->classroom->id,
        'day_of_week' => DayOfWeek::Monday->value,
        'start_time' => '10:00',
        'end_time' => '12:00',
    ]);

    $response->assertSessionHasErrors('classroom_id');
});

test('cannot create a timeslot that double-books a teacher', function () {
    Timeslot::factory()->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
        'classroom_id' => $this->classroom->id,
        'day_of_week' => DayOfWeek::Monday,
        'start_time' => '09:00',
        'end_time' => '11:00',
    ]);

    $otherClassroom = Classroom::factory()->create(['school_id' => $this->school->id]);
    $sameTeacherGroup = Group::factory()->create([
        'school_id' => $this->school->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $this->teacher->id,
    ]);

    $response = $this->actingAs($this->user)->post(route('timeslots.store'), [
        'group_id' => $sameTeacherGroup->id,
        'classroom_id' => $otherClassroom->id,
        'day_of_week' => DayOfWeek::Monday->value,
        'start_time' => '10:00',
        'end_time' => '12:00',
    ]);

    $response->assertSessionHasErrors('group_id');
});

test('non-overlapping timeslots in same classroom are allowed', function () {
    Timeslot::factory()->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
        'classroom_id' => $this->classroom->id,
        'day_of_week' => DayOfWeek::Monday,
        'start_time' => '09:00',
        'end_time' => '10:30',
    ]);

    $otherTeacher = Teacher::factory()->create(['school_id' => $this->school->id]);
    $otherGroup = Group::factory()->create([
        'school_id' => $this->school->id,
        'subject_id' => $this->subject->id,
        'teacher_id' => $otherTeacher->id,
    ]);

    $response = $this->actingAs($this->user)->post(route('timeslots.store'), [
        'group_id' => $otherGroup->id,
        'classroom_id' => $this->classroom->id,
        'day_of_week' => DayOfWeek::Monday->value,
        'start_time' => '10:30',
        'end_time' => '12:00',
    ]);

    $response->assertSessionHasNoErrors();
    $this->assertDatabaseCount('timeslots', 2);
});

test('updating a timeslot does not conflict with itself', function () {
    $timeslot = Timeslot::factory()->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
        'classroom_id' => $this->classroom->id,
        'day_of_week' => DayOfWeek::Monday,
        'start_time' => '09:00',
        'end_time' => '11:00',
    ]);

    $response = $this->actingAs($this->user)->put(route('timeslots.update', $timeslot), [
        'group_id' => $this->group->id,
        'classroom_id' => $this->classroom->id,
        'day_of_week' => DayOfWeek::Monday->value,
        'start_time' => '09:30',
        'end_time' => '11:30',
    ]);

    $response->assertSessionHasNoErrors();
});
