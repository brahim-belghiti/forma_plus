<?php

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
    $this->student = Student::factory()->create(['school_id' => $this->school->id]);
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

test('user can create an enrollment for a student', function () {
    $response = $this->actingAs($this->user)->post(route('enrollments.store'), [
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
        'monthly_fee' => 300,
        'start_date' => '2026-04-01',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('enrollments', [
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
        'monthly_fee' => '300.00',
        'active' => true,
    ]);
});

test('enrollment requires student, group, fee, and start date', function () {
    $this->actingAs($this->user)->post(route('enrollments.store'), [])
        ->assertSessionHasErrors(['student_id', 'group_id', 'monthly_fee', 'start_date']);
});

test('user can update an enrollment', function () {
    $enrollment = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
        'monthly_fee' => 200,
    ]);

    $response = $this->actingAs($this->user)->put(route('enrollments.update', $enrollment), [
        'group_id' => $this->group->id,
        'monthly_fee' => 400,
        'start_date' => $enrollment->start_date->toDateString(),
    ]);

    $response->assertRedirect();
    expect((float) $enrollment->fresh()->monthly_fee)->toBe(400.0);
});

test('user can end an enrollment (soft-end)', function () {
    $enrollment = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
        'active' => true,
    ]);

    $this->actingAs($this->user)->post(route('enrollments.end', $enrollment))->assertRedirect();

    $fresh = $enrollment->fresh();
    expect($fresh->active)->toBeFalse();
    expect($fresh->end_date)->not->toBeNull();
});

test('user can delete an enrollment', function () {
    $enrollment = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
    ]);

    $this->actingAs($this->user)->delete(route('enrollments.destroy', $enrollment))->assertRedirect();
    $this->assertDatabaseMissing('enrollments', ['id' => $enrollment->id]);
});

test('user cannot modify enrollments from another school', function () {
    $otherSchool = School::factory()->create();
    $otherStudent = Student::factory()->create(['school_id' => $otherSchool->id]);
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
    $otherEnrollment = Enrollment::factory()->create([
        'school_id' => $otherSchool->id,
        'student_id' => $otherStudent->id,
        'group_id' => $otherGroup->id,
    ]);

    $this->actingAs($this->user)->put(route('enrollments.update', $otherEnrollment), [
        'group_id' => $otherGroup->id,
        'monthly_fee' => 100,
        'start_date' => '2026-04-01',
    ])->assertNotFound();
});

test('ending an enrollment sets active false and end_date to today', function () {
    $enrollment = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
    ]);

    $this->actingAs($this->user)->post(route('enrollments.end', $enrollment));

    $fresh = $enrollment->fresh();
    expect($fresh->active)->toBeFalse();
    expect($fresh->end_date?->toDateString())->toBe(now()->toDateString());
});

test('guest cannot access enrollment routes', function () {
    $enrollment = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
    ]);

    $this->post(route('enrollments.store'), [])->assertRedirect(route('login'));
    $this->put(route('enrollments.update', $enrollment), [])->assertRedirect(route('login'));
    $this->post(route('enrollments.end', $enrollment))->assertRedirect(route('login'));
    $this->delete(route('enrollments.destroy', $enrollment))->assertRedirect(route('login'));
});
