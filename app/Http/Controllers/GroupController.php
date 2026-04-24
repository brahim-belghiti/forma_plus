<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreGroupRequest;
use App\Http\Requests\UpdateGroupRequest;
use App\Http\Resources\GroupResource;
use App\Http\Resources\SubjectResource;
use App\Http\Resources\TeacherResource;
use App\Models\Group;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class GroupController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Group::class);

        $groups = Group::with(['subject.level', 'teacher'])
            ->withCount(['enrollments as active_enrollments_count' => fn ($q) => $q->where('active', true)])
            ->when($request->input('search'), fn ($q, $search) => $q->where('name', 'like', "%{$search}%"))
            ->orderByDesc('active')
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('groups/index', [
            'groups' => GroupResource::collection($groups),
            'subjects' => SubjectResource::collection(Subject::with('level')->orderBy('name')->get()),
            'teachers' => TeacherResource::collection(Teacher::with('subjects')->orderBy('first_name')->get()),
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(StoreGroupRequest $request): RedirectResponse
    {
        Group::create($request->validated());

        return back();
    }

    public function update(UpdateGroupRequest $request, Group $group): RedirectResponse
    {
        $group->update($request->validated());

        return back();
    }

    public function destroy(Group $group): RedirectResponse
    {
        Gate::authorize('delete', $group);

        $group->delete();

        return back();
    }
}
