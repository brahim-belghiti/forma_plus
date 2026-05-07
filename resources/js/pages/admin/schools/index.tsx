import { Head, Link, router, useForm } from '@inertiajs/react';
import { Building2, Eye, KeyRound, Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import schools from '@/routes/admin/schools';

type AdminInfo = {
    id: number;
    name: string;
    email: string;
};

type SchoolRow = {
    id: number;
    name: string;
    default_salary_rate: number;
    created_at: string | null;
    admin?: AdminInfo;
    students_count?: number;
    teachers_count?: number;
    payments_count?: number;
};

type Props = {
    schools: { data: SchoolRow[] };
};

function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

export default function SchoolsIndex({ schools: schoolsData }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<SchoolRow | null>(null);
    const [resettingFor, setResettingFor] = useState<SchoolRow | null>(null);

    const createForm = useForm({
        name: '',
        default_salary_rate: '',
        admin: {
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
        },
    });

    const editForm = useForm({
        name: '',
        default_salary_rate: '',
    });

    const passwordForm = useForm({
        password: '',
        password_confirmation: '',
    });

    function handleCreate(e: FormEvent) {
        e.preventDefault();
        createForm.post(schools.store().url, {
            onSuccess: () => {
                setShowCreate(false);
                createForm.reset();
                toast.success('École créée');
            },
        });
    }

    function handleEdit(e: FormEvent) {
        e.preventDefault();
        if (!editing) return;
        editForm.put(schools.update(editing.id).url, {
            onSuccess: () => {
                setEditing(null);
                editForm.reset();
                toast.success('École mise à jour');
            },
        });
    }

    function handleResetPassword(e: FormEvent) {
        e.preventDefault();
        if (!resettingFor) return;
        passwordForm.put(schools.adminPassword(resettingFor.id).url, {
            onSuccess: () => {
                setResettingFor(null);
                passwordForm.reset();
                toast.success('Mot de passe réinitialisé');
            },
        });
    }

    function handleDelete(school: SchoolRow) {
        if (!confirm(`Supprimer l'école « ${school.name} » ?`)) {
            return;
        }
        router.delete(schools.destroy(school.id).url, {
            onError: (errors) => {
                if (errors.school) {
                    toast.error(errors.school);
                }
            },
            onSuccess: () => {
                toast.success('École supprimée');
            },
        });
    }

    function openEdit(school: SchoolRow) {
        editForm.setData({
            name: school.name,
            default_salary_rate: String(school.default_salary_rate ?? ''),
        });
        setEditing(school);
    }

    return (
        <>
            <Head title="Écoles" />
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Écoles</h1>
                    <p className="text-sm text-muted-foreground">
                        Gérez les écoles inscrites sur la plateforme et leurs administrateurs.
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle école
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>École</TableHead>
                            <TableHead>Administrateur</TableHead>
                            <TableHead className="text-right">Élèves</TableHead>
                            <TableHead className="text-right">Profs</TableHead>
                            <TableHead className="text-right">Paiements</TableHead>
                            <TableHead>Créée</TableHead>
                            <TableHead className="w-44"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {schoolsData.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                                    <Building2 className="mx-auto mb-2 h-8 w-8 opacity-40" />
                                    Aucune école pour l'instant. Créez la première pour commencer.
                                </TableCell>
                            </TableRow>
                        ) : (
                            schoolsData.data.map((school) => (
                                <TableRow key={school.id}>
                                    <TableCell className="font-medium">{school.name}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {school.admin ? (
                                            <div className="flex flex-col">
                                                <span>{school.admin.name}</span>
                                                <span className="text-xs">{school.admin.email}</span>
                                            </div>
                                        ) : (
                                            <span className="text-xs italic">Sans admin</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">{school.students_count ?? 0}</TableCell>
                                    <TableCell className="text-right">{school.teachers_count ?? 0}</TableCell>
                                    <TableCell className="text-right">{school.payments_count ?? 0}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatDate(school.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="icon" title="Voir" asChild>
                                                <Link href={schools.show(school.id).url}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Réinitialiser le mot de passe"
                                                onClick={() => setResettingFor(school)}
                                                disabled={!school.admin}
                                            >
                                                <KeyRound className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Modifier"
                                                onClick={() => openEdit(school)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                title="Supprimer"
                                                onClick={() => handleDelete(school)}
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
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Nouvelle école</DialogTitle>
                        <DialogDescription>
                            L'administrateur recevra un compte avec le mot de passe que vous définissez.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreate}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="create-school-name">Nom de l'école</Label>
                                <Input
                                    id="create-school-name"
                                    value={createForm.data.name}
                                    onChange={(e) => createForm.setData('name', e.target.value)}
                                    autoFocus
                                />
                                <InputError message={createForm.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-salary-rate">Taux de salaire par défaut (DH/h)</Label>
                                <Input
                                    id="create-salary-rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0,00"
                                    value={createForm.data.default_salary_rate}
                                    onChange={(e) => createForm.setData('default_salary_rate', e.target.value)}
                                />
                                <InputError message={createForm.errors.default_salary_rate} />
                            </div>

                            <div className="-mx-6 border-t" />

                            <p className="text-sm font-medium">Administrateur</p>
                            <div className="grid gap-2">
                                <Label htmlFor="create-admin-name">Nom complet</Label>
                                <Input
                                    id="create-admin-name"
                                    value={createForm.data.admin.name}
                                    onChange={(e) =>
                                        createForm.setData('admin', {
                                            ...createForm.data.admin,
                                            name: e.target.value,
                                        })
                                    }
                                />
                                <InputError message={createForm.errors['admin.name']} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="create-admin-email">Email</Label>
                                <Input
                                    id="create-admin-email"
                                    type="email"
                                    value={createForm.data.admin.email}
                                    onChange={(e) =>
                                        createForm.setData('admin', {
                                            ...createForm.data.admin,
                                            email: e.target.value,
                                        })
                                    }
                                />
                                <InputError message={createForm.errors['admin.email']} />
                            </div>
                            <div className="grid gap-2 md:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="create-admin-password">Mot de passe</Label>
                                    <Input
                                        id="create-admin-password"
                                        type="password"
                                        value={createForm.data.admin.password}
                                        onChange={(e) =>
                                            createForm.setData('admin', {
                                                ...createForm.data.admin,
                                                password: e.target.value,
                                            })
                                        }
                                    />
                                    <InputError message={createForm.errors['admin.password']} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="create-admin-password-confirm">Confirmer</Label>
                                    <Input
                                        id="create-admin-password-confirm"
                                        type="password"
                                        value={createForm.data.admin.password_confirmation}
                                        onChange={(e) =>
                                            createForm.setData('admin', {
                                                ...createForm.data.admin,
                                                password_confirmation: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" type="button">
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={createForm.processing}>
                                {createForm.processing && <Spinner className="mr-2 h-4 w-4" />}
                                Créer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier l'école</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleEdit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-school-name">Nom de l'école</Label>
                                <Input
                                    id="edit-school-name"
                                    value={editForm.data.name}
                                    onChange={(e) => editForm.setData('name', e.target.value)}
                                    autoFocus
                                />
                                <InputError message={editForm.errors.name} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-salary-rate">Taux de salaire par défaut (DH/h)</Label>
                                <Input
                                    id="edit-salary-rate"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editForm.data.default_salary_rate}
                                    onChange={(e) => editForm.setData('default_salary_rate', e.target.value)}
                                />
                                <InputError message={editForm.errors.default_salary_rate} />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" type="button">
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={editForm.processing}>
                                {editForm.processing && <Spinner className="mr-2 h-4 w-4" />}
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={!!resettingFor} onOpenChange={(open) => !open && setResettingFor(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                        <DialogDescription>
                            {resettingFor?.admin
                                ? `Définissez un nouveau mot de passe pour ${resettingFor.admin.name}, puis communiquez-le.`
                                : null}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="reset-school-password">Nouveau mot de passe</Label>
                                <Input
                                    id="reset-school-password"
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    autoFocus
                                />
                                <InputError message={passwordForm.errors.password} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="reset-school-password-confirm">Confirmer</Label>
                                <Input
                                    id="reset-school-password-confirm"
                                    type="password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline" type="button">
                                    Annuler
                                </Button>
                            </DialogClose>
                            <Button type="submit" disabled={passwordForm.processing}>
                                {passwordForm.processing && <Spinner className="mr-2 h-4 w-4" />}
                                Réinitialiser
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
}

SchoolsIndex.layout = {
    breadcrumbs: [{ title: 'Écoles', href: schools.index() }],
};
