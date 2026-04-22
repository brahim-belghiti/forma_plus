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
import type { Timeslot, Teacher, Subject, Level, Classroom } from '@/types';
import { Pencil, Trash2, Plus } from 'lucide-react';

const DAYS_OF_WEEK = [
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
    { value: 0, label: 'Sunday' },
];

type Props = {
    timeslots: { data: Timeslot[] };
    teachers: { data: Teacher[] };
    subjects: { data: Subject[] };
    levels: { data: Level[] };
    classrooms: { data: Classroom[] };
};

type TimeslotFormData = {
    teacher_id: string;
    subject_id: string;
    level_id: string;
    classroom_id: string;
    day_of_week: string;
    start_time: string;
    end_time: string;
};

const emptyForm: TimeslotFormData = {
    teacher_id: '',
    subject_id: '',
    level_id: '',
    classroom_id: '',
    day_of_week: '',
    start_time: '',
    end_time: '',
};

export default function TimeslotsIndex({ timeslots, teachers, subjects, levels, classrooms }: Props) {
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
        if (!confirm('Are you sure you want to delete this timeslot?')) return;
        router.delete(destroy.url(timeslot.id));
    }

    function openEdit(timeslot: Timeslot) {
        editForm.setData({
            teacher_id: String(timeslot.teacher_id),
            subject_id: String(timeslot.subject_id),
            level_id: String(timeslot.level_id),
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

    return (
        <>
            <Head title="Schedule" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Schedule</h1>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Timeslot
                </Button>
            </div>

            {timeslots.data.length === 0 ? (
                <div className="rounded-lg border p-8 text-center text-muted-foreground">
                    No timeslots yet. Add your first timeslot to build your schedule.
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
                                        <TableHead>Time</TableHead>
                                        <TableHead>Teacher</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Level</TableHead>
                                        <TableHead>Classroom</TableHead>
                                        <TableHead className="w-24"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {day.timeslots.map((timeslot) => (
                                        <TableRow key={timeslot.id}>
                                            <TableCell className="font-medium">
                                                {timeslot.start_time.slice(0, 5)} - {timeslot.end_time.slice(0, 5)}
                                            </TableCell>
                                            <TableCell>{timeslot.teacher?.full_name}</TableCell>
                                            <TableCell>{timeslot.subject?.name}</TableCell>
                                            <TableCell>{timeslot.level?.name}</TableCell>
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
                        <DialogTitle>Add Timeslot</DialogTitle>
                    </DialogHeader>
                    <TimeslotForm
                        form={createForm}
                        onSubmit={handleCreate}
                        teachers={teachers.data}
                        subjects={subjects.data}
                        levels={levels.data}
                        classrooms={classrooms.data}
                        submitLabel="Create"
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingTimeslot} onOpenChange={(open) => !open && setEditingTimeslot(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Edit Timeslot</DialogTitle>
                    </DialogHeader>
                    <TimeslotForm
                        form={editForm}
                        onSubmit={handleEdit}
                        teachers={teachers.data}
                        subjects={subjects.data}
                        levels={levels.data}
                        classrooms={classrooms.data}
                        submitLabel="Save"
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

type TimeslotFormProps = {
    form: ReturnType<typeof useForm<TimeslotFormData>>;
    onSubmit: (e: FormEvent) => void;
    teachers: Teacher[];
    subjects: Subject[];
    levels: Level[];
    classrooms: Classroom[];
    submitLabel: string;
};

function TimeslotForm({ form, onSubmit, teachers, subjects, levels, classrooms, submitLabel }: TimeslotFormProps) {
    return (
        <form onSubmit={onSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label>Day</Label>
                    <Select value={form.data.day_of_week} onValueChange={(v) => form.setData('day_of_week', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select day" />
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
                        <Label>Start Time</Label>
                        <Input
                            type="time"
                            value={form.data.start_time}
                            onChange={(e) => form.setData('start_time', e.target.value)}
                        />
                        <InputError message={form.errors.start_time} />
                    </div>
                    <div className="grid gap-2">
                        <Label>End Time</Label>
                        <Input
                            type="time"
                            value={form.data.end_time}
                            onChange={(e) => form.setData('end_time', e.target.value)}
                        />
                        <InputError message={form.errors.end_time} />
                    </div>
                </div>

                <div className="grid gap-2">
                    <Label>Teacher</Label>
                    <Select value={form.data.teacher_id} onValueChange={(v) => form.setData('teacher_id', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                        <SelectContent>
                            {teachers.map((teacher) => (
                                <SelectItem key={teacher.id} value={String(teacher.id)}>
                                    {teacher.full_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.teacher_id} />
                </div>

                <div className="grid gap-2">
                    <Label>Subject</Label>
                    <Select value={form.data.subject_id} onValueChange={(v) => form.setData('subject_id', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={String(subject.id)}>
                                    {subject.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.subject_id} />
                </div>

                <div className="grid gap-2">
                    <Label>Level</Label>
                    <Select value={form.data.level_id} onValueChange={(v) => form.setData('level_id', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                            {levels.map((level) => (
                                <SelectItem key={level.id} value={String(level.id)}>
                                    {level.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <InputError message={form.errors.level_id} />
                </div>

                <div className="grid gap-2">
                    <Label>Classroom</Label>
                    <Select value={form.data.classroom_id} onValueChange={(v) => form.setData('classroom_id', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select classroom" />
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
                    <Button variant="outline" type="button">Cancel</Button>
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
        { title: 'Schedule', href: index.url() },
    ],
};
