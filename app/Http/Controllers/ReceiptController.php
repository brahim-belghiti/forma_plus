<?php

namespace App\Http\Controllers;

use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ReceiptController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Payment::class);

        $q = trim((string) $request->string('q'));

        $results = [];

        if ($q !== '') {
            $payments = Payment::query()
                ->with(['enrollment.student', 'enrollment.group.subject', 'recorder'])
                ->where(function ($query) use ($q) {
                    $query->where('receipt_number', 'like', "%{$q}%")
                        ->orWhereHas('enrollment.student', function ($s) use ($q) {
                            $s->where('first_name', 'like', "%{$q}%")
                                ->orWhere('last_name', 'like', "%{$q}%");
                        });
                })
                ->orderByDesc('paid_at')
                ->orderByDesc('id')
                ->limit(50)
                ->get();

            $results = $payments->map(fn (Payment $p) => [
                'receipt_number' => $p->receipt_number,
                'amount' => $p->amount,
                'period_month' => $p->period_month,
                'period_year' => $p->period_year,
                'paid_at' => $p->paid_at->format('Y-m-d'),
                'student_name' => trim($p->enrollment->student->first_name.' '.$p->enrollment->student->last_name),
                'subject_name' => $p->enrollment->group->subject->name ?? null,
                'recorded_by' => $p->recorder?->name,
                'url' => route('receipts.show', $p->receipt_number),
            ])->all();
        }

        return Inertia::render('receipts/index', [
            'results' => $results,
            'filters' => ['q' => $q],
        ]);
    }

    public function show(Payment $payment): Response
    {
        $payment->load(['enrollment.student', 'school', 'enrollment.group.subject']);

        return Inertia::render('receipts/show', [
            'receipt' => [
                'receipt_number' => $payment->receipt_number,
                'amount' => $payment->amount,
                'period_month' => $payment->period_month,
                'period_year' => $payment->period_year,
                'paid_at' => $payment->paid_at->format('Y-m-d'),
                'school_name' => $payment->school->name,
                'student_name' => trim($payment->enrollment->student->first_name.' '.$payment->enrollment->student->last_name),
                'subject_name' => $payment->enrollment->group->subject->name ?? null,
            ],
        ]);
    }
}
