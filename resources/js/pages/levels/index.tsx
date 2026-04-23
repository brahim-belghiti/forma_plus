import { Head, useForm, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import { index, store, update, destroy } from '@/actions/App/Http/Controllers/LevelController';
import type { Level } from '@/types';
import { Pencil, Trash2, Plus } from 'lucide-react';

type Props = {
    levels: { data: Level[] };
};

export default function LevelsIndex({ levels }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingLevel, setEditingLevel] = useState<Level | null>(null);

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
        if (!editingLevel) return;
        editForm.put(update.url(editingLevel.id), {
            onSuccess: () => {
                setEditingLevel(null);
                editForm.reset();
            },
        });
    }

    function handleDelete(level: Level) {
        if (!confirm(`Voulez-vous vraiment supprimer « ${level.name} » ?`)) return;
        router.delete(destroy.url(level.id));
    }

    function openEdit(level: Level) {
        editForm.setData('name', level.name);
        setEditingLevel(level);
    }

    return (
        <>
            <Head title="Niveaux" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Niveaux</h1>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un niveau
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead className="w-32 text-center">Matières</TableHead>
                            <TableHead className="w-24"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {levels.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                                    Aucun niveau pour l'instant. Ajoutez votre premier niveau pour commencer.
                                </TableCell>
                            </TableRow>
                        ) : (
                            levels.data.map((level) => (
                                <TableRow key={level.id}>
                                    <TableCell className="font-medium">{level.name}</TableCell>
                                    <TableCell className="text-center">{level.subjects_count ?? 0}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(level)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(level)}>
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
                        <DialogTitle>Ajouter un niveau</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="create-name">Nom</Label>
                                <Input
                                    id="create-name"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    placeholder="ex : 2ème Bac"
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

            <Dialog open={!!editingLevel} onOpenChange={(open) => !open && setEditingLevel(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier le niveau</DialogTitle>
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

LevelsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Niveaux',
            href: index.url(),
        },
    ],
};
