import { Head, useForm, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import {
    index,
    store,
    update,
    destroy,
    resetPassword,
} from '@/actions/App/Http/Controllers/PersonnelController';
import type { Personnel } from '@/types';
import { KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';

type Props = {
    personnel: { data: Personnel[] };
};

export default function PersonnelIndex({ personnel }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<Personnel | null>(null);
    const [resettingFor, setResettingFor] = useState<Personnel | null>(null);

    const createForm = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });
    const editForm = useForm({ name: '', email: '' });
    const passwordForm = useForm({ password: '', password_confirmation: '' });

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
        if (!editing) return;
        editForm.put(update.url(editing.id), {
            onSuccess: () => {
                setEditing(null);
                editForm.reset();
            },
        });
    }

    function handleResetPassword(e: FormEvent) {
        e.preventDefault();
        if (!resettingFor) return;
        passwordForm.put(resetPassword.url(resettingFor.id), {
            onSuccess: () => {
                setResettingFor(null);
                passwordForm.reset();
            },
        });
    }

    function handleDelete(person: Personnel) {
        if (
            !confirm(
                `Voulez-vous vraiment supprimer le compte de « ${person.name} » ?`,
            )
        ) {
            return;
        }
        router.delete(destroy.url(person.id));
    }

    function openEdit(person: Personnel) {
        editForm.setData({ name: person.name, email: person.email });
        setEditing(person);
    }

    return (
        <>
            <Head title="Personnel" />
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Personnel</h1>
                    <p className="text-sm text-muted-foreground">
                        Gérez les comptes des secrétaires de votre centre.
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un secrétaire
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="w-32"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {personnel.data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={3}
                                    className="py-8 text-center text-muted-foreground"
                                >
                                    Aucun secrétaire pour l'instant. Créez le
                                    premier compte pour commencer.
                                </TableCell>
                            </TableRow>
                        ) : (
                            personnel.data.map((person) => (
                                <TableRow key={person.id}>
                                    <TableCell className="font-medium">
                                        {person.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {person.email}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Réinitialiser le mot de passe"
                                                onClick={() =>
                                                    setResettingFor(person)
                                                }
                                            >
                                                <KeyRound className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Modifier"
                                                onClick={() => openEdit(person)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Supprimer"
                                                onClick={() =>
                                                    handleDelete(person)
                                                }
                                            >
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
                        <DialogTitle>Ajouter un secrétaire</DialogTitle>
                        <DialogDescription>
                            Choisissez un mot de passe temporaire et
                            communiquez-le à la personne concernée.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="create-name">Nom complet</Label>
                                <Input
                                    id="create-name"
                                    value={createForm.data.name}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    autoFocus
                                />
                                <InputError message={createForm.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-email">Email</Label>
                                <Input
                                    id="create-email"
                                    type="email"
                                    value={createForm.data.email}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError message={createForm.errors.email} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-password">
                                    Mot de passe
                                </Label>
                                <Input
                                    id="create-password"
                                    type="password"
                                    value={createForm.data.password}
                                    onChange={(e) =>
                                        createForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError
                                    message={createForm.errors.password}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-password-confirm">
                                    Confirmer le mot de passe
                                </Label>
                                <Input
                                    id="create-password-confirm"
                                    type="password"
                                    value={
                                        createForm.data.password_confirmation
                                    }
                                    onChange={(e) =>
                                        createForm.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" type="button">
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={createForm.processing}
                            >
                                {createForm.processing && <Spinner />}
                                Créer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!editing}
                onOpenChange={(open) => !open && setEditing(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier le secrétaire</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Nom complet</Label>
                                <Input
                                    id="edit-name"
                                    value={editForm.data.name}
                                    onChange={(e) =>
                                        editForm.setData('name', e.target.value)
                                    }
                                    autoFocus
                                />
                                <InputError message={editForm.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={editForm.data.email}
                                    onChange={(e) =>
                                        editForm.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                />
                                <InputError message={editForm.errors.email} />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" type="button">
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={editForm.processing}
                            >
                                {editForm.processing && <Spinner />}
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!resettingFor}
                onOpenChange={(open) => !open && setResettingFor(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            Réinitialiser le mot de passe
                        </DialogTitle>
                        <DialogDescription>
                            {resettingFor
                                ? `Définissez un nouveau mot de passe pour ${resettingFor.name}, puis communiquez-le.`
                                : null}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="reset-password">
                                    Nouveau mot de passe
                                </Label>
                                <Input
                                    id="reset-password"
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    autoFocus
                                />
                                <InputError
                                    message={passwordForm.errors.password}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="reset-password-confirm">
                                    Confirmer le mot de passe
                                </Label>
                                <Input
                                    id="reset-password-confirm"
                                    type="password"
                                    value={
                                        passwordForm.data.password_confirmation
                                    }
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" type="button">
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={passwordForm.processing}
                            >
                                {passwordForm.processing && <Spinner />}
                                Réinitialiser
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

PersonnelIndex.layout = {
    breadcrumbs: [{ title: 'Personnel', href: index.url() }],
};
