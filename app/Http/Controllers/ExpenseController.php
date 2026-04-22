<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreExpenseRequest;
use App\Http\Requests\UpdateExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Expense::class);

        $query = Expense::orderByDesc('spent_at')
            ->orderByDesc('id');

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where('description', 'like', "%{$search}%");
        }

        return Inertia::render('expenses/index', [
            'expenses' => ExpenseResource::collection($query->paginate(20)->withQueryString()),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(StoreExpenseRequest $request): RedirectResponse
    {
        Expense::create($request->validated());

        return back();
    }

    public function update(UpdateExpenseRequest $request, Expense $expense): RedirectResponse
    {
        $expense->update($request->validated());

        return back();
    }

    public function destroy(Expense $expense): RedirectResponse
    {
        Gate::authorize('delete', $expense);

        $expense->delete();

        return back();
    }
}
