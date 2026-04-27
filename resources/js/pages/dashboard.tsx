import { Head, Link } from '@inertiajs/react';
import { Activity as ActivityIcon, AlertCircle, AlertTriangle, Banknote, BookOpen, Building2, CalendarCheck, CalendarX, Clock, CreditCard, Minus, Percent, PiggyBank, Receipt, TrendingDown, TrendingUp, UserCheck, UserX, Users, UsersRound, Wallet } from 'lucide-react';
import { useState } from 'react';
import { index as groupsIndex } from '@/actions/App/Http/Controllers/GroupController';
import { edit as editStudent } from '@/actions/App/Http/Controllers/StudentController';
import { edit as editTeacher } from '@/actions/App/Http/Controllers/TeacherController';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';

type MonthMoney = {
    label: string;
    revenue: number;
    salaries: number;
    expenses: number;
    profit: number;
    billable: number;
    collected_for_period: number;
    recovery_rate: number | null;
};

type PreviousMoney = {
    revenue: number;
    profit: number;
    recovery_rate: number | null;
};

type AlertSection<T> = { count: number; items: T[] };

type UnpaidItem = { student_id: number; student_name: string; unpaid_count: number; total_due: number };
type UnderEnrolledItem = { group_id: number; group_name: string; subject_name: string | null; active_count: number };
type IdleTeacherItem = { teacher_id: number; full_name: string };
type LowAttendanceItem = { student_id: number; student_name: string; rate: number; total_sessions: number };

type Alerts = {
    unpaid: AlertSection<UnpaidItem>;
    under_enrolled: AlertSection<UnderEnrolledItem>;
    idle_teachers: AlertSection<IdleTeacherItem>;
    low_attendance: AlertSection<LowAttendanceItem>;
};

type TeacherHours = { teacher_id: number; full_name: string; weekly_hours: number };

type Activity = {
    active_students: number;
    sessions_this_month: number;
    teacher_absent_count: number;
    attendance_rate: number | null;
    classroom_utilization: number | null;
    teaching_hours_per_week: number;
    top_teachers: TeacherHours[];
};

type Totals = {
    students: number;
    teachers: number;
    all_time_revenue: number;
    all_time_salaries: number;
    all_time_expenses: number;
};

type Props = {
    month: MonthMoney;
    previous: PreviousMoney;
    outstanding: number;
    alerts: Alerts;
    activity: Activity;
    totals: Totals;
};

type Tab = 'finances' | 'alertes' | 'activite';

const TABS: { id: Tab; label: string }[] = [
    { id: 'finances', label: 'Finances' },
    { id: 'alertes', label: 'Alertes' },
    { id: 'activite', label: 'Activité' },
];

const STORAGE_KEY = 'dashboard-tab';

function formatCurrency(value: number): string {
    return value.toFixed(2).replace('.', ',') + ' DH';
}

function formatPct(value: number | null): string {
    if (value === null) {
        return '—';
    }

    return `${value.toFixed(1).replace('.', ',')} %`;
}

type DeltaProps = {
    current: number;
    previous: number;
    format: (n: number) => string;
    higherIsBetter?: boolean;
};

