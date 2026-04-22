<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Resources\LevelResource;
use App\Http\Resources\StudentResource;
use App\Http\Resources\SubjectResource;
use App\Models\Level;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Student::class);

        $students = Student::with(['level', 'subjects'])
            ->withCount('subjects')
            ->when($request->input('search'), fn ($q, $search) => $q->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            }))
            ->when($request->input('level_id'), fn ($q, $levelId) => $q->where('level_id', $levelId))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('students/index', [
            'students' => StudentResource::collection($students),
            'levels' => LevelResource::collection(Level::orderBy('name')->get()),
            'subjects' => SubjectResource::collection(Subject::orderBy('name')->get()),
            'filters' => $request->only(['search', 'level_id']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Student::class);

        return Inertia::render('students/create', [
            'levels' => LevelResource::collection(Level::orderBy('name')->get()),
            'subjects' => SubjectResource::collection(Subject::orderBy('name')->get()),
        ]);
    }

    public function store(StoreStudentRequest $request): RedirectResponse
    {
        $student = Student::create($request->safe()->except('subject_ids'));

        if ($request->validated('subject_ids')) {
            $student->subjects()->sync($request->validated('subject_ids'));
        }

        return redirect()->route('students.index');
    }

    public function edit(Student $student): Response
    {
        Gate::authorize('update', $student);

        $student->load(['level', 'subjects']);

        return Inertia::render('students/edit', [
            'student' => new StudentResource($student),
            'levels' => LevelResource::collection(Level::orderBy('name')->get()),
            'subjects' => SubjectResource::collection(Subject::orderBy('name')->get()),
        ]);
    }

    public function update(UpdateStudentRequest $request, Student $student): RedirectResponse
    {
        $student->update($request->safe()->except('subject_ids'));

        $student->subjects()->sync($request->validated('subject_ids') ?? []);

        return redirect()->route('students.index');
    }

    public function destroy(Student $student): RedirectResponse
    {
        Gate::authorize('delete', $student);

        $student->delete();

        return redirect()->route('students.index');
    }
}
