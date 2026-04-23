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
import { index, store, update, destroy } from '@/actions/App/Http/Controllers/SalaryController';
import type { Salary, Teacher, PaginatedData } from '@/types';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';

const MONTHS = [
    { value: 1, label: 'Janvier' },
    { value: 2, label: 'Février' },
    { value: 3, label: 'Mars' },
    { value: 4, label: 'Avril' },
    { value: 5, label: 'Mai' },
    { value: 6, label: 'Juin' },
    { value: 7, label: 'Juillet' },
    { value: 8, label: 'Août' },
    { value: 9, label: 'Septembre' },
    { value: 10, label: 'Octobre' },
    { value: 11, label: 'Novembre' },
    { value: 12, label: 'Décembre' },
];

type Props = {
    salaries: PaginatedData<Salary>;
    teachers: { data: Teacher[] };
    filters: {
        search?: string;
        month?: string;
        year?: string;
    };
};

type SalaryFormData = {
    teacher_id: string;
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

const emptyForm: SalaryFormData = {
    teacher_id: '',
    amount: '',
    period_month: currentMonth,
    period_year: currentYear,
    paid_at: todayString(),
    notes: '',
};

export default function SalariesIndex({ salaries, teachers, filters }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingSalary, setEditingSalary] = useState<Salary | null>(null);

    const createForm = useForm<SalaryFormData>({ ...emptyForm });
    const editForm = useForm<SalaryFormData>({ ...emptyForm });

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
        if (!editingSalary) return;
        editForm.put(update.url(editingSalary.id), {
            onSuccess: () => {
                setEditingSalary(null);
                editForm.reset();
            },
        });
    }

    function handleDelete(salary: Salary) {
        if (!confirm('Voulez-vous vraiment supprimer cet enregistrement de salaire ?')) return;
        router.delete(destroy.url(salary.id));
    }

    function openEdit(salary: Salary) {
        editForm.setData({
            teacher_id: String(salary.teacher_id),
            amount: salary.amount,
            period_month: String(salary.period_month),
            period_year: String(salary.period_year),
            paid_at: salary.paid_at,
            notes: salary.notes ?? '',
        });
        setEditingSalary(salary);
    }

    function monthLabel(month: number): string {
        return MONTHS.find((m) => m.value === month)?.label ?? '';
    }

    const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    return (
        <>
            <Head title="Salaires" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Salaires</h1>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Enregistrer un salaire
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <Input
                    placeholder="Rechercher par nom de professeur..."
                    defaultValue={filters.search ?? ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={filters.month ?? 'all'} onValueChange={handleMonthFilter}>
                    <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tous les mois" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les mois</SelectItem>
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
                            <TableHead>Professeur</TableHead>
                            <TableHead>Période</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Payé le</TableHead>
                            <TableHead>Remarques</TableHead>
                            <TableHead className="w-24"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {salaries.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    Aucun enregistrement de salaire trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            salaries.data.map((salary) => (
                                <TableRow key={salary.id}>
                                    <TableCell className="font-medium">{salary.teacher?.full_name}</TableCell>
                                    <TableCell>{monthLabel(salary.period_month)} {salary.period_year}</TableCell>
                                    <TableCell>{Number(salary.amount).toFixed(2).replace('.', ',')} DH</TableCell>
                                    <TableCell>{salary.paid_at}</TableCell>
                                    <TableCell className="max-w-xs truncate">{salary.notes ?? '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(salary)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(salary)}>
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

            {salaries.meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                        Affichage de {salaries.meta.from} à {salaries.meta.to} sur {salaries.meta.total} enregistrements
                    </p>
                    <div className="flex gap-1">
                        {salaries.meta.links.map((link, i) => (
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
                        <DialogTitle>Enregistrer un salaire</DialogTitle>
                    </DialogHeader>
                    <SalaryForm
                        form={createForm}
                        onSubmit={handleCreate}
                        teachers={teachers.data}
                        submitLabel="Créer"
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingSalary} onOpenChange={(open) => !open && setEditingSalary(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Modifier le salaire</DialogTitle>
                    </DialogHeader>
                    <SalaryForm
                        form={editForm}
                        onSubmit={handleEdit}
                        teachers={teachers.data}
                        submitLabel="Enregistrer"
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

type SalaryFormProps = {
    form: ReturnType<typeof useForm<SalaryFormData>>;
    onSubmit: (e: FormEvent) => void;
    teachers: Teacher[];
    submitLabel: string;
};

function SalaryForm({ form, onSubmit, teachers, submitLabel }: SalaryFormProps) {
    const yearOptions = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

    return (
        <form onSubmit={onSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Professeur</Label>
                    <Select value={form.data.teacher_id} onValueChange={(v) => form.setData('teacher_id', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un professeur" />
                        </SelectTrigger>
                        <SelectContent>
                            {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={String(teacher.id)}>
                                    {teacher.full_name} ({teacher.effective_salary_rate}%)
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.teacher_id} />
                </div>

                <div className="grid gap-2">
                    <Label>Montant (DH)</Label>
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
                        <Label>Mois</Label>
                        <Select value={form.data.period_month} onValueChange={(v) => form.setData('period_month', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Mois" />
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
                        <Label>Année</Label>
                        <Select value={form.data.period_year} onValueChange={(v) => form.setData('period_year', v)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Année" />
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
                    <Label>Payé le</Label>
                    <Input
                        type="date"
                        value={form.data.paid_at}
                        onChange={(e) => form.setData('paid_at', e.target.value)}
                    />
                    <InputError message={form.errors.paid_at} />
                </div>

                <div className="grid gap-2">
                    <Label>Remarques</Label>
                    <Textarea
                        value={form.data.notes}
                        onChange={(e) => form.setData('notes', e.target.value)}
                        placeholder="Remarques facultatives..."
                        rows={2}
                    />
                    <InputError message={form.errors.notes} />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" type="button">Annuler</Button>
                </DialogClose>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    {submitLabel}
                </Button>
            </DialogFooter>
        </form>
    );
}

SalariesIndex.layout = {
    breadcrumbs: [
        { title: 'Salaires', href: index.url() },
    ],
};