function Delta({ current, previous, format, higherIsBetter = true }: DeltaProps) {
    if (previous === 0 && current === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    const diff = current - previous;
    const isUp = diff > 0;
    const isFlat = diff === 0;
    const good = isFlat ? null : isUp ? higherIsBetter : !higherIsBetter;
    const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
    const className = good === null
        ? 'text-muted-foreground'
        : good
            ? 'text-emerald-600 dark:text-emerald-500'
            : 'text-rose-600 dark:text-rose-500';

    return (
        <div className={cn('mt-1 flex items-center gap-1 text-xs', className)}>
            <Icon className="h-3 w-3" />
            <span>
                {isUp ? '+' : ''}
                {format(diff)} vs mois précédent
            </span>
        </div>
    );
}

function PercentDelta({ current, previous }: { current: number | null; previous: number | null }) {
    if (current === null || previous === null) {
        return <span className="mt-1 block text-xs text-muted-foreground">—</span>;
    }

    const diff = +(current - previous).toFixed(1);
    const isUp = diff > 0;
    const isFlat = diff === 0;
    const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
    const className = isFlat
        ? 'text-muted-foreground'
        : isUp
            ? 'text-emerald-600 dark:text-emerald-500'
            : 'text-rose-600 dark:text-rose-500';

    return (
        <div className={cn('mt-1 flex items-center gap-1 text-xs', className)}>
            <Icon className="h-3 w-3" />
            <span>
                {isUp ? '+' : ''}
                {diff.toFixed(1).replace('.', ',')} pts vs mois précédent
            </span>
        </div>
    );
}

type AlertCardProps = {
    title: string;
    icon: typeof AlertTriangle;
    count: number;
    emptyMessage: string;
    children: React.ReactNode;
};

function AlertCard({ title, icon: Icon, count, emptyMessage, children }: AlertCardProps) {
    const hasAlerts = count > 0;

    return (
        <Card className={cn(hasAlerts ? 'border-amber-300 dark:border-amber-700' : 'opacity-70')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <div className="flex items-center gap-1.5">
                    <Icon className={cn('h-4 w-4', hasAlerts ? 'text-amber-600' : 'text-muted-foreground')} />
                    <span className={cn('text-sm font-semibold', hasAlerts ? 'text-amber-600' : 'text-muted-foreground')}>
                        {count}
                    </span>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {hasAlerts ? children : <p className="text-xs text-muted-foreground">{emptyMessage}</p>}
            </CardContent>
        </Card>
    );
}

function formatCount(count: number, items: unknown[]): string | null {
    if (count > items.length) {
        return `et ${count - items.length} de plus…`;
    }

    return null;
}

function totalAlertCount(alerts: Alerts): number {
    return alerts.unpaid.count + alerts.under_enrolled.count + alerts.idle_teachers.count + alerts.low_attendance.count;
}

export default function Dashboard({ month, previous, outstanding, alerts, activity, totals }: Props) {
    const [activeTab, setActiveTab] = useState<Tab>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored === 'finances' || stored === 'alertes' || stored === 'activite') return stored;
        } catch {}
        return 'finances';
    });

    const profitPositive = month.profit >= 0;
    const allTimeBalance = totals.all_time_revenue - totals.all_time_salaries - totals.all_time_expenses;
    const alertCount = totalAlertCount(alerts);

    function switchTab(tab: Tab) {
        setActiveTab(tab);
        try { localStorage.setItem(STORAGE_KEY, tab); } catch {}
    }

    return (
        <>
            <Head title="Tableau de bord" />
            <div className="flex flex-col gap-6">
                <h1 className="text-2xl font-semibold">Tableau de bord</h1>

                {/* Summary strip */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border bg-card px-4 py-3">
                        <p className="text-xs text-muted-foreground">Élèves actifs</p>
                        <p className="mt-0.5 text-xl font-bold">{activity.active_students}</p>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-3">
                        <p className="text-xs text-muted-foreground">Bénéfice ce mois</p>
                        <p className={cn('mt-0.5 text-xl font-bold', profitPositive ? 'text-emerald-600' : 'text-rose-600')}>
                            {formatCurrency(month.profit)}
                        </p>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-3">
                        <p className="text-xs text-muted-foreground">Taux de recouvrement</p>
                        <p className="mt-0.5 text-xl font-bold">{formatPct(month.recovery_rate)}</p>
                    </div>
                    <div className="rounded-lg border bg-card px-4 py-3">
                        <p className="text-xs text-muted-foreground">Impayés en cours</p>
                        <p className="mt-0.5 text-xl font-bold text-amber-600">{formatCurrency(outstanding)}</p>
                    </div>
                </div>

                {/* Tab bar */}
                <div className="border-b">
                    <nav className="-mb-px flex gap-0">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => switchTab(tab.id)}
                                className={cn(
                                    'relative flex items-center gap-2 border-b-2 px-5 py-2.5 text-sm font-medium transition-colors',
                                    activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground',
                                )}
                            >
                                {tab.label}
                                {tab.id === 'alertes' && alertCount > 0 && (
                                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-white">
                                        {alertCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Tab: Finances */}
                {activeTab === 'finances' && (
                    <div className="flex flex-col gap-6">
                        <section>
                            <div className="mb-3 flex items-baseline justify-between">
                                <h2 className="text-lg font-semibold">Ce mois-ci</h2>
                                <span className="text-sm text-muted-foreground capitalize">{month.label}</span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Revenu encaissé</CardTitle>
                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatCurrency(month.revenue)}</div>
                                        <Delta current={month.revenue} previous={previous.revenue} format={formatCurrency} />
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Salaires payés</CardTitle>
                                        <Banknote className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-orange-600">{formatCurrency(month.salaries)}</div>
                                        <p className="mt-1 text-xs text-muted-foreground">Ce mois-ci</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Dépenses</CardTitle>
                                        <Receipt className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-rose-600">{formatCurrency(month.expenses)}</div>
                                        <p className="mt-1 text-xs text-muted-foreground">Ce mois-ci</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Bénéfice</CardTitle>
                                        <PiggyBank className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className={cn('text-2xl font-bold', profitPositive ? 'text-emerald-600' : 'text-rose-600')}>
                                            {formatCurrency(month.profit)}
                                        </div>
                                        <Delta current={month.profit} previous={previous.profit} format={formatCurrency} />
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        <section>
                            <h2 className="mb-3 text-lg font-semibold">Recouvrement</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Taux de recouvrement</CardTitle>
                                        <Percent className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatPct(month.recovery_rate)}</div>
                                        <PercentDelta current={month.recovery_rate} previous={previous.recovery_rate} />
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {formatCurrency(month.collected_for_period)} / {formatCurrency(month.billable)} facturable
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Impayés en cours</CardTitle>
                                        <AlertCircle className="h-4 w-4 text-amber-600" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-amber-600">{formatCurrency(outstanding)}</div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Cumul de tous les mois non payés
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        <section>
                            <h2 className="mb-3 text-lg font-semibold">Cumul depuis le début</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Élèves</CardTitle>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{totals.students}</div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Professeurs</CardTitle>
                                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{totals.teachers}</div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Paiements totaux</CardTitle>
                                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold text-emerald-600">{formatCurrency(totals.all_time_revenue)}</div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Salaires totaux</CardTitle>
                                        <Banknote className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold text-orange-600">{formatCurrency(totals.all_time_salaries)}</div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Dépenses totales</CardTitle>
                                        <Receipt className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold text-rose-600">{formatCurrency(totals.all_time_expenses)}</div>
                                    </CardContent>
                                </Card>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Solde cumulé : {formatCurrency(allTimeBalance)}
                            </p>
                        </section>
                    </div>
                )}

                {/* Tab: Alertes */}
                {activeTab === 'alertes' && (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <AlertCard
                            title="Élèves avec ≥ 2 mois impayés"
                            icon={AlertTriangle}
                            count={alerts.unpaid.count}
                            emptyMessage="Tous les élèves sont à jour."
                        >
                            <ul className="space-y-1.5 text-sm">
                                {alerts.unpaid.items.map((item) => (
                                    <li key={item.student_id}>
                                        <Link
                                            href={editStudent(item.student_id).url}
                                            className="flex items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-muted"
                                        >
                                            <span className="truncate">{item.student_name}</span>
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {item.unpaid_count} mois · {formatCurrency(item.total_due)}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            {formatCount(alerts.unpaid.count, alerts.unpaid.items) && (
                                <p className="mt-2 text-xs text-muted-foreground">{formatCount(alerts.unpaid.count, alerts.unpaid.items)}</p>
                            )}
                        </AlertCard>

                        <AlertCard
                            title="Groupes peu remplis (< 3)"
                            icon={UsersRound}
                            count={alerts.under_enrolled.count}
                            emptyMessage="Tous les groupes ont au moins 3 inscrits."
                        >
                            <ul className="space-y-1.5 text-sm">
                                {alerts.under_enrolled.items.map((item) => (
                                    <li key={item.group_id}>
                                        <Link
                                            href={groupsIndex().url}
                                            className="flex items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-muted"
                                        >
                                            <span className="truncate">
                                                {item.group_name}
                                                {item.subject_name && (
                                                    <span className="text-xs text-muted-foreground"> · {item.subject_name}</span>
                                                )}
                                            </span>
                                            <span className="shrink-0 text-xs text-muted-foreground">{item.active_count} inscrit{item.active_count !== 1 ? 's' : ''}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            {formatCount(alerts.under_enrolled.count, alerts.under_enrolled.items) && (
                                <p className="mt-2 text-xs text-muted-foreground">{formatCount(alerts.under_enrolled.count, alerts.under_enrolled.items)}</p>
                            )}
                        </AlertCard>

                        <AlertCard
                            title="Professeurs sans créneau"
                            icon={CalendarX}
                            count={alerts.idle_teachers.count}
                            emptyMessage="Tous les professeurs ont au moins un créneau."
                        >
                            <ul className="space-y-1.5 text-sm">
                                {alerts.idle_teachers.items.map((item) => (
                                    <li key={item.teacher_id}>
                                        <Link
                                            href={editTeacher(item.teacher_id).url}
                                            className="block rounded px-1 py-0.5 hover:bg-muted"
                                        >
                                            <span className="truncate">{item.full_name}</span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            {formatCount(alerts.idle_teachers.count, alerts.idle_teachers.items) && (
                                <p className="mt-2 text-xs text-muted-foreground">{formatCount(alerts.idle_teachers.count, alerts.idle_teachers.items)}</p>
                            )}
                        </AlertCard>

                        <AlertCard
                            title="Présence < 50 % (30 j)"
                            icon={UserX}
                            count={alerts.low_attendance.count}
                            emptyMessage="Aucun élève sous le seuil de présence."
                        >
                            <ul className="space-y-1.5 text-sm">
                                {alerts.low_attendance.items.map((item) => (
                                    <li key={item.student_id}>
                                        <Link
                                            href={editStudent(item.student_id).url}
                                            className="flex items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-muted"
                                        >
                                            <span className="truncate">{item.student_name}</span>
                                            <span className="shrink-0 text-xs text-muted-foreground">
                                                {item.rate.toFixed(0)} % · {item.total_sessions} séances
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            {formatCount(alerts.low_attendance.count, alerts.low_attendance.items) && (
                                <p className="mt-2 text-xs text-muted-foreground">{formatCount(alerts.low_attendance.count, alerts.low_attendance.items)}</p>
                            )}
                        </AlertCard>
                    </div>
                )}

                {/* Tab: Activité */}
                {activeTab === 'activite' && (
                    <div className="flex flex-col gap-6">
                        <section>
                            <h2 className="mb-3 text-lg font-semibold">Ce mois-ci</h2>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Élèves actifs</CardTitle>
                                        <ActivityIcon className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{activity.active_students}</div>
                                        <p className="mt-1 text-xs text-muted-foreground">Inscriptions actives uniques</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Séances ce mois</CardTitle>
                                        <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{activity.sessions_this_month}</div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            dont {activity.teacher_absent_count} sans le professeur
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Présence moyenne</CardTitle>
                                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatPct(activity.attendance_rate)}</div>
                                        <p className="mt-1 text-xs text-muted-foreground">Sur les séances de ce mois</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Occupation des salles</CardTitle>
                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{formatPct(activity.classroom_utilization)}</div>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            {activity.teaching_hours_per_week.toFixed(1).replace('.', ',')} h / sem · base 13 h × 6 j
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </section>

                        {activity.top_teachers.length > 0 && (
                            <section>
                                <h2 className="mb-3 text-lg font-semibold">Heures par professeur</h2>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                                        <CardTitle className="text-sm font-medium">Volume hebdomadaire</CardTitle>
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <ul className="space-y-2">
                                            {activity.top_teachers.map((t) => {
                                                const max = activity.top_teachers[0]?.weekly_hours ?? 1;
                                                const pct = max > 0 ? (t.weekly_hours / max) * 100 : 0;

                                                return (
                                                    <li key={t.teacher_id}>
                                                        <Link
                                                            href={editTeacher(t.teacher_id).url}
                                                            className="block rounded px-1 py-1 hover:bg-muted"
                                                        >
                                                            <div className="mb-1 flex items-center justify-between text-sm">
                                                                <span className="truncate">{t.full_name}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {t.weekly_hours.toFixed(1).replace('.', ',')} h
                                                                </span>
                                                            </div>
                                                            <div className="h-1.5 w-full overflow-hidden rounded bg-muted">
                                                                <div
                                                                    className="h-full bg-sky-500"
                                                                    style={{ width: `${pct}%` }}
                                                                />
                                                            </div>
                                                        </Link>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </CardContent>
                                </Card>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Tableau de bord',
            href: dashboard(),
        },
    ],
};
