<?php

use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\LevelController;
use App\Http\Controllers\PaymentController;
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
    Route::resource('classrooms', ClassroomController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('timeslots', TimeslotController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('payments', PaymentController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('salaries', SalaryController::class)->only(['index', 'store', 'update', 'destroy']);
    Route::resource('expenses', ExpenseController::class)->only(['index', 'store', 'update', 'destroy']);
});

require __DIR__.'/settings.php';
