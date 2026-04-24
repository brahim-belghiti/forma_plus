<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Payment;
use App\Models\Salary;
use App\Models\Student;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->isAdmin()) {
            return redirect()->route('students.index');
        }

        $totalPayments = Payment::sum('amount');
        $totalSalaries = Salary::sum('amount');
        $totalExpenses = Expense::sum('amount');
        $balance = $totalPayments - $totalSalaries - $totalExpenses;

        return Inertia::render('dashboard', [
            'stats' => [
                'total_students' => Student::count(),
                'total_teachers' => Teacher::count(),
                'total_payments' => (float) $totalPayments,
                'total_salaries' => (float) $totalSalaries,
                'total_expenses' => (float) $totalExpenses,
                'balance' => (float) $balance,
            ],
        ]);
    }
}
