import { Head, useForm, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { index, store, update, destroy } from '@/actions/App/Http/Controllers/TimeslotController';
import type { Timeslot, Group, Classroom } from '@/types';
import { Pencil, Trash2, Plus } from 'lucide-react';

const DAYS_OF_WEEK = [
    { value: 1, label: 'Lundi' },
    { value: 2, label: 'Mardi' },
    { value: 3, label: 'Mercredi' },
    { value: 4, label: 'Jeudi' },
    { value: 5, label: 'Vendredi' },
    { value: 6, label: 'Samedi' },
    { value: 0, label: 'Dimanche' },
];

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

export default function TimeslotsIndex({ timeslots, groups, classrooms }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingTimeslot, setEditingTimeslot] = useState<Timeslot | null>(null);

    const createForm = useForm<TimeslotFormData>({ ...emptyForm });
    const editForm = useForm<TimeslotFormData>({ ...emptyForm });

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
        if (!editingTimeslot) return;
        editForm.put(update.url(editingTimeslot.id), {
            onSuccess: () => {
                setEditingTimeslot(null);
                editForm.reset();
            },
        });
    }

    function handleDelete(timeslot: Timeslot) {
        if (!confirm('Voulez-vous vraiment supprimer ce créneau ?')) return;
        router.delete(destroy.url(timeslot.id));
    }

    function openEdit(timeslot: Timeslot) {
        editForm.setData({
            group_id: String(timeslot.group_id),
            classroom_id: String(timeslot.classroom_id),
            day_of_week: String(timeslot.day_of_week),
            start_time: timeslot.start_time.slice(0, 5),
            end_time: timeslot.end_time.slice(0, 5),
        });
        setEditingTimeslot(timeslot);
    }

    const groupedByDay = DAYS_OF_WEEK.map((day) => ({
        ...day,
        timeslots: timeslots.data.filter((t) => t.day_of_week === day.value),
    })).filter((day) => day.timeslots.length > 0);

    const canCreate = groups.data.length > 0 && classrooms.data.length > 0;

    return (
        <>
            <Head title="Emploi du temps" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Emploi du temps</h1>
                <Button onClick={() => setShowCreate(true)} disabled={!canCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un créneau
                </Button>
            </div>

            {!canCreate && (
                <p className="mb-4 text-sm text-muted-foreground">
                    Ajoutez d'abord un groupe et une salle avant de créer un créneau.
                </p>
            )}

            {timeslots.data.length === 0 ? (
                <div className="rounded-lg border p-8 text-center text-muted-foreground">
                    Aucun créneau pour l'instant. Ajoutez votre premier créneau pour construire l'emploi du temps.
                </div>
            ) : (
                <div className="space-y-6">
                    {groupedByDay.map((day) => (
                        <div key={day.value} className="rounded-lg border">
                            <div className="bg-muted/50 px-4 py-2 font-semibold border-b">
                                {day.label}
                            </div>
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
                                        <TableRow key={timeslot.id}>
                                            <TableCell className="font-medium">
                                                {timeslot.start_time.slice(0, 5)} - {timeslot.end_time.slice(0, 5)}
                                            </TableCell>
                                            <TableCell>{timeslot.group?.name}</TableCell>
                                            <TableCell>{timeslot.group?.subject?.name}</TableCell>
                                            <TableCell>{timeslot.group?.subject?.level?.name ?? '—'}</TableCell>
                                            <TableCell>{timeslot.group?.teacher?.full_name}</TableCell>
                                            <TableCell>{timeslot.classroom?.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 justify-end">
                                                    <Button variant="ghost" size="icon" onClick={() => openEdit(timeslot)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(timeslot)}>
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
};

function TimeslotForm({ form, onSubmit, groups, classrooms, submitLabel }: TimeslotFormProps) {
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

TimeslotsIndex.layout = {
    breadcrumbs: [
        { title: 'Emploi du temps', href: index.url() },
    ],
};
