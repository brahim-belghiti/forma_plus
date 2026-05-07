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
use App\Http\Controllers\ReceiptController;
use App\Http\Controllers\SalaryController;
use App\Http\Controllers\StudentController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TeacherController;
use App\Http\Controllers\TimeslotController;
use App\Http\Middleware\EnsureSchoolUser;
use App\Http\Middleware\EnsureSuperAdmin;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('receipts/{payment:receipt_number}', [ReceiptController::class, 'show'])
    ->middleware('throttle:receipts')
    ->name('receipts.show');

Route::middleware(['auth', 'verified', EnsureSuperAdmin::class, 'throttle:web'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::inertia('dashboard', 'admin/dashboard')->name('dashboard');
    });

Route::middleware(['auth', 'verified', EnsureSchoolUser::class, 'throttle:web'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::resource('levels', LevelController::class)->only(['index']);
    Route::resource('subjects', SubjectController::class)->only(['index']);
    Route::resource('students', StudentController::class)->only(['index', 'create', 'edit']);
    Route::resource('teachers', TeacherController::class)->only(['index', 'create', 'edit']);
    Route::resource('classrooms', ClassroomController::class)->only(['index']);
    Route::resource('groups', GroupController::class)->only(['index']);
    Route::resource('timeslots', TimeslotController::class)->only(['index']);
    Route::resource('sessions', ClassSessionController::class)
        ->parameters(['sessions' => 'class_session'])
        ->only(['index', 'show'])
        ->names(['index' => 'sessions.index', 'show' => 'sessions.show']);
    Route::get('payments/unpaid', [PaymentController::class, 'unpaid'])->name('payments.unpaid');
    Route::resource('payments', PaymentController::class)->only(['index']);
    Route::get('receipts', [ReceiptController::class, 'index'])->name('receipts.index');
    Route::resource('salaries', SalaryController::class)->only(['index']);
    Route::resource('expenses', ExpenseController::class)->only(['index']);
    Route::resource('personnel', PersonnelController::class)
        ->parameters(['personnel' => 'personnel'])
        ->only(['index']);

    Route::middleware('throttle:mutations')->group(function () {
        Route::resource('levels', LevelController::class)->only(['store', 'update', 'destroy']);
        Route::resource('subjects', SubjectController::class)->only(['store', 'update', 'destroy']);
        Route::resource('students', StudentController::class)->only(['store', 'update', 'destroy']);
        Route::resource('teachers', TeacherController::class)->only(['store', 'update', 'destroy']);

        Route::post('enrollments', [EnrollmentController::class, 'store'])->name('enrollments.store');
        Route::put('enrollments/{enrollment}', [EnrollmentController::class, 'update'])->name('enrollments.update');
        Route::post('enrollments/{enrollment}/end', [EnrollmentController::class, 'end'])->name('enrollments.end');
        Route::delete('enrollments/{enrollment}', [EnrollmentController::class, 'destroy'])->name('enrollments.destroy');

        Route::resource('classrooms', ClassroomController::class)->only(['store', 'update', 'destroy']);
        Route::resource('groups', GroupController::class)->only(['store', 'update', 'destroy']);
        Route::resource('timeslots', TimeslotController::class)->only(['store', 'update', 'destroy']);
        Route::resource('sessions', ClassSessionController::class)
            ->parameters(['sessions' => 'class_session'])
            ->only(['store', 'update', 'destroy'])
            ->names(['store' => 'sessions.store', 'update' => 'sessions.update', 'destroy' => 'sessions.destroy']);
        Route::put('sessions/{class_session}/attendance', [ClassSessionController::class, 'upsertAttendance'])
            ->name('sessions.attendance');

        Route::resource('payments', PaymentController::class)->only(['store', 'update', 'destroy']);
        Route::resource('salaries', SalaryController::class)->only(['store', 'update', 'destroy']);
        Route::resource('expenses', ExpenseController::class)->only(['store', 'update', 'destroy']);

        Route::put('personnel/{personnel}/password', [PersonnelController::class, 'resetPassword'])
            ->name('personnel.password');
        Route::resource('personnel', PersonnelController::class)
            ->parameters(['personnel' => 'personnel'])
            ->only(['store', 'update', 'destroy']);
    });
});

require __DIR__.'/settings.php';
