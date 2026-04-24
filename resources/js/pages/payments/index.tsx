import { Head, useForm, router, Link } from '@inertiajs/react';
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
import { index, unpaid, update, destroy } from '@/actions/App/Http/Controllers/PaymentController';
import type { Payment, PaginatedData } from '@/types';
import { Pencil, Trash2, Receipt } from 'lucide-react';
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

const currentYear = String(new Date().getFullYear());

type Props = {
    payments: PaginatedData<Payment>;
    filters: {
        search?: string;
        month?: string;
        year?: string;
    };
};

type EditFormData = {
    amount: string;
    paid_at: string;
    notes: string;
};

export default function PaymentsIndex({ payments, filters }: Props) {
    const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

    const editForm = useForm<EditFormData>({ amount: '', paid_at: '', notes: '' });

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

    function handleEdit(e: FormEvent) {
        e.preventDefault();
        if (!editingPayment) return;
        editForm.put(update.url(editingPayment.id), {
            onSuccess: () => setEditingPayment(null),
        });
    }

    function handleDelete(payment: Payment) {
        if (!confirm('Voulez-vous vraiment supprimer ce paiement ?')) return;
        router.delete(destroy.url(payment.id));
    }

    function openEdit(payment: Payment) {
        editForm.setData({
            amount: payment.amount,
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
            <Head title="Historique des paiements" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Historique des paiements</h1>
                <Button asChild variant="outline">
                    <Link href={unpaid.url()}>
                        <Receipt className="mr-2 h-4 w-4" />
                        Voir les impayés
                    </Link>
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <Input
                    placeholder="Rechercher par nom d'élève..."
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
                            <TableHead>Élève</TableHead>
                            <TableHead>Groupe</TableHead>
                            <TableHead>Matière</TableHead>
                            <TableHead>Période</TableHead>
                            <TableHead>Montant</TableHead>
                            <TableHead>Payé le</TableHead>
                            <TableHead className="w-24"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {payments.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    Aucun paiement trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            payments.data.map((payment) => (
                                <TableRow key={payment.id}>
                                    <TableCell className="font-medium">{payment.enrollment?.student?.full_name ?? '-'}</TableCell>
                                    <TableCell>{payment.enrollment?.group?.name ?? '-'}</TableCell>
                                    <TableCell>{payment.enrollment?.group?.subject?.name ?? '-'}</TableCell>
                                    <TableCell>{monthLabel(payment.period_month)} {payment.period_year}</TableCell>
                                    <TableCell>{Number(payment.amount).toFixed(2).replace('.', ',')} DH</TableCell>
                                    <TableCell>{payment.paid_at}</TableCell>
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
                        Affichage de {payments.meta.from} à {payments.meta.to} sur {payments.meta.total} paiements
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

            <Dialog open={!!editingPayment} onOpenChange={(open) => !open && setEditingPayment(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Modifier le paiement</DialogTitle>
                    </DialogHeader>
                    {editingPayment && (
                        <form onSubmit={handleEdit}>
                            <div className="grid gap-4 py-4">
                                <p className="text-sm text-muted-foreground">
                                    {editingPayment.enrollment?.student?.full_name} · {editingPayment.enrollment?.group?.name}
                                    <br />
                                    Période : {monthLabel(editingPayment.period_month)} {editingPayment.period_year}
                                </p>
                                <div className="grid gap-2">
                                    <Label>Montant (DH)</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={editForm.data.amount}
                                        onChange={(e) => editForm.setData('amount', e.target.value)}
                                    />
                                    <InputError message={editForm.errors.amount} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Payé le</Label>
                                    <Input
                                        type="date"
                                        value={editForm.data.paid_at}
                                        onChange={(e) => editForm.setData('paid_at', e.target.value)}
                                    />
                                    <InputError message={editForm.errors.paid_at} />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Remarques</Label>
                                    <Textarea
                                        value={editForm.data.notes}
                                        onChange={(e) => editForm.setData('notes', e.target.value)}
                                        rows={2}
                                    />
                                    <InputError message={editForm.errors.notes} />
                                </div>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" type="button">Annuler</Button>
                                </DialogClose>
                                <Button type="submit" disabled={editForm.processing}>
                                    {editForm.processing && <Spinner />}
                                    Enregistrer
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

PaymentsIndex.layout = {
    breadcrumbs: [
        { title: 'Paiements', href: index.url() },
        { title: 'Historique', href: index.url() },
    ],
};
