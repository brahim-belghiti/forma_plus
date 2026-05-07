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
    $this->enrollment = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
        'monthly_fee' => 300,
    ]);
});

test('authenticated user can view payments index', function () {
    foreach ([1, 2, 3] as $month) {
        Payment::factory()->create([
            'school_id' => $this->school->id,
            'enrollment_id' => $this->enrollment->id,
            'period_month' => $month,
            'period_year' => 2026,
        ]);
    }

    $response = $this->actingAs($this->user)->get(route('payments.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('payments/index')
        ->has('payments.data', 3)
        ->has('filters')
    );
});

test('user only sees payments from their school', function () {
    Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $this->enrollment->id,
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
        'enrollment_id' => $this->enrollment->id,
        'period_month' => 3,
        'period_year' => 2026,
    ]);
    Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $this->enrollment->id,
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
    $e1 = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $student1->id,
        'group_id' => $this->group->id,
    ]);
    $e2 = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $student2->id,
        'group_id' => $this->group->id,
    ]);
    Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $e1->id,
    ]);
    Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $e2->id,
    ]);

    $response = $this->actingAs($this->user)->get(route('payments.index', ['search' => 'Ahmed']));

    $response->assertInertia(fn ($page) => $page
        ->has('payments.data', 1)
    );
});

test('user can create a payment', function () {
    $response = $this->actingAs($this->user)->post(route('payments.store'), [
        'enrollment_id' => $this->enrollment->id,
        'amount' => 500.00,
        'period_month' => 4,
        'period_year' => 2026,
        'paid_at' => '2026-04-22',
        'notes' => 'April payment',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('payments', [
        'school_id' => $this->school->id,
        'enrollment_id' => $this->enrollment->id,
        'amount' => 500.00,
        'period_month' => 4,
        'period_year' => 2026,
    ]);
});

test('payment requires enrollment, amount, period, and date', function () {
    $this->actingAs($this->user)->post(route('payments.store'), [])
        ->assertSessionHasErrors(['enrollment_id', 'amount', 'period_month', 'period_year', 'paid_at']);
});

test('payment amount must be positive', function () {
    $response = $this->actingAs($this->user)->post(route('payments.store'), [
        'enrollment_id' => $this->enrollment->id,
        'amount' => 0,
        'period_month' => 4,
        'period_year' => 2026,
        'paid_at' => '2026-04-22',
    ]);

    $response->assertSessionHasErrors('amount');
});

test('cannot pay the same enrollment period twice', function () {
    Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $this->enrollment->id,
        'period_month' => 4,
        'period_year' => 2026,
    ]);

    $response = $this->actingAs($this->user)->post(route('payments.store'), [
        'enrollment_id' => $this->enrollment->id,
        'amount' => 300,
        'period_month' => 4,
        'period_year' => 2026,
        'paid_at' => '2026-04-22',
    ]);

    $response->assertSessionHasErrors('period_month');
});

test('user can update a payment amount', function () {
    $payment = Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $this->enrollment->id,
        'amount' => 300,
    ]);

    $response = $this->actingAs($this->user)->put(route('payments.update', $payment), [
        'amount' => 500,
        'paid_at' => $payment->paid_at->toDateString(),
    ]);

    $response->assertRedirect();
    expect($payment->fresh()->amount)->toBe('500.00');
});

test('user can delete a payment', function () {
    $payment = Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $this->enrollment->id,
    ]);

    $response = $this->actingAs($this->user)->delete(route('payments.destroy', $payment));

    $response->assertRedirect();
    $this->assertDatabaseMissing('payments', ['id' => $payment->id]);
});

test('guest cannot access payments', function () {
    $this->get(route('payments.index'))->assertRedirect(route('login'));
});

test('store flashes the new receipt url and number for the QR display', function () {
    $response = $this->actingAs($this->user)->post(route('payments.store'), [
        'enrollment_id' => $this->enrollment->id,
        'amount' => 300,
        'period_month' => 6,
        'period_year' => 2026,
        'paid_at' => '2026-06-01',
    ]);

    $payment = Payment::latest('id')->first();
    $response->assertSessionHas('receipt', [
        'url' => route('receipts.show', $payment->receipt_number),
        'number' => $payment->receipt_number,
    ]);
});

test('store records who created the payment', function () {
    $this->actingAs($this->user)->post(route('payments.store'), [
        'enrollment_id' => $this->enrollment->id,
        'amount' => 300,
        'period_month' => 5,
        'period_year' => 2026,
        'paid_at' => '2026-05-01',
    ]);

    $payment = Payment::latest('id')->first();
    expect($payment->recorded_by)->toBe($this->user->id);
});

test('a payment is assigned a unique receipt_number on creation', function () {
    $first = Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $this->enrollment->id,
        'period_month' => 1,
        'period_year' => 2026,
    ]);

    $other = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
    ]);
    $second = Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $other->id,
        'period_month' => 2,
        'period_year' => 2026,
    ]);

    expect($first->receipt_number)
        ->toBeString()
        ->toHaveLength(26);
    expect($second->receipt_number)->not->toBe($first->receipt_number);
});
