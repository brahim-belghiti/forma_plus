import { Head, useForm, router } from '@inertiajs/react';
import { FormEvent, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { index, update, upsertAttendance } from '@/actions/App/Http/Controllers/ClassSessionController';
import type { ClassSession, Student } from '@/types';

type Props = {
    session: { data: ClassSession };
    roster: { data: Student[] };
};

type RosterRow = {
    student_id: number;
    student: Student;
    present: boolean;
    notes: string;
};

export default function SessionShow({ session, roster }: Props) {
    const s = session.data;

    const sessionForm = useForm({
        teacher_present: s.teacher_present,
        notes: s.notes ?? '',
    });

    const initialRows = useMemo<RosterRow[]>(() => {
        const attendanceByStudent = new Map<number, { present: boolean; notes: string }>();
        s.attendances?.forEach((a) => {
            attendanceByStudent.set(a.student_id, { present: a.present, notes: a.notes ?? '' });
        });
        return roster.data.map((student) => {
            const prev = attendanceByStudent.get(student.id);
            return {
                student_id: student.id,
                student,
                present: prev?.present ?? true,
                notes: prev?.notes ?? '',
            };
        });
    }, [s.attendances, roster.data]);

    const attendanceForm = useForm<{ attendances: RosterRow[] }>({ attendances: initialRows });

    function toggle(studentId: number, present: boolean) {
        attendanceForm.setData(
            'attendances',
            attendanceForm.data.attendances.map((r) =>
                r.student_id === studentId ? { ...r, present } : r,
            ),
        );
    }

    function setNotes(studentId: number, notes: string) {
        attendanceForm.setData(
            'attendances',
            attendanceForm.data.attendances.map((r) =>
                r.student_id === studentId ? { ...r, notes } : r,
            ),
        );
    }

    function markAll(present: boolean) {
        attendanceForm.setData(
            'attendances',
            attendanceForm.data.attendances.map((r) => ({ ...r, present })),
        );
    }

    function handleSessionSubmit(e: FormEvent) {
        e.preventDefault();
        sessionForm.put(update.url(s.id), { preserveScroll: true });
    }

    function handleAttendanceSubmit(e: FormEvent) {
        e.preventDefault();
        attendanceForm.put(upsertAttendance.url(s.id), {
            preserveScroll: true,
            data: {
                attendances: attendanceForm.data.attendances.map((r) => ({
                    student_id: r.student_id,
                    present: r.present,
                    notes: r.notes || null,
                })),
            },
        });
    }

    const presentCount = attendanceForm.data.attendances.filter((r) => r.present).length;

    return (
        <>
            <Head title={`Séance — ${s.date}`} />
            <div className="mb-6">
                <Button variant="ghost" size="sm" onClick={() => router.visit(index.url())} className="mb-2">
                    ← Retour aux séances
                </Button>
                <h1 className="text-2xl font-semibold">
                    {s.group?.name} · {s.date}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {s.group?.subject?.name} · {s.group?.teacher?.full_name}
                </p>
            </div>

            <section className="mb-8 max-w-2xl">
                <h2 className="text-lg font-semibold mb-3">Séance</h2>
                <form onSubmit={handleSessionSubmit} className="space-y-4 rounded-lg border p-4">
                    <div className="grid gap-2">
                        <Label>Professeur présent</Label>
                        <Select
                            value={sessionForm.data.teacher_present ? '1' : '0'}
                            onValueChange={(v) => sessionForm.setData('teacher_present', v === '1')}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Oui</SelectItem>
                                <SelectItem value="0">Non (absent)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label>Remarques</Label>
                        <Input
                            value={sessionForm.data.notes}
                            onChange={(e) => sessionForm.setData('notes', e.target.value)}
                            placeholder="Facultatif"
                        />
                    </div>
                    <Button type="submit" disabled={sessionForm.processing}>
                        {sessionForm.processing && <Spinner />}
                        Enregistrer
                    </Button>
                </form>
            </section>

            <Separator className="my-8" />

            <section>
                <div className="flex items-end justify-between mb-3">
                    <div>
                        <h2 className="text-lg font-semibold">Feuille de présences</h2>
                        <p className="text-sm text-muted-foreground">
                            {presentCount} présent{presentCount > 1 ? 's' : ''} sur {attendanceForm.data.attendances.length}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => markAll(true)}>
                            Tous présents
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => markAll(false)}>
                            Tous absents
                        </Button>
                    </div>
                </div>

                <form onSubmit={handleAttendanceSubmit}>
                    <div className="rounded-lg border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-16 text-center">Présent</TableHead>
                                    <TableHead>Élève</TableHead>
                                    <TableHead>Remarques</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendanceForm.data.attendances.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                            Aucun élève inscrit à ce groupe à cette date.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    attendanceForm.data.attendances.map((row) => (
                                        <TableRow key={row.student_id}>
                                            <TableCell className="text-center">
                                                <Checkbox
                                                    checked={row.present}
                                                    onCheckedChange={(checked) => toggle(row.student_id, !!checked)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">{row.student.full_name}</TableCell>
                                            <TableCell>
                                                <Input
                                                    value={row.notes}
                                                    onChange={(e) => setNotes(row.student_id, e.target.value)}
                                                    placeholder="Facultatif"
                                                    className="max-w-sm"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {attendanceForm.data.attendances.length > 0 && (
                        <div className="mt-4 flex justify-end">
                            <Button type="submit" disabled={attendanceForm.processing}>
                                {attendanceForm.processing && <Spinner />}
                                Enregistrer les présences
                            </Button>
                        </div>
                    )}
                </form>
            </section>
        </>
    );
}

SessionShow.layout = {
    breadcrumbs: [
        { title: 'Séances', href: index.url() },
        { title: 'Feuille de présences', href: '#' },
    ],
};
