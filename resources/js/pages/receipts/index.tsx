import { Head, Link, router } from '@inertiajs/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, ExternalLink } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { index } from '@/routes/receipts';

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

type ReceiptResult = {
    receipt_number: string;
    amount: string;
    period_month: number;
    period_year: number;
    paid_at: string;
    student_name: string;
    subject_name: string | null;
    recorded_by: string | null;
    url: string;
};

type Props = {
    results: ReceiptResult[];
    filters: { q: string };
};

export default function ReceiptsIndex({ results, filters }: Props) {
    const handleSearch = useDebouncedCallback((value: string) => {
        router.get(index.url(), { q: value || undefined }, { preserveState: true, replace: true });
    }, 300);

    return (
        <>
            <Head title="Vérifier un reçu" />
            <div className="mb-6">
                <h1 className="text-2xl font-semibold">Vérifier un reçu</h1>
                <p className="text-sm text-muted-foreground">
                    Recherchez par numéro de reçu (complet ou partiel) ou nom d'élève.
                </p>
            </div>

            <div className="relative mb-4 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    autoFocus
                    placeholder="N° de reçu ou nom..."
                    defaultValue={filters.q ?? ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>N° de reçu</TableHead>
                            <TableHead>Élève</TableHead>
                            <TableHead>Période</TableHead>
                            <TableHead>Payé le</TableHead>
                            <TableHead className="text-right">Montant</TableHead>
                            <TableHead>Encaissé par</TableHead>
                            <TableHead className="w-12"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-12">
                                    {filters.q
                                        ? 'Aucun reçu trouvé.'
                                        : 'Saisissez un numéro de reçu ou un nom pour commencer.'}
                                </TableCell>
                            </TableRow>
                        ) : (
                            results.map((r) => (
                                <TableRow key={r.receipt_number}>
                                    <TableCell className="font-mono text-xs">
                                        {r.receipt_number.slice(-8).toUpperCase()}
                                    </TableCell>
                                    <TableCell className="font-medium">{r.student_name}</TableCell>
                                    <TableCell>{MONTHS[r.period_month - 1]} {r.period_year}</TableCell>
                                    <TableCell>{r.paid_at}</TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {Number(r.amount).toFixed(2).replace('.', ',')} DH
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {r.recorded_by ?? '—'}
                                    </TableCell>
                                    <TableCell>
                                        <Button asChild variant="ghost" size="icon" title="Ouvrir le reçu">
                                            <Link href={r.url} target="_blank">
                                                <ExternalLink className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}

ReceiptsIndex.layout = {
    breadcrumbs: [
        { title: 'Reçus', href: index.url() },
        { title: 'Vérifier un reçu', href: index.url() },
    ],
};
