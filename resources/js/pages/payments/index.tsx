import { Head, useForm, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { index, store, update, destroy } from '@/actions/App/Http/Controllers/PaymentController';
import type { Payment, Student, PaginatedData } from '@/types';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';

const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
];

type Props = {
    payments: PaginatedData<Payment>;
    students: { data: Student[] };
    filters: {
        search?: string;
        month?: string;
        year?: string;
    };
};

type PaymentFormData = {
    student_id: string;
    amount: string;
    period_month: string;
    period_year: string;
    paid_at: string;
    notes: string;
};

function todayString() {
    return new Date().toISOString().slice(0, 10);
}

const currentMonth = String(new Date().getMonth() + 1);
const currentYear = String(new Date().getFullYear());

const emptyForm: PaymentFormData = {
    student_id: '',
    amount: '',
    period_month: currentMonth,
    period_year: currentYear,
    paid_at: todayString(),
    notes: '',
};

export default function PaymentsIndex({ payments, students, filters }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

    const createForm = useForm<PaymentFormData>({ ...emptyForm });
    const editForm = useForm<PaymentFormData>({ ...emptyForm });

    const handleSearch = useDebouncedCallback((value: string) => {
        router.get(index.url(), { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    }, 300);

    function handleMonthFilter(value: string) {
        const month = value === 'all' ? undefined : value;
        const year = month ? (filters.year || currentYear) : undefined;
        router.get(index.url(), { ...filters, month, year }, { preserveState: true, replace: true });
    }

    function handleYearFilter(value: string) {
        router.get(index.url(), { ...filters, year: value }, { preserveState: true, replace: true });
    }

    function handleCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(store.url(), {
            onSuccess: () => {
                setShowCreate(false);
                createForm.reset();
                createForm.setData({ ...emptyForm });
            },
        });
    }

    function handleEdit(e: FormEvent) {
        e.preventDefault();
        if (!editingPayment) return;
        editForm.put(update.url(editingPayment.id), {
            onSuccess: () => {
                setEditingPayment(null);
                editForm.reset();
            },
        });
    }

    function handleDelete(payment: Payment) {
        if (!confirm('Are you sure you want to delete this payment?')) return;
        router.delete(destroy.url(payment.id));
    }

    function openEdit(payment: Payment) {
        editForm.setData({
            student_id: String(payment.student_id),
            amount: payment.amount,
            period_month: String(payment.period_month),
            period_year: String(payment.period_year),
            paid_at: payment.paid_at,
            notes: payment.notes ?? '',
        });
        setEditingPayment(payment);
    }

    function monthLabel(month: number): string {
        return MONTHS.find((m) => m.value === month)?.label ?? '';
    }

    const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    return (
        <>
            <Head title="Payments" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Payments</h1>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Log Payment
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <Input
                    placeholder="Search by student name..."
                    defaultValue={filters.search ?? ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={filters.month ?? 'all'} onValueChange={handleMonthFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="All months" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All months</SelectItem>
                        {MONTHS.map((m) => (
                            <SelectItem key={m.value} value={String(m.value)}>
                                {m.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {filters.month && (
                    <Select value={filters.year ?? currentYear} onValueChange={handleYearFilter}>
                        <SelectTrigger className="w-28">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {yearOptions.map((y) => (
                                <SelectItem key={y} value={String(y)}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Student</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Paid On</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="w-24"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    No payments found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.data.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">{payment.student?.full_name}</TableCell>
                                    <TableCell>{monthLabel(payment.period_month)} {payment.period_year}</TableCell>
                                    <TableCell>{Number(payment.amount).toFixed(2)} DH</TableCell>
                                    <TableCell>{payment.paid_at}</TableCell>
                                    <TableCell className="max-w-xs truncate">{payment.notes ?? '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(payment)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(payment)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {payments.meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {payments.meta.from} to {payments.meta.to} of {payments.meta.total} payments
                    </p>
                    <div className="flex gap-1">
                        {payments.meta.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}

            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Log Payment</DialogTitle>
                    </DialogHeader>
                    <PaymentForm
                        form={createForm}
                        onSubmit={handleCreate}
                        students={students.data}
                        submitLabel="Create"
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingPayment} onOpenChange={(open) => !open && setEditingPayment(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Payment</DialogTitle>
                    </DialogHeader>
                    <PaymentForm
                        form={editForm}
                        onSubmit={handleEdit}
                        students={students.data}
                        submitLabel="Save"
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

type PaymentFormProps = {
    form: ReturnType<typeof useForm<PaymentFormData>>;
    onSubmit: (e: FormEvent) => void;
    students: Student[];
    submitLabel: string;
};

function PaymentForm({ form, onSubmit, students, submitLabel }: PaymentFormProps) {
    const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    return (
        <form onSubmit={onSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Student</Label>
                    <Select value={form.data.student_id} onValueChange={(v) => form.setData('student_id', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                            {students.map((student) => (
                                <SelectItem key={student.id} value={String(student.id)}>
                                    {student.full_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.student_id} />
                </div>

                <div className="grid gap-2">
                    <Label>Amount (DH)</Label>
                    <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={form.data.amount}
                        onChange={(e) => form.setData('amount', e.target.value)}
                        placeholder="0.00"
                    />
                    <InputError message={form.errors.amount} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Period Month</Label>
                        <Select value={form.data.period_month} onValueChange={(v) => form.setData('period_month', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {MONTHS.map((m) => (
                                    <SelectItem key={m.value} value={String(m.value)}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.period_month} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Period Year</Label>
                        <Select value={form.data.period_year} onValueChange={(v) => form.setData('period_year', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent>
                                {yearOptions.map((y) => (
                                    <SelectItem key={y} value={String(y)}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <InputError message={form.errors.period_year} />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label>Paid On</Label>
                    <Input
                        type="date"
                        value={form.data.paid_at}
                        onChange={(e) => form.setData('paid_at', e.target.value)}
                    />
                    <InputError message={form.errors.paid_at} />
                </div>

                <div className="grid gap-2">
                    <Label>Notes</Label>
                    <Textarea
                        value={form.data.notes}
                        onChange={(e) => form.setData('notes', e.target.value)}
                        placeholder="Optional notes..."
                        rows={2}
                    />
                    <InputError message={form.errors.notes} />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" type="button">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    {submitLabel}
                </Button>
            </DialogFooter>
        </form>
    );
}

PaymentsIndex.layout = {
    breadcrumbs: [
        { title: 'Payments', href: index.url() },
    ],
};
