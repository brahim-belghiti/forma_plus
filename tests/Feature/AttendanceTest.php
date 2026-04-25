<?php

use App\Models\Attendance;
use App\Models\ClassSession;
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
    $this->session = ClassSession::factory()->create([
        'school_id' => $this->school->id,
        'group_id' => $this->group->id,
    ]);
});

test('user can upsert attendance for a session', function () {
    $s1 = Student::factory()->create(['school_id' => $this->school->id]);
    $s2 = Student::factory()->create(['school_id' => $this->school->id]);

    $this->actingAs($this->user)->put(route('sessions.attendance', $this->session), [
        'attendances' => [
            ['student_id' => $s1->id, 'present' => true, 'notes' => null],
            ['student_id' => $s2->id, 'present' => false, 'notes' => 'Malade'],
        ],
    ])->assertRedirect();

    $this->assertDatabaseHas('attendances', [
        'class_session_id' => $this->session->id,
        'student_id' => $s1->id,
        'present' => true,
    ]);
    $this->assertDatabaseHas('attendances', [
        'class_session_id' => $this->session->id,
        'student_id' => $s2->id,
        'present' => false,
        'notes' => 'Malade',
    ]);
});

test('upserting attendance updates existing records rather than duplicating', function () {
    $student = Student::factory()->create(['school_id' => $this->school->id]);

    Attendance::factory()->create([
        'class_session_id' => $this->session->id,
        'student_id' => $student->id,
        'present' => true,
    ]);

    $this->actingAs($this->user)->put(route('sessions.attendance', $this->session), [
        'attendances' => [
            ['student_id' => $student->id, 'present' => false, 'notes' => 'Retard'],
        ],
    ])->assertRedirect();

    expect(Attendance::where('class_session_id', $this->session->id)->count())->toBe(1);
    expect(Attendance::where('class_session_id', $this->session->id)->first()->present)->toBeFalse();
});

test('attendance requires at least one row', function () {
    $this->actingAs($this->user)->put(route('sessions.attendance', $this->session), [])
        ->assertSessionHasErrors('attendances');
});

test('guest cannot post attendance', function () {
    $this->put(route('sessions.attendance', $this->session), [
        'attendances' => [],
    ])->assertRedirect(route('login'));
});
