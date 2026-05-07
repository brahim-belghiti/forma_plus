import { Head } from '@inertiajs/react';

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

type Receipt = {
    receipt_number: string;
    amount: string;
    period_month: number;
    period_year: number;
    paid_at: string;
    school_name: string;
    student_name: string;
    subject_name: string | null;
};

type Props = {
    receipt: Receipt;
};

export default function ReceiptShow({ receipt }: Props) {
    const periodLabel = `${MONTHS[receipt.period_month - 1]} ${receipt.period_year}`;
    const shortRef = receipt.receipt_number.slice(-8).toUpperCase();

    return (
        <>
            <Head title={`Reçu ${shortRef}`} />
            <div className="min-h-screen bg-neutral-50 py-12 px-4 dark:bg-neutral-950">
                <main className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-lg dark:bg-neutral-900">
                    <header className="mb-6 border-b border-neutral-200 pb-4 dark:border-neutral-800">
                        <p className="text-xs uppercase tracking-wide text-neutral-500">Reçu de paiement</p>
                        <h1 className="mt-1 text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                            {receipt.school_name}
                        </h1>
                    </header>

                    <dl className="space-y-3 text-sm">
                        <Row label="Élève" value={receipt.student_name} />
                        {receipt.subject_name && <Row label="Matière" value={receipt.subject_name} />}
                        <Row label="Période" value={periodLabel} />
                        <Row label="Date de paiement" value={receipt.paid_at} />
                        <Row label="Montant" value={`${receipt.amount} MAD`} highlight />
                    </dl>

                    <footer className="mt-8 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                        <p className="text-xs text-neutral-500">N° de reçu</p>
                        <p className="mt-1 font-mono text-sm break-all text-neutral-700 dark:text-neutral-300">
                            {receipt.receipt_number}
                        </p>
                    </footer>
                </main>
            </div>
        </>
    );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-baseline justify-between gap-4">
            <dt className="text-neutral-500">{label}</dt>
            <dd className={highlight ? 'text-base font-semibold text-neutral-900 dark:text-neutral-100' : 'text-neutral-800 dark:text-neutral-200'}>
                {value}
            </dd>
        </div>
    );
}
