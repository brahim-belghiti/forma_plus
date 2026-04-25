<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStudentRequest;
use App\Http\Requests\UpdateStudentRequest;
use App\Http\Resources\GroupResource;
use App\Http\Resources\LevelResource;
use App\Http\Resources\StudentResource;
use App\Models\Group;
use App\Models\Level;
use App\Models\Student;
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

        $students = Student::with(['level'])
            ->withCount(['enrollments as active_enrollments_count' => fn ($q) => $q->where('active', true)])
            ->when($request->input('search'), function ($q, $search) {
                $tokens = preg_split('/\s+/', trim($search), -1, PREG_SPLIT_NO_EMPTY);

                foreach ($tokens as $token) {
                    $q->where(function ($q) use ($token) {
                        $q->where('first_name', 'like', "%{$token}%")
                            ->orWhere('last_name', 'like', "%{$token}%");
                    });
                }
            })
            ->when($request->input('level_id'), fn ($q, $levelId) => $q->where('level_id', $levelId))
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('students/index', [
            'students' => StudentResource::collection($students),
            'levels' => LevelResource::collection(Level::orderBy('name')->get()),
            'filters' => $request->only(['search', 'level_id']),
        ]);
    }

    public function create(): Response
    {
        Gate::authorize('create', Student::class);

        return Inertia::render('students/create', [
            'levels' => LevelResource::collection(Level::orderBy('name')->get()),
        ]);
    }

    public function store(StoreStudentRequest $request): RedirectResponse
    {
        $student = Student::create($request->validated());

        return redirect()->route('students.edit', $student);
    }

    public function edit(Student $student): Response
    {
        Gate::authorize('update', $student);

        $student->load([
            'level',
            'enrollments.group.subject.level',
            'enrollments.group.teacher',
        ]);

        return Inertia::render('students/edit', [
            'student' => new StudentResource($student),
            'levels' => LevelResource::collection(Level::orderBy('name')->get()),
            'groups' => GroupResource::collection(
                Group::with(['subject.level', 'teacher'])
                    ->where('active', true)
                    ->orderBy('name')
                    ->get()
            ),
        ]);
    }

    public function update(UpdateStudentRequest $request, Student $student): RedirectResponse
    {
        $student->update($request->validated());

        return redirect()->route('students.index');
    }

    public function destroy(Student $student): RedirectResponse
    {
        Gate::authorize('delete', $student);

        $student->delete();

        return redirect()->route('students.index');
    }
}
