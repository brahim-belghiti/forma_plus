<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePaymentRequest;
use App\Http\Requests\UpdatePaymentRequest;
use App\Http\Resources\EnrollmentResource;
use App\Http\Resources\PaymentResource;
use App\Models\Enrollment;
use App\Models\Payment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Payment::class);

        $query = Payment::with(['enrollment.student', 'enrollment.group.subject', 'enrollment.group.teacher'])
            ->orderByDesc('paid_at')
            ->orderByDesc('id');

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->whereHas('enrollment.student', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('month') && $request->filled('year')) {
            $query->where('period_month', $request->integer('month'))
                ->where('period_year', $request->integer('year'));
        }

        return Inertia::render('payments/index', [
            'payments' => PaymentResource::collection($query->paginate(20)->withQueryString()),
            'filters' => $request->only(['search', 'month', 'year']),
        ]);
    }

    public function unpaid(Request $request): Response
    {
        Gate::authorize('viewAny', Payment::class);

        $enrollments = Enrollment::with(['student', 'group.subject', 'group.teacher', 'payments'])
            ->active()
            ->get();

        $rows = [];
        foreach ($enrollments as $enrollment) {
            $periods = $enrollment->unpaidPeriods();
            if (empty($periods)) {
                continue;
            }

            $totalDue = count($periods) * (float) $enrollment->monthly_fee;

            $rows[] = [
                'enrollment' => (new EnrollmentResource($enrollment))->toArray($request),
                'unpaid_periods' => $periods,
                'total_due' => $totalDue,
            ];
        }

        usort($rows, fn ($a, $b) => $b['total_due'] <=> $a['total_due']);

        if ($request->filled('search')) {
            $search = mb_strtolower((string) $request->string('search'));
            $rows = array_values(array_filter($rows, function ($row) use ($search) {
                $student = $row['enrollment']['student'] ?? [];
                $name = mb_strtolower(($student['first_name'] ?? '').' '.($student['last_name'] ?? ''));

                return str_contains($name, $search);
            }));
        }

        return Inertia::render('payments/unpaid', [
            'rows' => $rows,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(StorePaymentRequest $request): RedirectResponse
    {
        Payment::create($request->validated());

        return back();
    }

    public function update(UpdatePaymentRequest $request, Payment $payment): RedirectResponse
    {
        $payment->update($request->validated());

        return back();
    }

    public function destroy(Payment $payment): RedirectResponse
    {
        Gate::authorize('delete', $payment);

        $payment->delete();

        return back();
    }
}
