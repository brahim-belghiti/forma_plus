<?php

use App\Models\Level;
use App\Models\School;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;

beforeEach(function () {
    $this->school = School::factory()->create();
    $this->user = User::factory()->create(['school_id' => $this->school->id]);
});

test('authenticated user can view teachers index', function () {
    Teacher::factory()->count(3)->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->get(route('teachers.index'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('teachers/index')
        ->has('teachers.data', 3)
    );
});

test('user only sees teachers from their school', function () {
    Teacher::factory()->create(['school_id' => $this->school->id, 'first_name' => 'Mine']);
    Teacher::factory()->create(['first_name' => 'Other']);

    $response = $this->actingAs($this->user)->get(route('teachers.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('teachers.data', 1)
        ->where('teachers.data.0.first_name', 'Mine')
    );
});

test('teachers search matches tokens across first and last name in any order', function () {
    Teacher::factory()->create(['school_id' => $this->school->id, 'first_name' => 'Anas', 'last_name' => 'Hassan']);
    Teacher::factory()->create(['school_id' => $this->school->id, 'first_name' => 'Anas', 'last_name' => 'Other']);
    Teacher::factory()->create(['school_id' => $this->school->id, 'first_name' => 'Other', 'last_name' => 'Hassan']);

    $response = $this->actingAs($this->user)->get(route('teachers.index', ['search' => 'anas hassan']));

    $response->assertInertia(fn ($page) => $page
        ->has('teachers.data', 1)
        ->where('teachers.data.0.first_name', 'Anas')
        ->where('teachers.data.0.last_name', 'Hassan')
    );

    $reversed = $this->actingAs($this->user)->get(route('teachers.index', ['search' => 'hassan anas']));

    $reversed->assertInertia(fn ($page) => $page->has('teachers.data', 1));
});

test('user can view create teacher form', function () {
    $response = $this->actingAs($this->user)->get(route('teachers.create'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('teachers/create'));
});

test('admin can create a teacher with salary rate and subjects', function () {
    $admin = User::factory()->admin()->create(['school_id' => $this->school->id]);
    $level = Level::factory()->create(['school_id' => $this->school->id]);
    $subjects = Subject::factory()->count(2)->create([
        'school_id' => $this->school->id,
        'level_id' => $level->id,
    ]);

    $response = $this->actingAs($admin)->post(route('teachers.store'), [
        'first_name' => 'Karim',
        'last_name' => 'Benali',
        'phone' => '0612345678',
        'salary_rate' => '50',
        'subject_ids' => $subjects->pluck('id')->toArray(),
    ]);

    $response->assertRedirect(route('teachers.index'));
    $this->assertDatabaseHas('teachers', [
        'first_name' => 'Karim',
        'school_id' => $this->school->id,
        'salary_rate' => '50.00',
    ]);

    $teacher = Teacher::where('first_name', 'Karim')->first();
    expect($teacher->subjects)->toHaveCount(2);
});

test('secretary cannot set salary rate on create (field is stripped)', function () {
    $response = $this->actingAs($this->user)->post(route('teachers.store'), [
        'first_name' => 'Karim',
        'last_name' => 'Benali',
        'salary_rate' => '99',
    ]);

    $response->assertRedirect(route('teachers.index'));
    $teacher = Teacher::where('first_name', 'Karim')->first();
    expect($teacher->salary_rate)->toBeNull();
});

test('secretary cannot update salary rate (field is stripped)', function () {
    $teacher = Teacher::factory()->create(['school_id' => $this->school->id, 'salary_rate' => 30]);

    $this->actingAs($this->user)->put(route('teachers.update', $teacher), [
        'first_name' => $teacher->first_name,
        'last_name' => $teacher->last_name,
        'salary_rate' => '90',
    ])->assertRedirect();

    expect((float) $teacher->fresh()->salary_rate)->toBe(30.0);
});

test('teacher resource hides salary fields from secretary', function () {
    Teacher::factory()->create(['school_id' => $this->school->id, 'salary_rate' => 40]);

    $response = $this->actingAs($this->user)->get(route('teachers.index'));

    $response->assertInertia(fn ($page) => $page
        ->missing('teachers.data.0.salary_rate')
        ->missing('teachers.data.0.effective_salary_rate')
    );
});

test('teacher resource exposes salary fields to admin', function () {
    $admin = User::factory()->admin()->create(['school_id' => $this->school->id]);
    Teacher::factory()->create(['school_id' => $this->school->id, 'salary_rate' => 40]);

    $response = $this->actingAs($admin)->get(route('teachers.index'));

    $response->assertInertia(fn ($page) => $page
        ->has('teachers.data.0.salary_rate')
        ->has('teachers.data.0.effective_salary_rate')
    );
});

test('teacher salary rate is nullable for school default', function () {
    $response = $this->actingAs($this->user)->post(route('teachers.store'), [
        'first_name' => 'Sara',
        'last_name' => 'Alami',
    ]);

    $response->assertRedirect(route('teachers.index'));
    $teacher = Teacher::where('first_name', 'Sara')->first();
    expect($teacher->salary_rate)->toBeNull();
    expect($teacher->effectiveSalaryRate())->toBe((float) $this->school->default_salary_rate);
});

test('user can update a teacher', function () {
    $teacher = Teacher::factory()->create(['school_id' => $this->school->id, 'first_name' => 'Old']);

    $response = $this->actingAs($this->user)->put(route('teachers.update', $teacher), [
        'first_name' => 'New',
        'last_name' => $teacher->last_name,
    ]);

    $response->assertRedirect(route('teachers.index'));
    expect($teacher->fresh()->first_name)->toBe('New');
});

test('user can delete a teacher', function () {
    $teacher = Teacher::factory()->create(['school_id' => $this->school->id]);

    $response = $this->actingAs($this->user)->delete(route('teachers.destroy', $teacher));

    $response->assertRedirect();
    $this->assertDatabaseMissing('teachers', ['id' => $teacher->id]);
});

test('guest cannot access teachers', function () {
    $this->get(route('teachers.index'))->assertRedirect(route('login'));
});
