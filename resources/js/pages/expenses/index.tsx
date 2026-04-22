import { Head, useForm, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { index, store, update, destroy } from '@/actions/App/Http/Controllers/ExpenseController';
import type { Expense, PaginatedData } from '@/types';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';

type Props = {
    expenses: PaginatedData<Expense>;
    filters: {
        search?: string;
    };
};

type ExpenseFormData = {
    description: string;
    amount: string;
    spent_at: string;
    notes: string;
};

function todayString() {
    return new Date().toISOString().slice(0, 10);
}

const emptyForm: ExpenseFormData = {
    description: '',
    amount: '',
    spent_at: todayString(),
    notes: '',
};

export default function ExpensesIndex({ expenses, filters }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const createForm = useForm<ExpenseFormData>({ ...emptyForm });
    const editForm = useForm<ExpenseFormData>({ ...emptyForm });

    const handleSearch = useDebouncedCallback((value: string) => {
        router.get(index.url(), { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    }, 300);

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
        if (!editingExpense) return;
        editForm.put(update.url(editingExpense.id), {
            onSuccess: () => {
                setEditingExpense(null);
                editForm.reset();
            },
        });
    }

    function handleDelete(expense: Expense) {
        if (!confirm(`Are you sure you want to delete "${expense.description}"?`)) return;
        router.delete(destroy.url(expense.id));
    }

    function openEdit(expense: Expense) {
        editForm.setData({
            description: expense.description,
            amount: expense.amount,
            spent_at: expense.spent_at,
            notes: expense.notes ?? '',
        });
        setEditingExpense(expense);
    }

    return (
        <>
            <Head title="Expenses" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Expenses</h1>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <Input
                    placeholder="Search by description..."
                    defaultValue={filters.search ?? ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Description</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Notes</TableHead>
                            <TableHead className="w-24"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {expenses.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                    No expenses found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            expenses.data.map((expense) => (
                                <TableRow key={expense.id}>
                                    <TableCell className="font-medium">{expense.description}</TableCell>
                                    <TableCell>{Number(expense.amount).toFixed(2)} DH</TableCell>
                                    <TableCell>{expense.spent_at}</TableCell>
                                    <TableCell className="max-w-xs truncate">{expense.notes ?? '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(expense)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(expense)}>
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

            {expenses.meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {expenses.meta.from} to {expenses.meta.to} of {expenses.meta.total} expenses
                    </p>
                    <div className="flex gap-1">
                        {expenses.meta.links.map((link, i) => (
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Expense</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <ExpenseFormFields form={createForm} />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" type="button">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing && <Spinner />}
                                Create
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Expense</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit}>
                        <ExpenseFormFields form={editForm} />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" type="button">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing && <Spinner />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

function ExpenseFormFields({ form }: { form: ReturnType<typeof useForm<ExpenseFormData>> }) {
    return (
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label>Description</Label>
                <Input
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                    placeholder="e.g. Office supplies"
                    autoFocus
                />
                <InputError message={form.errors.description} />
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

            <div className="grid gap-2">
                <Label>Date</Label>
                <Input
                    type="date"
                    value={form.data.spent_at}
                    onChange={(e) => form.setData('spent_at', e.target.value)}
                />
                <InputError message={form.errors.spent_at} />
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
    );
}

ExpensesIndex.layout = {
    breadcrumbs: [
        { title: 'Expenses', href: index.url() },
    ],
};
