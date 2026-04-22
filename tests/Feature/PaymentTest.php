<?php

use App\Models\Payment;
use App\Models\School;
use App\Models\Student;
use App\Models\User;

beforeEach(function () {
    $this->school = School::factory()->create();
    $this->user = User::factory()->create(['school_id' => $this->school->id]);
    $this->student = Student::factory()->create(['school_id' => $this->school->id]);
});

test('authenticated user can view payments index', function () {
    Payment::factory()->count(3)->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
    ]);

    $response = $this->actingAs($this->user)->get(route('payments.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('payments/index')
        ->has('payments.data', 3)
        ->has('students.data')
        ->has('filters')
    );
});

test('user only sees payments from their school', function () {
    Payment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
    ]);
    Payment::factory()->create();

    $response = $this->actingAs($this->user)->get(route('payments.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('payments.data', 1)
    );
});

test('user can filter payments by month and year', function () {
    Payment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'period_month' => 3,
        'period_year' => 2026,
    ]);
    Payment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'period_month' => 4,
        'period_year' => 2026,
    ]);

    $response = $this->actingAs($this->user)->get(route('payments.index', ['month' => 3, 'year' => 2026]));

    $response->assertInertia(fn ($page) => $page
        ->has('payments.data', 1)
    );
});

test('user can search payments by student name', function () {
    $student1 = Student::factory()->create([
        'school_id' => $this->school->id,
        'first_name' => 'Ahmed',
        'last_name' => 'Test',
    ]);
    $student2 = Student::factory()->create([
        'school_id' => $this->school->id,
        'first_name' => 'Sara',
        'last_name' => 'Other',
    ]);
    Payment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $student1->id,
    ]);
    Payment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $student2->id,
    ]);

    $response = $this->actingAs($this->user)->get(route('payments.index', ['search' => 'Ahmed']));

    $response->assertInertia(fn ($page) => $page
        ->has('payments.data', 1)
    );
});

test('user can create a payment', function () {
    $response = $this->actingAs($this->user)->post(route('payments.store'), [
        'student_id' => $this->student->id,
        'amount' => 500.00,
        'period_month' => 4,
        'period_year' => 2026,
        'paid_at' => '2026-04-22',
        'notes' => 'April payment',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('payments', [
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'amount' => 500.00,
        'period_month' => 4,
        'period_year' => 2026,
    ]);
});

test('payment requires student, amount, period, and date', function () {
    $response = $this->actingAs($this->user)->post(route('payments.store'), []);

    $response->assertSessionHasErrors(['student_id', 'amount', 'period_month', 'period_year', 'paid_at']);
});

test('payment amount must be positive', function () {
    $response = $this->actingAs($this->user)->post(route('payments.store'), [
        'student_id' => $this->student->id,
        'amount' => 0,
        'period_month' => 4,
        'period_year' => 2026,
        'paid_at' => '2026-04-22',
    ]);

    $response->assertSessionHasErrors('amount');
});

test('user can update a payment', function () {
    $payment = Payment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'amount' => 300,
    ]);

    $response = $this->actingAs($this->user)->put(route('payments.update', $payment), [
        'student_id' => $this->student->id,
        'amount' => 500,
        'period_month' => $payment->period_month,
        'period_year' => $payment->period_year,
        'paid_at' => $payment->paid_at->toDateString(),
    ]);

    $response->assertRedirect();
    expect($payment->fresh()->amount)->toBe('500.00');
});

test('user can delete a payment', function () {
    $payment = Payment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
    ]);

    $response = $this->actingAs($this->user)->delete(route('payments.destroy', $payment));

    $response->assertRedirect();
    $this->assertDatabaseMissing('payments', ['id' => $payment->id]);
});

test('guest cannot access payments', function () {
    $response = $this->get(route('payments.index'));

    $response->assertRedirect(route('login'));
});
