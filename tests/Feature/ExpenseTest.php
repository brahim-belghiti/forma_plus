<?php

use App\Models\Expense;
use App\Models\School;
use App\Models\User;

beforeEach(function () {
    $this->school = School::factory()->create();
    $this->user = User::factory()->create(['school_id' => $this->school->id]);
});

test('authenticated user can view expenses index', function () {
    Expense::factory()->count(3)->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->get(route('expenses.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('expenses/index')
        ->has('expenses.data', 3)
        ->has('filters')
    );
});

test('user only sees expenses from their school', function () {
    Expense::factory()->create(['school_id' => $this->school->id, 'description' => 'My Expense']);
    Expense::factory()->create(['description' => 'Other School Expense']);

    $response = $this->actingAs($this->user)->get(route('expenses.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('expenses.data', 1)
    );
});

test('user can search expenses by description', function () {
    Expense::factory()->create(['school_id' => $this->school->id, 'description' => 'Office Supplies']);
    Expense::factory()->create(['school_id' => $this->school->id, 'description' => 'Rent']);

    $response = $this->actingAs($this->user)->get(route('expenses.index', ['search' => 'Office']));

    $response->assertInertia(fn ($page) => $page
        ->has('expenses.data', 1)
    );
});

test('user can create an expense', function () {
    $response = $this->actingAs($this->user)->post(route('expenses.store'), [
        'description' => 'Office Supplies',
        'amount' => 150.00,
        'spent_at' => '2026-04-22',
        'notes' => 'Paper and pens',
    ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('expenses', [
        'school_id' => $this->school->id,
        'description' => 'Office Supplies',
        'amount' => 150.00,
    ]);
});

test('expense requires description, amount, and date', function () {
    $response = $this->actingAs($this->user)->post(route('expenses.store'), []);

    $response->assertSessionHasErrors(['description', 'amount', 'spent_at']);
});

test('user can update an expense', function () {
    $expense = Expense::factory()->create([
        'school_id' => $this->school->id,
        'description' => 'Old Description',
        'amount' => 100,
    ]);

    $response = $this->actingAs($this->user)->put(route('expenses.update', $expense), [
        'description' => 'New Description',
        'amount' => 200,
        'spent_at' => $expense->spent_at->toDateString(),
    ]);

    $response->assertRedirect();
    expect($expense->fresh())
        ->description->toBe('New Description')
        ->amount->toBe('200.00');
});

test('user can delete an expense', function () {
    $expense = Expense::factory()->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->delete(route('expenses.destroy', $expense));

    $response->assertRedirect();
    $this->assertDatabaseMissing('expenses', ['id' => $expense->id]);
});

test('guest cannot access expenses', function () {
    $response = $this->get(route('expenses.index'));

    $response->assertRedirect(route('login'));
});
