<?php

use App\Models\Expense;
use App\Models\Payment;
use App\Models\Salary;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('admins can visit the dashboard', function () {
    $user = User::factory()->admin()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertOk();
});

test('secretaries are redirected from the dashboard to students', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('students.index'));
});

test('dashboard shows financial summary stats', function () {
    $school = School::factory()->create();
    $user = User::factory()->admin()->create(['school_id' => $school->id]);
    $student = Student::factory()->create(['school_id' => $school->id]);
    $teacher = Teacher::factory()->create(['school_id' => $school->id]);

    Payment::factory()->create(['school_id' => $school->id, 'student_id' => $student->id, 'amount' => 1000]);
    Salary::factory()->create(['school_id' => $school->id, 'teacher_id' => $teacher->id, 'amount' => 400]);
    Expense::factory()->create(['school_id' => $school->id, 'amount' => 100]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('stats.total_students', 1)
        ->where('stats.total_teachers', 1)
        ->where('stats.total_payments', 1000)
        ->where('stats.total_salaries', 400)
        ->where('stats.total_expenses', 100)
        ->where('stats.balance', 500)
    );
});
