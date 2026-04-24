<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTeacherRequest;
use App\Http\Requests\UpdateTeacherRequest;
use App\Http\Resources\SubjectResource;
use App\Http\Resources\TeacherResource;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TeacherController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Teacher::class);

        $teachers = Teacher::with(['subjects.level'])
            ->when($request->input('search'), fn ($q, $search) => $q->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            }))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('teachers/index', [
            'teachers' => TeacherResource::collection($teachers),
            'filters' => $request->only(['search']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Teacher::class);

        return Inertia::render('teachers/create', [
            'subjects' => SubjectResource::collection(Subject::with('level')->orderBy('name')->get()),
        ]);
    }

    public function store(StoreTeacherRequest $request): RedirectResponse
    {
        $teacher = Teacher::create($request->safe()->except(['subject_ids']));

        if ($request->validated('subject_ids')) {
            $teacher->subjects()->sync($request->validated('subject_ids'));
        }

        return redirect()->route('teachers.index');
    }

    public function edit(Teacher $teacher): Response
    {
        Gate::authorize('update', $teacher);

        $teacher->load(['subjects.level']);

        return Inertia::render('teachers/edit', [
            'teacher' => new TeacherResource($teacher),
            'subjects' => SubjectResource::collection(Subject::with('level')->orderBy('name')->get()),
        ]);
    }

    public function update(UpdateTeacherRequest $request, Teacher $teacher): RedirectResponse
    {
        $teacher->update($request->safe()->except(['subject_ids']));

        $teacher->subjects()->sync($request->validated('subject_ids') ?? []);

        return redirect()->route('teachers.index');
    }

    public function destroy(Teacher $teacher): RedirectResponse
    {
        Gate::authorize('delete', $teacher);

        $teacher->delete();

        return redirect()->route('teachers.index');
    }
}
