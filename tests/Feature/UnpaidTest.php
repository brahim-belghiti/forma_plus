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
});

test('unpaid periods include every month from start_date to today with no payment', function () {
    $this->travelTo('2026-04-15');

    $enrollment = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
        'start_date' => '2026-01-01',
        'monthly_fee' => 300,
    ]);

    Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $enrollment->id,
        'period_month' => 2,
        'period_year' => 2026,
    ]);

    $periods = $enrollment->load('payments')->unpaidPeriods();

    expect($periods)->toHaveCount(3);
    expect($periods[0])->toBe(['year' => 2026, 'month' => 1]);
    expect($periods[1])->toBe(['year' => 2026, 'month' => 3]);
    expect($periods[2])->toBe(['year' => 2026, 'month' => 4]);
});

test('unpaid periods stop at end_date when enrollment is ended', function () {
    $this->travelTo('2026-04-15');

    $enrollment = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
        'start_date' => '2026-01-01',
        'end_date' => '2026-02-10',
        'active' => false,
    ]);

    $periods = $enrollment->load('payments')->unpaidPeriods();

    expect($periods)->toHaveCount(2);
    expect($periods[1])->toBe(['year' => 2026, 'month' => 2]);
});

test('unpaid index lists only active enrollments with at least one unpaid period', function () {
    $this->travelTo('2026-04-15');

    Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
        'start_date' => '2026-03-01',
        'monthly_fee' => 300,
    ]);

    $paidEnrollment = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
        'start_date' => '2026-04-01',
        'monthly_fee' => 500,
    ]);
    Payment::factory()->create([
        'school_id' => $this->school->id,
        'enrollment_id' => $paidEnrollment->id,
        'period_month' => 4,
        'period_year' => 2026,
    ]);

    Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
        'start_date' => '2026-01-01',
        'end_date' => '2026-02-10',
        'active' => false,
    ]);

    $response = $this->actingAs($this->user)->get(route('payments.unpaid'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('payments/unpaid')
        ->has('rows', 1)
        ->has('rows.0.unpaid_periods', 2)
        ->where('rows.0.total_due', 600)
    );
});

test('unpaid rows are sorted by total due descending', function () {
    $this->travelTo('2026-04-15');

    $small = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
        'start_date' => '2026-04-01',
        'monthly_fee' => 100,
    ]);
    $big = Enrollment::factory()->create([
        'school_id' => $this->school->id,
        'student_id' => $this->student->id,
        'group_id' => $this->group->id,
        'start_date' => '2026-01-01',
        'monthly_fee' => 500,
    ]);

    $response = $this->actingAs($this->user)->get(route('payments.unpaid'));

    $response->assertInertia(fn ($page) => $page
        ->where('rows.0.enrollment.id', $big->id)
        ->where('rows.1.enrollment.id', $small->id)
    );
});

test('guest cannot access unpaid view', function () {
    $this->get(route('payments.unpaid'))->assertRedirect(route('login'));
});
