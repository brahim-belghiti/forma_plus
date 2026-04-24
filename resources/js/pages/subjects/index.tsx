import { Head, useForm, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { index, store, update, destroy } from '@/actions/App/Http/Controllers/SubjectController';
import type { Level, Subject } from '@/types';
import { Pencil, Trash2, Plus } from 'lucide-react';

type Props = {
    subjects: { data: Subject[] };
    levels: { data: Level[] };
};

export default function SubjectsIndex({ subjects, levels }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

    const createForm = useForm({ name: '', level_id: '' });
    const editForm = useForm({ name: '', level_id: '' });

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
        if (!editingSubject) return;
        editForm.put(update.url(editingSubject.id), {
            onSuccess: () => {
                setEditingSubject(null);
                editForm.reset();
            },
        });
    }

    function handleDelete(subject: Subject) {
        if (!confirm(`Voulez-vous vraiment supprimer « ${subject.name} » ?`)) return;
        router.delete(destroy.url(subject.id));
    }

    function openEdit(subject: Subject) {
        editForm.setData('name', subject.name);
        editForm.setData('level_id', String(subject.level_id));
        setEditingSubject(subject);
    }

    return (
        <>
            <Head title="Matières" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Matières</h1>
                <Button onClick={() => setShowCreate(true)} disabled={levels.data.length === 0}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une matière
                </Button>
            </div>

            {levels.data.length === 0 && (
                <p className="mb-4 text-sm text-muted-foreground">
                    Ajoutez d'abord un niveau avant de créer des matières.
                </p>
            )}

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Niveau</TableHead>
                            <TableHead className="w-24"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {subjects.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                    Aucune matière pour l'instant. Ajoutez votre première matière pour commencer.
                                </TableCell>
                            </TableRow>
                        ) : (
                            subjects.data.map((subject) => (
                                <TableRow key={subject.id}>
                                    <TableCell className="font-medium">{subject.name}</TableCell>
                                    <TableCell>{subject.level?.name ?? '—'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(subject)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(subject)}>
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Ajouter une matière</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="create-name">Nom</Label>
                                <Input
                                    id="create-name"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="ex : Mathématiques"
                                    autoFocus
                                />
                                <InputError message={createForm.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Niveau</Label>
                                <Select value={createForm.data.level_id} onValueChange={(v) => createForm.setData('level_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un niveau" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {levels.data.map((level) => (
                                            <SelectItem key={level.id} value={String(level.id)}>
                                                {level.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={createForm.errors.level_id} />
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

            <Dialog open={!!editingSubject} onOpenChange={(open) => !open && setEditingSubject(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier la matière</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nom</Label>
                                <Input
                                    id="edit-name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    autoFocus
                                />
                                <InputError message={editForm.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Niveau</Label>
                                <Select value={editForm.data.level_id} onValueChange={(v) => editForm.setData('level_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un niveau" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {levels.data.map((level) => (
                                            <SelectItem key={level.id} value={String(level.id)}>
                                                {level.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={editForm.errors.level_id} />
                            </div>
                        </div>
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
        </>
    );
}

SubjectsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Matières',
            href: index.url(),
        },
    ],
};
