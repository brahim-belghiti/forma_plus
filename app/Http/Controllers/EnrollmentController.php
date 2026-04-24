<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEnrollmentRequest;
use App\Http\Requests\UpdateEnrollmentRequest;
use App\Models\Enrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;

class EnrollmentController extends Controller
{
    public function store(StoreEnrollmentRequest $request): RedirectResponse
    {
        Enrollment::create($request->validated());

        return back();
    }

    public function update(UpdateEnrollmentRequest $request, Enrollment $enrollment): RedirectResponse
    {
        $enrollment->update($request->validated());

        return back();
    }

    public function end(Enrollment $enrollment): RedirectResponse
    {
        Gate::authorize('update', $enrollment);

        $enrollment->end();

        return back();
    }

    public function destroy(Enrollment $enrollment): RedirectResponse
    {
        Gate::authorize('delete', $enrollment);

        $enrollment->delete();

        return back();
    }
}
