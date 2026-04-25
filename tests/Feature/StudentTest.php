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
});

test('authenticated user can view students index', function () {
    Student::factory()->count(3)->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->get(route('students.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('students/index')
        ->has('students.data', 3)
    );
});

test('user only sees students from their school', function () {
    Student::factory()->create(['school_id' => $this->school->id, 'first_name' => 'Mine']);
    Student::factory()->create(['first_name' => 'Other']);

    $response = $this->actingAs($this->user)->get(route('students.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('students.data', 1)
        ->where('students.data.0.first_name', 'Mine')
    );
});

test('students can be filtered by search', function () {
    Student::factory()->create(['school_id' => $this->school->id, 'first_name' => 'Ahmed', 'last_name' => 'Zaki']);
    Student::factory()->create(['school_id' => $this->school->id, 'first_name' => 'Sara', 'last_name' => 'Benali']);

    $response = $this->actingAs($this->user)->get(route('students.index', ['search' => 'Ahmed']));

    $response->assertInertia(fn ($page) => $page->has('students.data', 1));
});

test('students search matches tokens across first and last name in any order', function () {
    Student::factory()->create(['school_id' => $this->school->id, 'first_name' => 'Anas', 'last_name' => 'Hassan']);
    Student::factory()->create(['school_id' => $this->school->id, 'first_name' => 'Anas', 'last_name' => 'Other']);
    Student::factory()->create(['school_id' => $this->school->id, 'first_name' => 'Other', 'last_name' => 'Hassan']);

    $response = $this->actingAs($this->user)->get(route('students.index', ['search' => 'anas hassan']));

    $response->assertInertia(fn ($page) => $page
        ->has('students.data', 1)
        ->where('students.data.0.first_name', 'Anas')
        ->where('students.data.0.last_name', 'Hassan')
    );

    $reversed = $this->actingAs($this->user)->get(route('students.index', ['search' => 'hassan anas']));

    $reversed->assertInertia(fn ($page) => $page->has('students.data', 1));
});

test('students can be filtered by level', function () {
    $level = Level::factory()->create(['school_id' => $this->school->id]);
    Student::factory()->create(['school_id' => $this->school->id, 'level_id' => $level->id]);
    Student::factory()->create(['school_id' => $this->school->id, 'level_id' => null]);

    $response = $this->actingAs($this->user)->get(route('students.index', ['level_id' => $level->id]));

    $response->assertInertia(fn ($page) => $page->has('students.data', 1));
});

test('user can view create student form', function () {
    $response = $this->actingAs($this->user)->get(route('students.create'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('students/create'));
});

test('user can create a student and is redirected to edit for enrollments', function () {
    $level = Level::factory()->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->post(route('students.store'), [
        'first_name' => 'Ahmed',
        'last_name' => 'Zaki',
        'phone' => '0612345678',
        'guardian_name' => 'Mohamed Zaki',
        'guardian_phone' => '0698765432',
        'level_id' => $level->id,
    ]);

    $student = Student::where('first_name', 'Ahmed')->first();
    $response->assertRedirect(route('students.edit', $student));
    $this->assertDatabaseHas('students', [
        'first_name' => 'Ahmed',
        'last_name' => 'Zaki',
        'school_id' => $this->school->id,
        'level_id' => $level->id,
    ]);
});

test('user can view edit student form', function () {
    $student = Student::factory()->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->get(route('students.edit', $student));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('students/edit')
        ->has('student.data')
    );
});

test('user can update a student', function () {
    $student = Student::factory()->create(['school_id' => $this->school->id, 'first_name' => 'Old']);

    $response = $this->actingAs($this->user)->put(route('students.update', $student), [
        'first_name' => 'New',
        'last_name' => $student->last_name,
    ]);

    $response->assertRedirect(route('students.index'));
    expect($student->fresh()->first_name)->toBe('New');
});

test('student edit page receives enrollments and groups', function () {
    $student = Student::factory()->create(['school_id' => $this->school->id]);
    $teacher = Teacher::factory()->create(['school_id' => $this->school->id]);
    $level = Level::factory()->create(['school_id' => $this->school->id]);
    $subject = Subject::factory()->create([
        'school_id' => $this->school->id,
        'level_id' => $level->id,
    ]);
    $group = Group::factory()->create([
        'school_id' => $this->school->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
    ]);
    Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $student->id,
        'group_id' => $group->id,
    ]);

    $response = $this->actingAs($this->user)->get(route('students.edit', $student));

    $response->assertInertia(fn ($page) => $page
        ->component('students/edit')
        ->has('student.data.enrollments', 1)
        ->has('groups.data')
    );
});

test('user can delete a student', function () {
    $student = Student::factory()->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->delete(route('students.destroy', $student));

    $response->assertRedirect();
    $this->assertDatabaseMissing('students', ['id' => $student->id]);
});

test('guest cannot access students', function () {
    $this->get(route('students.index'))->assertRedirect(route('login'));
    $this->get(route('students.create'))->assertRedirect(route('login'));
});
