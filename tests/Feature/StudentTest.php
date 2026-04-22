<?php

use App\Models\Level;
use App\Models\School;
use App\Models\Student;
use App\Models\Subject;
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

test('user can create a student', function () {
    $level = Level::factory()->create(['school_id' => $this->school->id]);
    $subjects = Subject::factory()->count(2)->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->post(route('students.store'), [
        'first_name' => 'Ahmed',
        'last_name' => 'Zaki',
        'phone' => '0612345678',
        'guardian_name' => 'Mohamed Zaki',
        'guardian_phone' => '0698765432',
        'level_id' => $level->id,
        'subject_ids' => $subjects->pluck('id')->toArray(),
    ]);

    $response->assertRedirect(route('students.index'));
    $this->assertDatabaseHas('students', [
        'first_name' => 'Ahmed',
        'last_name' => 'Zaki',
        'school_id' => $this->school->id,
        'level_id' => $level->id,
    ]);

    $student = Student::where('first_name', 'Ahmed')->first();
    expect($student->subjects)->toHaveCount(2);
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

test('user can update student subjects', function () {
    $student = Student::factory()->create(['school_id' => $this->school->id]);
    $subjects = Subject::factory()->count(2)->create(['school_id' => $this->school->id]);
    $student->subjects()->attach($subjects->first());

    $response = $this->actingAs($this->user)->put(route('students.update', $student), [
        'first_name' => $student->first_name,
        'last_name' => $student->last_name,
        'subject_ids' => [$subjects->last()->id],
    ]);

    $response->assertRedirect();
    expect($student->fresh()->subjects->pluck('id')->toArray())->toBe([$subjects->last()->id]);
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
