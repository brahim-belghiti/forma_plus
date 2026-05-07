<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResetSchoolAdminPasswordRequest;
use App\Http\Requests\Admin\StoreSchoolRequest;
use App\Http\Requests\Admin\UpdateSchoolRequest;
use App\Http\Resources\Admin\SchoolResource;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class SchoolController extends Controller
{
    public function index(): Response
    {
        $schools = School::query()
            ->with('admin')
            ->withCount(['students', 'teachers', 'payments'])
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('admin/schools/index', [
            'schools' => SchoolResource::collection($schools),
        ]);
    }

    public function show(School $school): Response
    {
        $school->load('admin')->loadCount(['students', 'teachers', 'payments']);

        return Inertia::render('admin/schools/show', [
            'school' => SchoolResource::make($school),
        ]);
    }

    public function store(StoreSchoolRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data) {
            $school = School::create([
                'name' => $data['name'],
                'default_salary_rate' => $data['default_salary_rate'] ?? 0,
            ]);

            User::create([
                'name' => $data['admin']['name'],
                'email' => $data['admin']['email'],
                'password' => Hash::make($data['admin']['password']),
                'role' => UserRole::Admin,
                'school_id' => $school->id,
                'email_verified_at' => now(),
            ]);
        });

        return back();
    }

    public function update(UpdateSchoolRequest $request, School $school): RedirectResponse
    {
        $school->update($request->validated());

        return back();
    }

    public function destroy(School $school): RedirectResponse
    {
        if ($school->hasData()) {
            throw ValidationException::withMessages([
                'school' => 'Cette école contient des données et ne peut pas être supprimée.',
            ]);
        }

        $school->delete();

        return back();
    }

    public function resetAdminPassword(ResetSchoolAdminPasswordRequest $request, School $school): RedirectResponse
    {
        $admin = $school->admin;

        if (! $admin) {
            throw ValidationException::withMessages([
                'admin' => 'Aucun administrateur n\'est associé à cette école.',
            ]);
        }

        $admin->update([
            'password' => Hash::make($request->validated('password')),
        ]);

        return back();
    }
}
