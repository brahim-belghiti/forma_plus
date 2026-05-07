<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\SchoolResource;
use App\Models\Expense;
use App\Models\Payment;
use App\Models\School;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        $recentSchools = School::query()
            ->with('admin')
            ->withCount(['students', 'teachers'])
            ->latest()
            ->limit(5)
            ->get();

        $topSchools = School::query()
            ->with('admin')
            ->withCount(['students'])
            ->orderByDesc('students_count')
            ->limit(5)
            ->get();

        return Inertia::render('admin/dashboard', [
            'metrics' => [
                'schools_total' => School::query()->count(),
                'admins_total' => User::query()->where('role', UserRole::Admin)->count(),
                'secretaries_total' => User::query()->where('role', UserRole::Secretary)->count(),
                'students_total' => Student::query()->count(),
                'teachers_total' => Teacher::query()->count(),
                'payments_this_month_count' => Payment::query()
                    ->whereBetween('paid_at', [$monthStart, $monthEnd])
                    ->count(),
                'payments_this_month_total' => (float) Payment::query()
                    ->whereBetween('paid_at', [$monthStart, $monthEnd])
                    ->sum('amount'),
                'expenses_this_month_total' => (float) Expense::query()
                    ->whereBetween('spent_at', [$monthStart, $monthEnd])
                    ->sum('amount'),
            ],
            'recent_schools' => SchoolResource::collection($recentSchools),
            'top_schools' => SchoolResource::collection($topSchools),
        ]);
    }
}
