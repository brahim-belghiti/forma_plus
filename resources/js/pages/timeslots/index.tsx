import { Head, useForm, router } from '@inertiajs/react';
import { Pencil, Trash2, Plus, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FormEvent} from 'react';
import { useMemo, useState } from 'react';
import { index, store, update, destroy } from '@/actions/App/Http/Controllers/TimeslotController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { Timeslot, Group, Classroom } from '@/types';
import { ScheduleGrid, detectConflicts, computeHourRange } from './partials/schedule-grid';
import type { ScheduleColumn } from './partials/schedule-grid';

type DayMeta = { value: number; label: string; short: string };

const DAYS_OF_WEEK: DayMeta[] = [
    { value: 1, label: 'Lundi', short: 'Lun' },
    { value: 2, label: 'Mardi', short: 'Mar' },
    { value: 3, label: 'Mercredi', short: 'Mer' },
    { value: 4, label: 'Jeudi', short: 'Jeu' },
    { value: 5, label: 'Vendredi', short: 'Ven' },
    { value: 6, label: 'Samedi', short: 'Sam' },
    { value: 0, label: 'Dimanche', short: 'Dim' },
];

const WEEK_DAYS = DAYS_OF_WEEK.slice(0, 6);
const VIEW_STORAGE_KEY = 'timeslots:view';

type ViewMode = 'week' | 'day' | 'list';

type Props = {
    timeslots: { data: Timeslot[] };
    groups: { data: Group[] };
    classrooms: { data: Classroom[] };
};

type TimeslotFormData = {
    group_id: string;
    classroom_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
};

const emptyForm: TimeslotFormData = {
    group_id: '',
    classroom_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
};

