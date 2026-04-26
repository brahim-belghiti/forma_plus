<?php

use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\ClassSessionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EnrollmentController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\GroupController;
use App\Http\Controllers\LevelController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PersonnelController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\TimeslotController;
use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::resource('levels', LevelController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('subjects', SubjectController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('students', StudentController::class)->except(['show']);
    Route::resource('teachers', TeacherController::class)->except(['show']);

    Route::post('enrollments', [EnrollmentController::class, 'store'])->name('enrollments.store');
    Route::put('enrollments/{enrollment}', [EnrollmentController::class, 'update'])->name('enrollments.update');
    Route::post('enrollments/{enrollment}/end', [EnrollmentController::class, 'end'])->name('enrollments.end');
    Route::delete('enrollments/{enrollment}', [EnrollmentController::class, 'destroy'])->name('enrollments.destroy');
    Route::resource('classrooms', ClassroomController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('groups', GroupController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('timeslots', TimeslotController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('sessions', ClassSessionController::class)
        ->parameters(['sessions' => 'class_session'])
        ->only(['index', 'show', 'store', 'update', 'destroy'])
        ->names([
            'index' => 'sessions.index',
            'show' => 'sessions.show',
            'store' => 'sessions.store',
            'update' => 'sessions.update',
            'destroy' => 'sessions.destroy',
        ]);
    Route::put('sessions/{class_session}/attendance', [ClassSessionController::class, 'upsertAttendance'])
        ->name('sessions.attendance');
    Route::get('payments/unpaid', [PaymentController::class, 'unpaid'])->name('payments.unpaid');
    Route::resource('payments', PaymentController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('salaries', SalaryController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('expenses', ExpenseController::class)->only(['index', 'store', 'update', 'destroy']);

    Route::put('personnel/{personnel}/password', [PersonnelController::class, 'resetPassword'])
        ->name('personnel.password');
    Route::resource('personnel', PersonnelController::class)
        ->parameters(['personnel' => 'personnel'])
        ->only(['index', 'store', 'update', 'destroy']);
});

require __DIR__.'/settings.php';
