import { router, useForm } from '@inertiajs/react';
import { FormEvent, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import { store, update, end, destroy } from '@/actions/App/Http/Controllers/EnrollmentController';
import type { Student, Subject, Teacher, Enrollment } from '@/types';
import { Pencil, Plus, Trash2, StopCircle } from 'lucide-react';

type Props = {
    student: Student;
    subjects: Subject[];
    teachers: Teacher[];
};

type EnrollmentFormData = {
    student_id: string;
    teacher_id: string;
    subject_id: string;
    monthly_fee: string;
    start_date: string;
    end_date: string;
};

function todayString() {
    return new Date().toISOString().slice(0, 10);
}

export default function StudentEnrollments({ student, subjects, teachers }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Enrollment | null>(null);

    const createForm = useForm<EnrollmentFormData>({
        student_id: String(student.id),
        teacher_id: '',
        subject_id: '',
        monthly_fee: '',
        start_date: todayString(),
        end_date: '',
    });

    const editForm = useForm<EnrollmentFormData>({
        student_id: String(student.id),
        teacher_id: '',
        subject_id: '',
        monthly_fee: '',
        start_date: '',
        end_date: '',
    });

    const enrollments = student.enrollments ?? [];

    const teachersBySubject = useMemo(() => {
        const map = new Map<number, Teacher[]>();
        subjects.forEach((s) => {
            map.set(
                s.id,
                teachers.filter((t) => t.subjects?.some((ts) => ts.id === s.id)),
            );
        });
        return map;
    }, [subjects, teachers]);

    function handleCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setShowCreate(false);
                createForm.reset();
                createForm.setData({
                    student_id: String(student.id),
                    teacher_id: '',
                    subject_id: '',
                    monthly_fee: '',
                    start_date: todayString(),
                    end_date: '',
                });
            },
        });
    }

    function handleEdit(e: FormEvent) {
        e.preventDefault();
        if (!editing) return;
        editForm.put(update.url(editing.id), {
            preserveScroll: true,
            onSuccess: () => {
                setEditing(null);
                editForm.reset();
            },
        });
    }

    function handleEnd(enrollment: Enrollment) {
        if (!confirm(`Terminer l'inscription ${enrollment.subject?.name} avec ${enrollment.teacher?.full_name} ?`)) return;
        router.post(end.url(enrollment.id), {}, { preserveScroll: true });
    }

    function handleDelete(enrollment: Enrollment) {
        if (!confirm('Supprimer définitivement cette inscription et toutes ses données associées ? Pour conserver l\'historique, utilisez plutôt « Terminer ».')) return;
        router.delete(destroy.url(enrollment.id), { preserveScroll: true });
    }

    function openEdit(enrollment: Enrollment) {
        editForm.setData({
            student_id: String(student.id),
            teacher_id: String(enrollment.teacher_id),
            subject_id: String(enrollment.subject_id),
            monthly_fee: enrollment.monthly_fee,
            start_date: enrollment.start_date,
            end_date: enrollment.end_date ?? '',
        });
        setEditing(enrollment);
    }

    const createTeachers = createForm.data.subject_id
        ? teachersBySubject.get(Number(createForm.data.subject_id)) ?? []
        : teachers;

    const editTeachers = editForm.data.subject_id
        ? teachersBySubject.get(Number(editForm.data.subject_id)) ?? []
        : teachers;

    return (
        <section>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold">Inscriptions</h2>
                    <p className="text-sm text-muted-foreground">Matières suivies par l'élève et tarif mensuel.</p>
                </div>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une inscription
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Matière</TableHead>
                            <TableHead>Professeur</TableHead>
                            <TableHead>Tarif mensuel</TableHead>
                            <TableHead>Début</TableHead>
                            <TableHead>Fin</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="w-32"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {enrollments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    Aucune inscription. Ajoutez-en une pour commencer.
                                </TableCell>
                            </TableRow>
                        ) : (
                            enrollments.map((enrollment) => (
                                <TableRow key={enrollment.id}>
                                    <TableCell className="font-medium">{enrollment.subject?.name ?? '-'}</TableCell>
                                    <TableCell>{enrollment.teacher?.full_name ?? '-'}</TableCell>
                                    <TableCell>{Number(enrollment.monthly_fee).toFixed(2).replace('.', ',')} DH</TableCell>
                                    <TableCell>{enrollment.start_date}</TableCell>
                                    <TableCell>{enrollment.end_date ?? '-'}</TableCell>
                                    <TableCell>
                                        {enrollment.active ? (
                                            <Badge variant="default">Active</Badge>
                                        ) : (
                                            <Badge variant="secondary">Terminée</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(enrollment)} title="Modifier">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            {enrollment.active && (
                                                <Button variant="ghost" size="icon" onClick={() => handleEnd(enrollment)} title="Terminer">
                                                    <StopCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(enrollment)} title="Supprimer">
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

            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Ajouter une inscription</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <EnrollmentFields
                            form={createForm}
                            subjects={subjects}
                            teachers={createTeachers}
                            showEndDate={false}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" type="button">Annuler</Button>
                            </DialogClose>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing && <Spinner />}
                                Créer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Modifier l'inscription</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit}>
                        <EnrollmentFields
                            form={editForm}
                            subjects={subjects}
                            teachers={editTeachers}
                            showEndDate={true}
                        />
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
                </DialogContent>
            </Dialog>
        </section>
    );
}

type FieldsProps = {
    form: ReturnType<typeof useForm<EnrollmentFormData>>;
    subjects: Subject[];
    teachers: Teacher[];
    showEndDate: boolean;
};

function EnrollmentFields({ form, subjects, teachers, showEndDate }: FieldsProps) {
    return (
        <div className="grid gap-4 py-4">
            <div className="grid gap-2">
                <Label>Matière</Label>
                <Select
                    value={form.data.subject_id}
                    onValueChange={(v) => {
                        form.setData('subject_id', v);
                        form.setData('teacher_id', '');
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une matière" />
                    </SelectTrigger>
                    <SelectContent>
                        {subjects.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                                {s.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={form.errors.subject_id} />
            </div>

            <div className="grid gap-2">
                <Label>Professeur</Label>
                <Select value={form.data.teacher_id} onValueChange={(v) => form.setData('teacher_id', v)}>
                    <SelectTrigger>
                        <SelectValue placeholder={form.data.subject_id ? 'Sélectionner un professeur' : 'Choisissez d\'abord une matière'} />
                    </SelectTrigger>
                    <SelectContent>
                        {teachers.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground">Aucun professeur pour cette matière.</div>
                        ) : (
                            teachers.map((t) => (
                                <SelectItem key={t.id} value={String(t.id)}>
                                    {t.full_name}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                <InputError message={form.errors.teacher_id} />
            </div>

            <div className="grid gap-2">
                <Label>Tarif mensuel (DH)</Label>
                <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.data.monthly_fee}
                    onChange={(e) => form.setData('monthly_fee', e.target.value)}
                    placeholder="0.00"
                />
                <InputError message={form.errors.monthly_fee} />
            </div>

            <div className={showEndDate ? 'grid grid-cols-2 gap-4' : ''}>
                <div className="grid gap-2">
                    <Label>Date de début</Label>
                    <Input
                        type="date"
                        value={form.data.start_date}
                        onChange={(e) => form.setData('start_date', e.target.value)}
                    />
                    <InputError message={form.errors.start_date} />
                </div>
                {showEndDate && (
                    <div className="grid gap-2">
                        <Label>Date de fin (optionnel)</Label>
                        <Input
                            type="date"
                            value={form.data.end_date}
                            onChange={(e) => form.setData('end_date', e.target.value)}
                        />
                        <InputError message={form.errors.end_date} />
                    </div>
                )}
            </div>
        </div>
    );
}
