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
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import { index, unpaid, store } from '@/actions/App/Http/Controllers/PaymentController';
import type { UnpaidRow } from '@/types';
import { History, CheckCircle2 } from 'lucide-react';
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
    rows: UnpaidRow[];
    filters: { search?: string };
};

type PayFormData = {
    enrollment_id: string;
    amount: string;
    period_month: string;
    period_year: string;
    paid_at: string;
    notes: string;
};

function todayString() {
    return new Date().toISOString().slice(0, 10);
}

function monthLabel(m: number) {
    return MONTHS.find((x) => x.value === m)?.label ?? '';
}

export default function UnpaidIndex({ rows, filters }: Props) {
    const [payingRow, setPayingRow] = useState<UnpaidRow | null>(null);

    const form = useForm<PayFormData>({
        enrollment_id: '',
        amount: '',
        period_month: '',
        period_year: '',
        paid_at: todayString(),
        notes: '',
    });

    const handleSearch = useDebouncedCallback((value: string) => {
        router.get(unpaid.url(), { search: value || undefined }, { preserveState: true, replace: true });
    }, 300);

    function openPay(row: UnpaidRow, period: { year: number; month: number }) {
        form.setData({
            enrollment_id: String(row.enrollment.id),
            amount: row.enrollment.monthly_fee,
            period_month: String(period.month),
            period_year: String(period.year),
            paid_at: todayString(),
            notes: '',
        });
        setPayingRow(row);
    }

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.post(store.url(), {
            preserveScroll: true,
            onSuccess: () => setPayingRow(null),
        });
    }

    const totalDueAll = rows.reduce((sum, r) => sum + r.total_due, 0);

    return (
        <>
            <Head title="Impayés" />
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-semibold">Impayés</h1>
                    <p className="text-sm text-muted-foreground">
                        Élèves avec des mois non réglés sur leurs inscriptions actives.
                    </p>
                </div>
                <Button asChild variant="outline">
                    <Link href={index.url()}>
                        <History className="mr-2 h-4 w-4" />
                        Historique des paiements
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
                {rows.length > 0 && (
                    <p className="text-sm">
                        <span className="text-muted-foreground">Total dû :</span>{' '}
                        <span className="font-semibold">{totalDueAll.toFixed(2).replace('.', ',')} DH</span>
                    </p>
                )}
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Élève</TableHead>
                            <TableHead>Groupe</TableHead>
                            <TableHead>Matière</TableHead>
                            <TableHead>Tarif mensuel</TableHead>
                            <TableHead>Mois dus</TableHead>
                            <TableHead className="text-right">Total dû</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                                    <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-green-500" />
                                    Aucun impayé. Tout est à jour !
                                </TableCell>
                            </TableRow>
                        ) : (
                            rows.map((row) => (
                                <TableRow key={row.enrollment.id}>
                                    <TableCell className="font-medium">{row.enrollment.student?.full_name}</TableCell>
                                    <TableCell>{row.enrollment.group?.name}</TableCell>
                                    <TableCell>{row.enrollment.group?.subject?.name}</TableCell>
                                    <TableCell>{Number(row.enrollment.monthly_fee).toFixed(2).replace('.', ',')} DH</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {row.unpaid_periods.map((p) => (
                                                <Badge
                                                    key={`${p.year}-${p.month}`}
                                                    variant="outline"
                                                    className="cursor-pointer hover:bg-accent"
                                                    onClick={() => openPay(row, p)}
                                                >
                                                    {monthLabel(p.month)} {p.year}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {row.total_due.toFixed(2).replace('.', ',')} DH
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={!!payingRow} onOpenChange={(open) => !open && setPayingRow(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Enregistrer un paiement</DialogTitle>
                    </DialogHeader>
                    {payingRow && (
                        <form onSubmit={handleSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                                    <p className="font-medium">{payingRow.enrollment.student?.full_name}</p>
                                    <p className="text-muted-foreground">
                                        {payingRow.enrollment.group?.name} · {payingRow.enrollment.group?.subject?.name}
                                    </p>
                                    <p className="text-muted-foreground">
                                        Période : {monthLabel(Number(form.data.period_month))} {form.data.period_year}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>Mois</Label>
                                        <Select value={form.data.period_month} onValueChange={(v) => form.setData('period_month', v)}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {payingRow.unpaid_periods.map((p) => (
                                                    <SelectItem key={`${p.year}-${p.month}`} value={String(p.month)}>
                                                        {monthLabel(p.month)} {p.year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <InputError message={form.errors.period_month} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Montant (DH)</Label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={form.data.amount}
                                            onChange={(e) => form.setData('amount', e.target.value)}
                                        />
                                        <InputError message={form.errors.amount} />
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
                                        rows={2}
                                        placeholder="Remarques facultatives..."
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
                                    Enregistrer le paiement
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

UnpaidIndex.layout = {
    breadcrumbs: [
        { title: 'Paiements', href: unpaid.url() },
        { title: 'Impayés', href: unpaid.url() },
    ],
};
