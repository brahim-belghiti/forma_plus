<?php

use App\Enums\UserRole;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Carbon;

beforeEach(function () {
    $this->superAdmin = User::factory()->superAdmin()->create();
});

test('dashboard renders with the correct component', function () {
    $response = $this->actingAs($this->superAdmin)->get(route('admin.dashboard'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('admin/dashboard'));
});

test('platform totals span every school', function () {
    $schoolA = School::factory()->create();
    $schoolB = School::factory()->create();

    User::factory()->admin()->create(['school_id' => $schoolA->id]);
    User::factory()->admin()->create(['school_id' => $schoolB->id]);
    User::factory()->count(2)->create(['school_id' => $schoolA->id, 'role' => UserRole::Secretary]);
    User::factory()->create(['school_id' => $schoolB->id, 'role' => UserRole::Secretary]);

    Student::factory()->count(4)->create(['school_id' => $schoolA->id]);
    Student::factory()->count(3)->create(['school_id' => $schoolB->id]);
    Teacher::factory()->count(2)->create(['school_id' => $schoolA->id]);
    Teacher::factory()->create(['school_id' => $schoolB->id]);

    $response = $this->actingAs($this->superAdmin)->get(route('admin.dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->where('metrics.schools_total', 2)
        ->where('metrics.admins_total', 2)
        ->where('metrics.secretaries_total', 3)
        ->where('metrics.students_total', 7)
        ->where('metrics.teachers_total', 3)
    );
});

test('this month payment metrics filter by paid_at', function () {
    $school = School::factory()->create();

    Payment::factory()->create([
        'school_id' => $school->id,
        'amount' => 100,
        'paid_at' => Carbon::now()->startOfMonth()->addDays(2),
    ]);
    Payment::factory()->create([
        'school_id' => $school->id,
        'amount' => 250,
        'paid_at' => Carbon::now()->endOfMonth()->subDay(),
    ]);
    Payment::factory()->create([
        'school_id' => $school->id,
        'amount' => 999,
        'paid_at' => Carbon::now()->startOfMonth()->subDay(),
    ]);

    $response = $this->actingAs($this->superAdmin)->get(route('admin.dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->where('metrics.payments_this_month_count', 2)
        ->where('metrics.payments_this_month_total', fn ($v) => (float) $v === 350.0)
    );
});

test('this month expense metrics filter by spent_at', function () {
    $school = School::factory()->create();

    Expense::factory()->create([
        'school_id' => $school->id,
        'amount' => 80,
        'spent_at' => Carbon::now()->startOfMonth()->addDays(3),
    ]);
    Expense::factory()->create([
        'school_id' => $school->id,
        'amount' => 120,
        'spent_at' => Carbon::now()->endOfMonth(),
    ]);
    Expense::factory()->create([
        'school_id' => $school->id,
        'amount' => 9999,
        'spent_at' => Carbon::now()->subMonth()->endOfMonth(),
    ]);

    $response = $this->actingAs($this->superAdmin)->get(route('admin.dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->where('metrics.expenses_this_month_total', fn ($v) => (float) $v === 200.0)
    );
});

test('recent schools list returns up to five most recent', function () {
    School::factory()->count(7)->create();

    $response = $this->actingAs($this->superAdmin)->get(route('admin.dashboard'));

    $response->assertInertia(fn ($page) => $page->has('recent_schools.data', 5));
});

test('top schools are ordered by student count descending', function () {
    $small = School::factory()->create(['name' => 'Small']);
    $big = School::factory()->create(['name' => 'Big']);

    Student::factory()->count(2)->create(['school_id' => $small->id]);
    Student::factory()->count(8)->create(['school_id' => $big->id]);

    $response = $this->actingAs($this->superAdmin)->get(route('admin.dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->where('top_schools.data.0.name', 'Big')
        ->where('top_schools.data.0.students_count', 8)
        ->where('top_schools.data.1.name', 'Small')
    );
});

test('non super admins cannot view the SaaS dashboard', function () {
    $school = School::factory()->create();
    $admin = User::factory()->admin()->create(['school_id' => $school->id]);

    $this->actingAs($admin)->get(route('admin.dashboard'))->assertForbidden();
});
