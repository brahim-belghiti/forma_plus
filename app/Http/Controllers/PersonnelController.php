<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\ResetPersonnelPasswordRequest;
use App\Http\Requests\StorePersonnelRequest;
use App\Http\Requests\UpdatePersonnelRequest;
use App\Http\Resources\PersonnelResource;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PersonnelController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', User::class);

        return Inertia::render('personnel/index', [
            'personnel' => PersonnelResource::collection(
                User::query()
                    ->where('school_id', request()->user()->school_id)
                    ->where('role', UserRole::Secretary)
                    ->orderBy('name')
                    ->get()
            ),
        ]);
    }

    public function store(StorePersonnelRequest $request): RedirectResponse
    {
        User::create([
            ...$request->validated(),
            'role' => UserRole::Secretary,
            'school_id' => $request->user()->school_id,
        ]);

        return back();
    }

    public function update(UpdatePersonnelRequest $request, User $personnel): RedirectResponse
    {
        $personnel->update($request->validated());

        return back();
    }

    public function destroy(User $personnel): RedirectResponse
    {
        Gate::authorize('delete', $personnel);

        $personnel->delete();

        return back();
    }

    public function resetPassword(ResetPersonnelPasswordRequest $request, User $personnel): RedirectResponse
    {
        $personnel->update($request->validated());

        return back();
    }
}
