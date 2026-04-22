<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSalaryRequest;
use App\Http\Requests\UpdateSalaryRequest;
use App\Http\Resources\SalaryResource;
use App\Http\Resources\TeacherResource;
use App\Models\Salary;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SalaryController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Salary::class);

        $query = Salary::with('teacher')
            ->orderByDesc('paid_at')
            ->orderByDesc('id');

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->whereHas('teacher', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('month') && $request->filled('year')) {
            $query->where('period_month', $request->integer('month'))
                ->where('period_year', $request->integer('year'));
        }

        return Inertia::render('salaries/index', [
            'salaries' => SalaryResource::collection($query->paginate(20)->withQueryString()),
            'teachers' => TeacherResource::collection(Teacher::orderBy('first_name')->get()),
            'filters' => $request->only(['search', 'month', 'year']),
        ]);
    }

    public function store(StoreSalaryRequest $request): RedirectResponse
    {
        Salary::create($request->validated());

        return back();
    }

    public function update(UpdateSalaryRequest $request, Salary $salary): RedirectResponse
    {
        $salary->update($request->validated());

        return back();
    }

    public function destroy(Salary $salary): RedirectResponse
    {
        Gate::authorize('delete', $salary);

        $salary->delete();

        return back();
    }
}
