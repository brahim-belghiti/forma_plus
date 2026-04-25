import { Head, useForm, router, Link } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import { index, show, store, destroy } from '@/actions/App/Http/Controllers/ClassSessionController';
import type { ClassSession, Group, PaginatedData } from '@/types';
import { Plus, Trash2, ClipboardList } from 'lucide-react';

type Props = {
    sessions: PaginatedData<ClassSession>;
    groups: { data: Group[] };
    filters: { group_id?: string; from?: string; to?: string };
};

type SessionFormData = {
    group_id: string;
    date: string;
    teacher_present: boolean;
    notes: string;
};

function todayString() {
    return new Date().toISOString().slice(0, 10);
}

export default function SessionsIndex({ sessions, groups, filters }: Props) {
    const [showCreate, setShowCreate] = useState(false);

    const createForm = useForm<SessionFormData>({
        group_id: '',
        date: todayString(),
        teacher_present: true,
        notes: '',
    });

    function handleCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(store.url(), {
            onSuccess: () => {
                setShowCreate(false);
                createForm.reset();
                createForm.setData({
                    group_id: '',
                    date: todayString(),
                    teacher_present: true,
                    notes: '',
                });
            },
        });
    }

    function handleDelete(session: ClassSession) {
        if (!confirm('Voulez-vous vraiment supprimer cette séance et ses présences ?')) return;
        router.delete(destroy.url(session.id));
    }

    function handleGroupFilter(value: string) {
        const group_id = value === 'all' ? undefined : value;
        router.get(index.url(), { ...filters, group_id }, { preserveState: true, replace: true });
    }

    function handleDateFilter(key: 'from' | 'to', value: string) {
        router.get(index.url(), { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Séances" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Séances</h1>
                <Button onClick={() => setShowCreate(true)} disabled={groups.data.length === 0}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une séance
                </Button>
            </div>

            {groups.data.length === 0 && (
                <p className="mb-4 text-sm text-muted-foreground">
                    Ajoutez d'abord un groupe actif avant de créer des séances.
                </p>
            )}

            <div className="flex items-center gap-4 mb-4">
                <Select value={filters.group_id ?? 'all'} onValueChange={handleGroupFilter}>
                    <SelectTrigger className="w-64">
                        <SelectValue placeholder="Tous les groupes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les groupes</SelectItem>
                        {groups.data.map((g) => (
                            <SelectItem key={g.id} value={String(g.id)}>
                                {g.name} · {g.subject?.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">Du</Label>
                    <Input
                        type="date"
                        defaultValue={filters.from ?? ''}
                        onChange={(e) => handleDateFilter('from', e.target.value)}
                        className="w-40"
                    />
                    <Label className="text-sm text-muted-foreground">Au</Label>
                    <Input
                        type="date"
                        defaultValue={filters.to ?? ''}
                        onChange={(e) => handleDateFilter('to', e.target.value)}
                        className="w-40"
                    />
                </div>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Groupe</TableHead>
                            <TableHead>Matière</TableHead>
                            <TableHead>Professeur</TableHead>
                            <TableHead className="text-center">Prof présent</TableHead>
                            <TableHead className="text-center">Présences</TableHead>
                            <TableHead className="w-32"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sessions.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                    Aucune séance pour l'instant.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sessions.data.map((session) => (
                                <TableRow key={session.id}>
                                    <TableCell className="font-medium">{session.date}</TableCell>
                                    <TableCell>{session.group?.name}</TableCell>
                                    <TableCell>{session.group?.subject?.name}</TableCell>
                                    <TableCell>{session.group?.teacher?.full_name}</TableCell>
                                    <TableCell className="text-center">
                                        {session.teacher_present ? (
                                            <Badge variant="default">Oui</Badge>
                                        ) : (
                                            <Badge variant="destructive">Absent</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center text-sm">
                                        {session.present_count ?? 0}
                                        {typeof session.attendances_count === 'number' && ` / ${session.attendances_count}`}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Button variant="ghost" size="icon" asChild title="Feuille de présences">
                                                <Link href={show.url(session.id)}>
                                                    <ClipboardList className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(session)}>
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

            {sessions.meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                        Affichage de {sessions.meta.from} à {sessions.meta.to} sur {sessions.meta.total} séances
                    </p>
                    <div className="flex gap-1">
                        {sessions.meta.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ))}
                    </div>
                </div>
            )}

            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter une séance</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Groupe</Label>
                                <Select value={createForm.data.group_id} onValueChange={(v) => createForm.setData('group_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un groupe" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups.data.map((g) => (
                                            <SelectItem key={g.id} value={String(g.id)}>
                                                {g.name} · {g.subject?.name} · {g.teacher?.full_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={createForm.errors.group_id} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={createForm.data.date}
                                    onChange={(e) => createForm.setData('date', e.target.value)}
                                />
                                <InputError message={createForm.errors.date} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Professeur présent</Label>
                                <Select
                                    value={createForm.data.teacher_present ? '1' : '0'}
                                    onValueChange={(v) => createForm.setData('teacher_present', v === '1')}
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
                                    value={createForm.data.notes}
                                    onChange={(e) => createForm.setData('notes', e.target.value)}
                                    placeholder="Facultatif"
                                />
                                <InputError message={createForm.errors.notes} />
                            </div>
                        </div>
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
        </>
    );
}

SessionsIndex.layout = {
    breadcrumbs: [
        { title: 'Séances', href: index.url() },
    ],
};
