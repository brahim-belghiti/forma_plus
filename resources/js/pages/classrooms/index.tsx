import { Head, useForm, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { index, store, update, destroy } from '@/actions/App/Http/Controllers/ClassroomController';
import type { Classroom } from '@/types';
import { Pencil, Trash2, Plus } from 'lucide-react';

type Props = {
    classrooms: { data: Classroom[] };
};

export default function ClassroomsIndex({ classrooms }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);

    const createForm = useForm({ name: '' });
    const editForm = useForm({ name: '' });

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
        if (!editingClassroom) return;
        editForm.put(update.url(editingClassroom.id), {
            onSuccess: () => {
                setEditingClassroom(null);
                editForm.reset();
            },
        });
    }

    function handleDelete(classroom: Classroom) {
        if (!confirm(`Voulez-vous vraiment supprimer « ${classroom.name} » ?`)) return;
        router.delete(destroy.url(classroom.id));
    }

    function openEdit(classroom: Classroom) {
        editForm.setData('name', classroom.name);
        setEditingClassroom(classroom);
    }

    return (
        <>
            <Head title="Salles" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Salles</h1>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter une salle
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead className="w-24"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {classrooms.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                                    Aucune salle pour l'instant. Ajoutez votre première salle pour commencer.
                                </TableCell>
                            </TableRow>
                        ) : (
                            classrooms.data.map((classroom) => (
                                <TableRow key={classroom.id}>
                                    <TableCell className="font-medium">{classroom.name}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(classroom)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(classroom)}>
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
                        <DialogTitle>Ajouter une salle</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="create-name">Nom</Label>
                                <Input
                                    id="create-name"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="ex : Salle 1"
                                    autoFocus
                                />
                                <InputError message={createForm.errors.name} />
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

            <Dialog open={!!editingClassroom} onOpenChange={(open) => !open && setEditingClassroom(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier la salle</DialogTitle>
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

ClassroomsIndex.layout = {
    breadcrumbs: [
        { title: 'Salles', href: index.url() },
    ],
};
