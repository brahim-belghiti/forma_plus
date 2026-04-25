<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClassSessionRequest;
use App\Http\Requests\UpdateClassSessionRequest;
use App\Http\Requests\UpsertAttendanceRequest;
use App\Http\Resources\ClassSessionResource;
use App\Http\Resources\GroupResource;
use App\Http\Resources\StudentResource;
use App\Models\ClassSession;
use App\Models\Group;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ClassSessionController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', ClassSession::class);

        $query = ClassSession::with(['group.subject', 'group.teacher'])
            ->withCount([
                'attendances',
                'attendances as present_count' => fn ($q) => $q->where('present', true),
            ])
            ->orderByDesc('date')
            ->orderByDesc('id');

        if ($request->filled('group_id')) {
            $query->where('group_id', $request->integer('group_id'));
        }

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->date('to'));
        }

        return Inertia::render('sessions/index', [
            'sessions' => ClassSessionResource::collection($query->paginate(30)->withQueryString()),
            'groups' => GroupResource::collection(
                Group::with(['subject', 'teacher'])
                    ->active()
                    ->orderBy('name')
                    ->get()
            ),
            'filters' => $request->only(['group_id', 'from', 'to']),
        ]);
    }

    public function show(ClassSession $classSession): Response
    {
        Gate::authorize('view', $classSession);

        $classSession->load([
            'group.subject.level',
            'group.teacher',
            'attendances.student',
        ]);

        $students = Student::query()
            ->whereHas('enrollments', function ($q) use ($classSession) {
                $q->where('group_id', $classSession->group_id)
                    ->where('start_date', '<=', $classSession->date)
                    ->where(function ($q) use ($classSession) {
                        $q->whereNull('end_date')
                            ->orWhere('end_date', '>=', $classSession->date);
                    });
            })
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        return Inertia::render('sessions/show', [
            'session' => new ClassSessionResource($classSession),
            'roster' => StudentResource::collection($students),
        ]);
    }

    public function store(StoreClassSessionRequest $request): RedirectResponse
    {
        ClassSession::create($request->validated());

        return back();
    }

    public function update(UpdateClassSessionRequest $request, ClassSession $classSession): RedirectResponse
    {
        $classSession->update($request->validated());

        return back();
    }

    public function destroy(ClassSession $classSession): RedirectResponse
    {
        Gate::authorize('delete', $classSession);

        $classSession->delete();

        return back();
    }

    public function upsertAttendance(UpsertAttendanceRequest $request, ClassSession $classSession): RedirectResponse
    {
        DB::transaction(function () use ($request, $classSession) {
            foreach ($request->validated('attendances') as $row) {
                $classSession->attendances()->updateOrCreate(
                    ['student_id' => $row['student_id']],
                    [
                        'present' => $row['present'],
                        'notes' => $row['notes'] ?? null,
                    ],
                );
            }
        });

        return back();
    }
}
