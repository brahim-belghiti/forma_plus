import { Head, Link } from '@inertiajs/react';
import { Banknote, Building2, CreditCard, GraduationCap, Receipt, UserCog, Users, UserCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes/admin';
import schoolsRoutes from '@/routes/admin/schools';

type AdminInfo = {
    id: number;
    name: string;
    email: string;
};

type SchoolSummary = {
    id: number;
    name: string;
    created_at: string | null;
    admin?: AdminInfo;
    students_count?: number;
    teachers_count?: number;
};

type Metrics = {
    schools_total: number;
    admins_total: number;
    secretaries_total: number;
    students_total: number;
    teachers_total: number;
    payments_this_month_count: number;
    payments_this_month_total: number;
    expenses_this_month_total: number;
};

type Props = {
    metrics: Metrics;
    recent_schools: { data: SchoolSummary[] };
    top_schools: { data: SchoolSummary[] };
};

function formatCurrency(value: number): string {
    return value.toFixed(2).replace('.', ',') + ' DH';
}

function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

type StatCardProps = {
    title: string;
    value: string | number;
    icon: typeof Building2;
    hint?: string;
    accent?: string;
};

function StatCard({ title, value, icon: Icon, hint, accent }: StatCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className={accent ? `text-2xl font-bold ${accent}` : 'text-2xl font-bold'}>
                    {value}
                </div>
                {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
            </CardContent>
        </Card>
    );
}

export default function AdminDashboard({ metrics, recent_schools, top_schools }: Props) {
    return (
        <>
            <Head title="Super Admin" />
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Tableau de bord SaaS</h1>
                        <p className="text-sm text-muted-foreground">
                            Vue d'ensemble de toutes les écoles inscrites.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={schoolsRoutes.index().url}>
                            <Building2 className="mr-2 h-4 w-4" />
                            Gérer les écoles
                        </Link>
                    </Button>
                </div>

                <section>
                    <h2 className="mb-3 text-lg font-semibold">Plateforme</h2>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                        <StatCard
                            title="Écoles"
                            value={metrics.schools_total}
                            icon={Building2}
                        />
                        <StatCard
                            title="Administrateurs"
                            value={metrics.admins_total}
                            icon={UserCheck}
                        />
                        <StatCard
                            title="Secrétaires"
                            value={metrics.secretaries_total}
                            icon={UserCog}
                        />
                        <StatCard
                            title="Élèves"
                            value={metrics.students_total}
                            icon={Users}
                        />
                        <StatCard
                            title="Professeurs"
                            value={metrics.teachers_total}
                            icon={GraduationCap}
                        />
                    </div>
                </section>

                <section>
                    <h2 className="mb-3 text-lg font-semibold">Finances ce mois-ci</h2>
                    <div className="grid gap-4 md:grid-cols-3">
                        <StatCard
                            title="Paiements encaissés"
                            value={formatCurrency(metrics.payments_this_month_total)}
                            icon={CreditCard}
                            hint={`${metrics.payments_this_month_count} paiement${metrics.payments_this_month_count !== 1 ? 's' : ''}`}
                            accent="text-emerald-600"
                        />
                        <StatCard
                            title="Dépenses"
                            value={formatCurrency(metrics.expenses_this_month_total)}
                            icon={Receipt}
                            accent="text-rose-600"
                        />
                        <StatCard
                            title="Solde net"
                            value={formatCurrency(metrics.payments_this_month_total - metrics.expenses_this_month_total)}
                            icon={Banknote}
                            accent={
                                metrics.payments_this_month_total - metrics.expenses_this_month_total >= 0
                                    ? 'text-emerald-600'
                                    : 'text-rose-600'
                            }
                        />
                    </div>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Écoles récentes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {recent_schools.data.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Aucune école pour l'instant.
                                </p>
                            ) : (
                                <ul className="divide-y">
                                    {recent_schools.data.map((school) => (
                                        <li key={school.id} className="py-2.5">
                                            <Link
                                                href={schoolsRoutes.show(school.id).url}
                                                className="flex items-center justify-between gap-2 hover:underline"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{school.name}</p>
                                                    {school.admin && (
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {school.admin.name} · {school.admin.email}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="shrink-0 text-right text-xs text-muted-foreground">
                                                    <p>{formatDate(school.created_at)}</p>
                                                    <p>
                                                        {school.students_count ?? 0} élèves ·{' '}
                                                        {school.teachers_count ?? 0} prof.
                                                    </p>
                                                </div>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Top écoles par nombre d'élèves</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {top_schools.data.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Aucune école pour l'instant.
                                </p>
                            ) : (
                                <ul className="divide-y">
                                    {top_schools.data.map((school) => (
                                        <li key={school.id} className="py-2.5">
                                            <Link
                                                href={schoolsRoutes.show(school.id).url}
                                                className="flex items-center justify-between gap-2 hover:underline"
                                            >
                                                <span className="truncate font-medium">{school.name}</span>
                                                <span className="shrink-0 text-xs text-muted-foreground">
                                                    {school.students_count ?? 0} élèves
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AdminDashboard.layout = {
    breadcrumbs: [{ title: 'Tableau de bord', href: dashboard() }],
};