function addOneHour(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const total = Math.min(h * 60 + m + 60, 23 * 60 + 30);
    const nh = Math.floor(total / 60);
    const nm = total % 60;

    return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

export default function TimeslotsIndex({ timeslots, groups, classrooms }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingTimeslot, setEditingTimeslot] = useState<Timeslot | null>(null);
    const [view, setView] = useState<ViewMode>(() => {
        if (typeof window === 'undefined') {
            return 'week';
        }

        const saved = window.localStorage.getItem(VIEW_STORAGE_KEY);

        return saved === 'day' || saved === 'list' || saved === 'week' ? saved : 'week';
    });
    const [activeDay, setActiveDay] = useState<number>(() => {
        const today = new Date().getDay();

        return WEEK_DAYS.some((d) => d.value === today) ? today : 1;
    });
    const [salleFilter, setSalleFilter] = useState<string>('all');

    const createForm = useForm<TimeslotFormData>({ ...emptyForm });
    const editForm = useForm<TimeslotFormData>({ ...emptyForm });

    function changeView(next: ViewMode) {
        setView(next);
        localStorage.setItem(VIEW_STORAGE_KEY, next);
    }

    function handleCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(store.url(), {
            onSuccess: () => {
                setShowCreate(false);
                createForm.reset();
            },
        });
    }

    function handleEdit(e: FormEvent) {
        e.preventDefault();

        if (!editingTimeslot) {
            return;
        }

        editForm.put(update.url(editingTimeslot.id), {
            onSuccess: () => {
                setEditingTimeslot(null);
                editForm.reset();
            },
        });
    }

    function handleDelete(timeslot: Timeslot) {
        if (!confirm('Voulez-vous vraiment supprimer ce créneau ?')) {
            return;
        }

        router.delete(destroy.url(timeslot.id));
    }

    function openCreate(prefill?: Partial<TimeslotFormData>) {
        createForm.clearErrors();
        createForm.setData({ ...emptyForm, ...prefill });
        setShowCreate(true);
    }

    function openEdit(timeslot: Timeslot) {
        editForm.clearErrors();
        editForm.setData({
            group_id: String(timeslot.group_id),
            classroom_id: String(timeslot.classroom_id),
            day_of_week: String(timeslot.day_of_week),
            start_time: timeslot.start_time.slice(0, 5),
            end_time: timeslot.end_time.slice(0, 5),
        });
        setEditingTimeslot(timeslot);
    }

    function handleEmptyClick(prefill: Partial<TimeslotFormData>, time: string) {
        if (!canCreate) {
            return;
        }

        openCreate({
            ...prefill,
            start_time: time,
            end_time: addOneHour(time),
        });
    }

    const conflicts = useMemo(() => detectConflicts(timeslots.data), [timeslots.data]);
    const hourRange = useMemo(() => computeHourRange(timeslots.data), [timeslots.data]);
    const conflictCount = conflicts.size;

    const filteredTimeslots = useMemo(() => {
        if (salleFilter === 'all') {
            return timeslots.data;
        }

        const id = Number(salleFilter);

        return timeslots.data.filter((t) => t.classroom_id === id);
    }, [timeslots.data, salleFilter]);

    const groupedByDay = useMemo(
        () =>
            DAYS_OF_WEEK.map((day) => ({
                ...day,
                timeslots: filteredTimeslots.filter((t) => t.day_of_week === day.value),
            })).filter((day) => day.timeslots.length > 0),
        [filteredTimeslots],
    );

    const canCreate = groups.data.length > 0 && classrooms.data.length > 0;

    const weekColumns: ScheduleColumn[] = useMemo(
        () =>
            WEEK_DAYS.map((day) => ({
                key: day.value,
                label: day.label,
                short: day.short,
                timeslots: filteredTimeslots.filter((t) => t.day_of_week === day.value),
                onEmptyClick: (time: string) =>
                    handleEmptyClick(
                        {
                            day_of_week: String(day.value),
                            classroom_id: salleFilter !== 'all' ? salleFilter : '',
                        },
                        time,
                    ),
            })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [filteredTimeslots, salleFilter, canCreate],
    );

    const dayColumns: ScheduleColumn[] = useMemo(
        () =>
            classrooms.data.map((c) => ({
                key: c.id,
                label: c.name,
                short: c.name,
                timeslots: timeslots.data.filter(
                    (t) => t.day_of_week === activeDay && t.classroom_id === c.id,
                ),
                onEmptyClick: (time: string) =>
                    handleEmptyClick(
                        {
                            day_of_week: String(activeDay),
                            classroom_id: String(c.id),
                        },
                        time,
                    ),
            })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [timeslots.data, activeDay, classrooms.data, canCreate],
    );

    function shiftDay(direction: -1 | 1) {
        const idx = WEEK_DAYS.findIndex((d) => d.value === activeDay);
        const nextIdx = (idx + direction + WEEK_DAYS.length) % WEEK_DAYS.length;
        setActiveDay(WEEK_DAYS[nextIdx].value);
    }

    return (
        <>
            <Head title="Emploi du temps" />
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-semibold">Emploi du temps</h1>
                    {conflictCount > 0 && (
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            {conflictCount} créneau{conflictCount > 1 ? 'x' : ''} en conflit (salle ou professeur)
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <ToggleGroup
                        type="single"
                        value={view}
                        onValueChange={(v) => v && changeView(v as ViewMode)}
                        variant="outline"
                        size="sm"
                    >
                        <ToggleGroupItem value="week">Semaine</ToggleGroupItem>
                        <ToggleGroupItem value="day">Jour</ToggleGroupItem>
                        <ToggleGroupItem value="list">Liste</ToggleGroupItem>
                    </ToggleGroup>
                    <Button onClick={() => openCreate()} disabled={!canCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un créneau
                    </Button>
                </div>
            </div>

            {!canCreate && (
                <p className="mb-4 text-sm text-muted-foreground">
                    Ajoutez d'abord un groupe et une salle avant de créer un créneau.
                </p>
            )}

            {view === 'week' && (
                <div className="space-y-3">
                    {classrooms.data.length > 1 && (
                        <div className="flex items-center gap-2">
                            <Label className="text-sm text-muted-foreground">Salle :</Label>
                            <Select value={salleFilter} onValueChange={setSalleFilter}>
                                <SelectTrigger className="max-w-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes les salles</SelectItem>
                                    {classrooms.data.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <ScheduleGrid
                        columns={weekColumns}
                        hourStart={hourRange.start}
                        hourEnd={hourRange.end}
                        conflicts={conflicts}
                        onBlockClick={openEdit}
                    />
                    {canCreate && (
                        <p className="text-xs text-muted-foreground">
                            Astuce : cliquez sur une case vide pour créer un créneau, ou sur un cours pour le modifier.
                            Pour gérer les salles individuellement, utilisez la vue Jour.
                        </p>
                    )}
                </div>
            )}

            {view === 'day' && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <Button variant="outline" size="sm" onClick={() => shiftDay(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Select value={String(activeDay)} onValueChange={(v) => setActiveDay(Number(v))}>
                            <SelectTrigger className="max-w-xs flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {WEEK_DAYS.map((day) => (
                                    <SelectItem key={day.value} value={String(day.value)}>
                                        {day.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => shiftDay(1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                    {classrooms.data.length === 0 ? (
                        <div className="rounded-lg border p-8 text-center text-muted-foreground">
                            Ajoutez au moins une salle pour utiliser la vue par salle.
                        </div>
                    ) : (
                        <ScheduleGrid
                            columns={dayColumns}
                            hourStart={hourRange.start}
                            hourEnd={hourRange.end}
                            conflicts={conflicts}
                            onBlockClick={openEdit}
                            minColumnWidth={120}
                            secondaryLabel={(t) => t.group?.teacher?.full_name ?? ''}
                        />
                    )}
                    {canCreate && classrooms.data.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Chaque colonne représente une salle. Cliquez sur une case vide pour réserver cette salle à l'heure choisie.
                        </p>
                    )}
                </div>
            )}

            {view === 'list' && (
                <>
                    {timeslots.data.length === 0 ? (
                        <div className="rounded-lg border p-8 text-center text-muted-foreground">
                            Aucun créneau pour l'instant. Ajoutez votre premier créneau pour construire l'emploi du temps.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {groupedByDay.map((day) => (
                                <div key={day.value} className="rounded-lg border">
                                    <div className="border-b bg-muted/50 px-4 py-2 font-semibold">{day.label}</div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Horaire</TableHead>
                                                <TableHead>Groupe</TableHead>
                                                <TableHead>Matière</TableHead>
                                                <TableHead>Niveau</TableHead>
                                                <TableHead>Professeur</TableHead>
                                                <TableHead>Salle</TableHead>
                                                <TableHead className="w-24"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {day.timeslots.map((timeslot) => (
                                                <TableRow
                                                    key={timeslot.id}
                                                    className={conflicts.has(timeslot.id) ? 'bg-destructive/5' : ''}
                                                >
                                                    <TableCell className="font-medium">
                                                        <div className="flex items-center gap-1.5">
                                                            {conflicts.has(timeslot.id) && (
                                                                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                                            )}
                                                            {timeslot.start_time.slice(0, 5)} - {timeslot.end_time.slice(0, 5)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{timeslot.group?.name}</TableCell>
                                                    <TableCell>{timeslot.group?.subject?.name}</TableCell>
                                                    <TableCell>{timeslot.group?.subject?.level?.name ?? '—'}</TableCell>
                                                    <TableCell>{timeslot.group?.teacher?.full_name}</TableCell>
                                                    <TableCell>{timeslot.classroom?.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEdit(timeslot)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleDelete(timeslot)}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Ajouter un créneau</DialogTitle>
                    </DialogHeader>
                    <TimeslotForm
                        form={createForm}
                        onSubmit={handleCreate}
                        groups={groups.data}
                        classrooms={classrooms.data}
                        submitLabel="Créer"
                        onDelete={null}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingTimeslot} onOpenChange={(open) => !open && setEditingTimeslot(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Modifier le créneau</DialogTitle>
                    </DialogHeader>
                    <TimeslotForm
                        form={editForm}
                        onSubmit={handleEdit}
                        groups={groups.data}
                        classrooms={classrooms.data}
                        submitLabel="Enregistrer"
                        onDelete={
                            editingTimeslot
                                ? () => {
                                      const t = editingTimeslot;
                                      setEditingTimeslot(null);
                                      handleDelete(t);
                                  }
                                : null
                        }
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

type TimeslotFormProps = {
    form: ReturnType<typeof useForm<TimeslotFormData>>;
    onSubmit: (e: FormEvent) => void;
    groups: Group[];
    classrooms: Classroom[];
    submitLabel: string;
    onDelete: (() => void) | null;
};

function TimeslotForm({ form, onSubmit, groups, classrooms, submitLabel, onDelete }: TimeslotFormProps) {
    return (
        <form onSubmit={onSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Jour</Label>
                    <Select value={form.data.day_of_week} onValueChange={(v) => form.setData('day_of_week', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un jour" />
                        </SelectTrigger>
                        <SelectContent>
                            {DAYS_OF_WEEK.map((day) => (
                                <SelectItem key={day.value} value={String(day.value)}>
                                    {day.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.day_of_week} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label>Heure de début</Label>
                        <Input
                            type="time"
                            value={form.data.start_time}
                            onChange={(e) => form.setData('start_time', e.target.value)}
                        />
                        <InputError message={form.errors.start_time} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Heure de fin</Label>
                        <Input
                            type="time"
                            value={form.data.end_time}
                            onChange={(e) => form.setData('end_time', e.target.value)}
                        />
                        <InputError message={form.errors.end_time} />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label>Groupe</Label>
                    <Select value={form.data.group_id} onValueChange={(v) => form.setData('group_id', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un groupe" />
                        </SelectTrigger>
                        <SelectContent>
                            {groups.map((group) => (
                                <SelectItem key={group.id} value={String(group.id)}>
                                    {group.name}
                                    {group.subject?.name ? ` · ${group.subject.name}` : ''}
                                    {group.teacher?.full_name ? ` · ${group.teacher.full_name}` : ''}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.group_id} />
                </div>

                <div className="grid gap-2">
                    <Label>Salle</Label>
                    <Select value={form.data.classroom_id} onValueChange={(v) => form.setData('classroom_id', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une salle" />
                        </SelectTrigger>
                        <SelectContent>
                            {classrooms.map((classroom) => (
                                <SelectItem key={classroom.id} value={String(classroom.id)}>
                                    {classroom.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.classroom_id} />
                </div>
            </div>
            <DialogFooter className="gap-2 sm:justify-between">
                <div>
                    {onDelete && (
                        <Button variant="ghost" type="button" onClick={onDelete} className="text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    <DialogClose asChild>
                        <Button variant="outline" type="button">
                            Annuler
                        </Button>
                    </DialogClose>
                    <Button type="submit" disabled={form.processing}>
                        {form.processing && <Spinner />}
                        {submitLabel}
                    </Button>
                </div>
            </DialogFooter>
        </form>
    );
}

TimeslotsIndex.layout = {
    breadcrumbs: [{ title: 'Emploi du temps', href: index.url() }],
};
