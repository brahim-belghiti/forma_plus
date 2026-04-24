<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTimeslotRequest;
use App\Http\Requests\UpdateTimeslotRequest;
use App\Http\Resources\ClassroomResource;
use App\Http\Resources\GroupResource;
use App\Http\Resources\TimeslotResource;
use App\Models\Classroom;
use App\Models\Group;
use App\Models\Timeslot;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TimeslotController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('viewAny', Timeslot::class);

        return Inertia::render('timeslots/index', [
            'timeslots' => TimeslotResource::collection(
                Timeslot::with(['group.subject.level', 'group.teacher', 'classroom'])
                    ->orderByRaw('FIELD(day_of_week, 1, 2, 3, 4, 5, 6, 0)')
                    ->orderBy('start_time')
                    ->get()
            ),
            'groups' => GroupResource::collection(
                Group::with(['subject.level', 'teacher'])
                    ->where('active', true)
                    ->orderBy('name')
                    ->get()
            ),
            'classrooms' => ClassroomResource::collection(Classroom::orderBy('name')->get()),
        ]);
    }

    public function store(StoreTimeslotRequest $request): RedirectResponse
    {
        Timeslot::create($request->validated());

        return back();
    }

    public function update(UpdateTimeslotRequest $request, Timeslot $timeslot): RedirectResponse
    {
        $timeslot->update($request->validated());

        return back();
    }

    public function destroy(Timeslot $timeslot): RedirectResponse
    {
        Gate::authorize('delete', $timeslot);

        $timeslot->delete();

        return back();
    }
}
