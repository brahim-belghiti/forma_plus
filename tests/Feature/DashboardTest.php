<?php

use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\Expense;
use App\Models\Group;
use App\Models\Level;
use App\Models\Payment;
use App\Models\Salary;
use App\Models\School;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Timeslot;
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

test('dashboard shows current-month money KPIs and all-time totals', function () {
    $school = School::factory()->create();
    $user = User::factory()->admin()->create(['school_id' => $school->id]);
    $student = Student::factory()->create(['school_id' => $school->id]);
    $teacher = Teacher::factory()->create(['school_id' => $school->id]);
    $level = Level::factory()->create(['school_id' => $school->id]);
    $subject = Subject::factory()->create(['school_id' => $school->id, 'level_id' => $level->id]);
    $group = Group::factory()->create([
        'school_id' => $school->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
    ]);
    $enrollment = Enrollment::factory()->create([
        'school_id' => $school->id,
        'student_id' => $student->id,
        'group_id' => $group->id,
        'monthly_fee' => 500,
        'start_date' => now()->startOfMonth()->subMonth()->toDateString(),
        'end_date' => null,
        'active' => true,
    ]);

    Payment::factory()->create([
        'school_id' => $school->id,
        'enrollment_id' => $enrollment->id,
        'amount' => 500,
        'paid_at' => now()->toDateString(),
        'period_year' => (int) now()->format('Y'),
        'period_month' => (int) now()->format('n'),
    ]);
    Salary::factory()->create([
        'school_id' => $school->id,
        'teacher_id' => $teacher->id,
        'amount' => 200,
        'paid_at' => now()->toDateString(),
    ]);
    Expense::factory()->create([
        'school_id' => $school->id,
        'amount' => 50,
        'spent_at' => now()->toDateString(),
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->where('month.revenue', 500)
        ->where('month.salaries', 200)
        ->where('month.expenses', 50)
        ->where('month.profit', 250)
        ->where('month.billable', 500)
        ->where('month.collected_for_period', 500)
        ->where('month.recovery_rate', 100)
        ->where('outstanding', 500)
        ->where('totals.students', 1)
        ->where('totals.teachers', 1)
        ->where('totals.all_time_revenue', 500)
        ->where('totals.all_time_salaries', 200)
        ->where('totals.all_time_expenses', 50)
        ->has('previous')
        ->has('alerts.unpaid')
        ->has('alerts.under_enrolled')
        ->has('alerts.idle_teachers')
        ->has('alerts.low_attendance')
    );
});

test('dashboard alerts list students with two or more unpaid months', function () {
    $school = School::factory()->create();
    $user = User::factory()->admin()->create(['school_id' => $school->id]);
    $student = Student::factory()->create(['school_id' => $school->id, 'first_name' => 'Anas', 'last_name' => 'Hassan']);
    $teacher = Teacher::factory()->create(['school_id' => $school->id]);
    $level = Level::factory()->create(['school_id' => $school->id]);
    $subject = Subject::factory()->create(['school_id' => $school->id, 'level_id' => $level->id]);
    $group = Group::factory()->create([
        'school_id' => $school->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
    ]);
    Enrollment::factory()->create([
        'school_id' => $school->id,
        'student_id' => $student->id,
        'group_id' => $group->id,
        'monthly_fee' => 500,
        'start_date' => now()->subMonths(3)->startOfMonth()->toDateString(),
        'end_date' => null,
        'active' => true,
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->where('alerts.unpaid.count', 1)
        ->where('alerts.unpaid.items.0.student_name', 'Anas Hassan')
    );
});

test('dashboard activity reports sessions, attendance and teaching hours', function () {
    $school = School::factory()->create();
    $user = User::factory()->admin()->create(['school_id' => $school->id]);
    $teacher = Teacher::factory()->create(['school_id' => $school->id, 'first_name' => 'Mme', 'last_name' => 'Atlas']);
    $level = Level::factory()->create(['school_id' => $school->id]);
    $subject = Subject::factory()->create(['school_id' => $school->id, 'level_id' => $level->id]);
    $classroom = Classroom::factory()->create(['school_id' => $school->id]);
    $group = Group::factory()->create([
        'school_id' => $school->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
    ]);
    $student = Student::factory()->create(['school_id' => $school->id]);
    Enrollment::factory()->create([
        'school_id' => $school->id,
        'student_id' => $student->id,
        'group_id' => $group->id,
        'active' => true,
    ]);

    Timeslot::factory()->create([
        'school_id' => $school->id,
        'group_id' => $group->id,
        'classroom_id' => $classroom->id,
        'start_time' => '09:00',
        'end_time' => '11:00',
    ]);

    $session = ClassSession::factory()->create([
        'school_id' => $school->id,
        'group_id' => $group->id,
        'date' => now()->toDateString(),
        'teacher_present' => true,
    ]);
    Attendance::factory()->create([
        'class_session_id' => $session->id,
        'student_id' => $student->id,
        'present' => true,
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->where('activity.active_students', 1)
        ->where('activity.sessions_this_month', 1)
        ->where('activity.teacher_absent_count', 0)
        ->where('activity.attendance_rate', 100)
        ->where('activity.teaching_hours_per_week', 2)
        ->where('activity.top_teachers.0.full_name', 'Mme Atlas')
        ->where('activity.top_teachers.0.weekly_hours', 2)
    );
});

test('dashboard alerts flag groups with fewer than three active enrollments', function () {
    $school = School::factory()->create();
    $user = User::factory()->admin()->create(['school_id' => $school->id]);
    $teacher = Teacher::factory()->create(['school_id' => $school->id]);
    $level = Level::factory()->create(['school_id' => $school->id]);
    $subject = Subject::factory()->create(['school_id' => $school->id, 'level_id' => $level->id]);

    $smallGroup = Group::factory()->create([
        'school_id' => $school->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'name' => 'Tiny',
        'active' => true,
    ]);

    $student = Student::factory()->create(['school_id' => $school->id]);
    Enrollment::factory()->create([
        'school_id' => $school->id,
        'student_id' => $student->id,
        'group_id' => $smallGroup->id,
        'active' => true,
    ]);

    $response = $this->actingAs($user)->get(route('dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->where('alerts.under_enrolled.count', 1)
        ->where('alerts.under_enrolled.items.0.group_name', 'Tiny')
    );
});
