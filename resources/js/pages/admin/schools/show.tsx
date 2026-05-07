import { Head, Link, router, useForm } from '@inertiajs/react';
import { ArrowLeft, KeyRound, Trash2, Users } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import schools from '@/routes/admin/schools';

type AdminInfo = {
    id: number;
    name: string;
    email: string;
};

type SchoolDetail = {
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
    school: { data: SchoolDetail };
};

function formatDate(value: string | null): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function SchoolShow({ school }: Props) {
    const data = school.data;
    const [resetting, setResetting] = useState(false);

    const passwordForm = useForm({
        password: '',
        password_confirmation: '',
    });

    function handleResetPassword(e: FormEvent) {
        e.preventDefault();
        passwordForm.put(schools.adminPassword(data.id).url, {
            onSuccess: () => {
                setResetting(false);
                passwordForm.reset();
                toast.success('Mot de passe réinitialisé');
            },
        });
    }

    function handleDelete() {
        if (!confirm(`Supprimer l'école « ${data.name} » ?`)) {
            return;
        }
        router.delete(schools.destroy(data.id).url, {
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

    return (
        <>
            <Head title={data.name} />
            <div className="mb-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={schools.index().url}>
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Retour
                    </Link>
                </Button>
            </div>

            <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold">{data.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        Créée le {formatDate(data.created_at)}
                    </p>
                </div>
                <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                </Button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Informations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div>
                            <p className="text-xs text-muted-foreground">Nom</p>
                            <p className="font-medium">{data.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Taux de salaire par défaut</p>
                            <p className="font-medium">
                                {data.default_salary_rate.toFixed(2).replace('.', ',')} DH / h
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-base">Administrateur</CardTitle>
                        {data.admin && (
                            <Button variant="ghost" size="sm" onClick={() => setResetting(true)}>
                                <KeyRound className="mr-1 h-3.5 w-3.5" />
                                Mot de passe
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        {data.admin ? (
                            <>
                                <div>
                                    <p className="text-xs text-muted-foreground">Nom</p>
                                    <p className="font-medium">{data.admin.name}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Email</p>
                                    <p className="font-medium">{data.admin.email}</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm italic text-muted-foreground">
                                Aucun administrateur associé.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Activité</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-4 w-4" /> Élèves
                                </span>
                                <span className="font-semibold">{data.students_count ?? 0}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Professeurs</span>
                                <span className="font-semibold">{data.teachers_count ?? 0}</span>
                            </li>
                            <li className="flex items-center justify-between">
                                <span className="text-muted-foreground">Paiements</span>
                                <span className="font-semibold">{data.payments_count ?? 0}</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={resetting} onOpenChange={setResetting}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
                        <DialogDescription>
                            {data.admin
                                ? `Définissez un nouveau mot de passe pour ${data.admin.name}, puis communiquez-le.`
                                : null}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="show-reset-password">Nouveau mot de passe</Label>
                                <Input
                                    id="show-reset-password"
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                    autoFocus
                                />
                                <InputError message={passwordForm.errors.password} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="show-reset-password-confirm">Confirmer</Label>
                                <Input
                                    id="show-reset-password-confirm"
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

SchoolShow.layout = {
    breadcrumbs: [{ title: 'Écoles', href: schools.index() }],
};
