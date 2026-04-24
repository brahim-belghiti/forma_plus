<?php

use App\Models\Salary;
use App\Models\School;
use App\Models\Teacher;
use App\Models\User;

beforeEach(function () {
    $this->school = School::factory()->create();
    $this->user = User::factory()->admin()->create(['school_id' => $this->school->id]);
    $this->teacher = Teacher::factory()->create(['school_id' => $this->school->id]);
});

test('authenticated user can view salaries index', function () {
    Salary::factory()->count(3)->create([
        'school_id' => $this->school->id,
        'teacher_id' => $this->teacher->id,
    ]);

    $response = $this->actingAs($this->user)->get(route('salaries.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('salaries/index')
        ->has('salaries.data', 3)
        ->has('teachers.data')
        ->has('filters')
    );
});

test('user only sees salaries from their school', function () {
    Salary::factory()->create([
        'school_id' => $this->school->id,
        'teacher_id' => $this->teacher->id,
    ]);
    Salary::factory()->create();

    $response = $this->actingAs($this->user)->get(route('salaries.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('salaries.data', 1)
    );
});

test('user can filter salaries by month and year', function () {
    Salary::factory()->create([
        'school_id' => $this->school->id,
        'teacher_id' => $this->teacher->id,
        'period_month' => 3,
        'period_year' => 2026,
    ]);
    Salary::factory()->create([
        'school_id' => $this->school->id,
        'teacher_id' => $this->teacher->id,
        'period_month' => 4,
        'period_year' => 2026,
    ]);

    $response = $this->actingAs($this->user)->get(route('salaries.index', ['month' => 3, 'year' => 2026]));

    $response->assertInertia(fn ($page) => $page
        ->has('salaries.data', 1)
    );
});

test('user can create a salary record', function () {
    $response = $this->actingAs($this->user)->post(route('salaries.store'), [
        'teacher_id' => $this->teacher->id,
        'amount' => 2000.00,
        'period_month' => 4,
        'period_year' => 2026,
        'paid_at' => '2026-04-22',
        'notes' => 'April salary',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('salaries', [
        'school_id' => $this->school->id,
        'teacher_id' => $this->teacher->id,
        'amount' => 2000.00,
        'period_month' => 4,
        'period_year' => 2026,
    ]);
});

test('salary requires teacher, amount, period, and date', function () {
    $response = $this->actingAs($this->user)->post(route('salaries.store'), []);

    $response->assertSessionHasErrors(['teacher_id', 'amount', 'period_month', 'period_year', 'paid_at']);
});

test('user can update a salary record', function () {
    $salary = Salary::factory()->create([
        'school_id' => $this->school->id,
        'teacher_id' => $this->teacher->id,
        'amount' => 1000,
    ]);

    $response = $this->actingAs($this->user)->put(route('salaries.update', $salary), [
        'teacher_id' => $this->teacher->id,
        'amount' => 2500,
        'period_month' => $salary->period_month,
        'period_year' => $salary->period_year,
        'paid_at' => $salary->paid_at->toDateString(),
    ]);

    $response->assertRedirect();
    expect($salary->fresh()->amount)->toBe('2500.00');
});

test('user can delete a salary record', function () {
    $salary = Salary::factory()->create([
        'school_id' => $this->school->id,
        'teacher_id' => $this->teacher->id,
    ]);

    $response = $this->actingAs($this->user)->delete(route('salaries.destroy', $salary));

    $response->assertRedirect();
    $this->assertDatabaseMissing('salaries', ['id' => $salary->id]);
});

test('guest cannot access salaries', function () {
    $response = $this->get(route('salaries.index'));

    $response->assertRedirect(route('login'));
});

test('secretary cannot access salaries', function () {
    $secretary = User::factory()->create(['school_id' => $this->school->id]);

    $this->actingAs($secretary)->get(route('salaries.index'))->assertForbidden();
    $this->actingAs($secretary)->post(route('salaries.store'), [
        'teacher_id' => $this->teacher->id,
        'amount' => 100,
        'period_month' => 4,
        'period_year' => 2026,
        'paid_at' => '2026-04-22',
    ])->assertForbidden();
});
