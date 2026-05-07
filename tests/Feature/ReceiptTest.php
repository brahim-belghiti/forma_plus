<?php

use App\Models\Enrollment;
use App\Models\Group;
use App\Models\Level;
use App\Models\Payment;
use App\Models\School;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;

beforeEach(function () {
    $this->school = School::factory()->create(['name' => 'École Atlas']);
    $this->user = User::factory()->create(['school_id' => $this->school->id]);
    $this->student = Student::factory()->create([
        'school_id' => $this->school->id,
        'first_name' => 'Yassine',
        'last_name' => 'Amrani',
    ]);
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
    $this->enrollment = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
        'monthly_fee' => 300,
    ]);
});

test('a public receipt page renders for a valid receipt_number', function () {
    $payment = Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $this->enrollment->id,
        'amount' => 300,
        'period_month' => 5,
        'period_year' => 2026,
        'paid_at' => '2026-05-01',
    ]);

    $response = $this->get(route('receipts.show', $payment->receipt_number));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('receipts/show')
        ->where('receipt.receipt_number', $payment->receipt_number)
        ->where('receipt.amount', '300.00')
        ->where('receipt.period_month', 5)
        ->where('receipt.period_year', 2026)
        ->where('receipt.school_name', 'École Atlas')
        ->where('receipt.student_name', 'Yassine Amrani')
    );
});

test('an unknown receipt_number returns 404', function () {
    $this->get(route('receipts.show', '01HZZZZZZZZZZZZZZZZZZZZZZZ'))
        ->assertNotFound();
});

test('index finds a payment by full receipt_number', function () {
    $payment = Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $this->enrollment->id,
        'period_month' => 1,
        'period_year' => 2026,
    ]);
    Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $this->enrollment->id,
        'period_month' => 2,
        'period_year' => 2026,
    ]);

    $response = $this->actingAs($this->user)
        ->get(route('receipts.index', ['q' => $payment->receipt_number]));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('receipts/index')
        ->has('results', 1)
        ->where('results.0.receipt_number', $payment->receipt_number)
    );
});

test('index finds a payment by the last chars of the receipt_number', function () {
    $payment = Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $this->enrollment->id,
        'period_month' => 3,
        'period_year' => 2026,
    ]);

    $suffix = substr($payment->receipt_number, -8);

    $response = $this->actingAs($this->user)
        ->get(route('receipts.index', ['q' => $suffix]));

    $response->assertInertia(fn ($page) => $page
        ->has('results', 1)
        ->where('results.0.receipt_number', $payment->receipt_number)
    );
});

test('index finds payments by student name', function () {
    Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $this->enrollment->id,
        'period_month' => 4,
        'period_year' => 2026,
    ]);

    $response = $this->actingAs($this->user)
        ->get(route('receipts.index', ['q' => 'Yassine']));

    $response->assertInertia(fn ($page) => $page
        ->has('results', 1)
        ->where('results.0.student_name', 'Yassine Amrani')
    );
});

test('index does not return payments from other schools', function () {
    $payment = Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $this->enrollment->id,
        'period_month' => 5,
        'period_year' => 2026,
    ]);

    Payment::factory()->create();

    $response = $this->actingAs($this->user)
        ->get(route('receipts.index', ['q' => substr($payment->receipt_number, 0, 4)]));

    $response->assertInertia(fn ($page) => $page->has('results', 1));
});

test('guest cannot access /receipts index', function () {
    $this->get(route('receipts.index'))->assertRedirect(route('login'));
});
