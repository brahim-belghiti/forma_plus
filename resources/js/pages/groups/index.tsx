import { Head, useForm, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import InputError from '@/components/input-error';
import { index, store, update, destroy } from '@/actions/App/Http/Controllers/GroupController';
import type { Group, Subject, Teacher } from '@/types';
import { Pencil, Trash2, Plus } from 'lucide-react';

type Props = {
    groups: { data: Group[] };
    subjects: { data: Subject[] };
    teachers: { data: Teacher[] };
    filters: { search?: string };
};

type GroupFormData = {
    name: string;
    subject_id: string;
    teacher_id: string;
    default_monthly_fee: string;
    active: boolean;
};

const emptyForm: GroupFormData = {
    name: '',
    subject_id: '',
    teacher_id: '',
    default_monthly_fee: '',
    active: true,
};

export default function GroupsIndex({ groups, subjects, teachers, filters }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');

    const createForm = useForm<GroupFormData>({ ...emptyForm });
    const editForm = useForm<GroupFormData>({ ...emptyForm });

    function handleSearch(value: string) {
        setSearch(value);
        router.get(index.url(), { search: value || undefined }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

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
        if (!editingGroup) return;
        editForm.put(update.url(editingGroup.id), {
            onSuccess: () => {
                setEditingGroup(null);
                editForm.reset();
            },
        });
    }

    function handleDelete(group: Group) {
        if (!confirm(`Voulez-vous vraiment supprimer « ${group.name} » ?`)) return;
        router.delete(destroy.url(group.id));
    }

    function openEdit(group: Group) {
        editForm.setData({
            name: group.name,
            subject_id: String(group.subject_id),
            teacher_id: String(group.teacher_id),
            default_monthly_fee: group.default_monthly_fee ?? '',
            active: group.active,
        });
        setEditingGroup(group);
    }

    const canCreate = subjects.data.length > 0 && teachers.data.length > 0;

    return (
        <>
            <Head title="Groupes" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Groupes</h1>
                <Button onClick={() => setShowCreate(true)} disabled={!canCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un groupe
                </Button>
            </div>

            {!canCreate && (
                <p className="mb-4 text-sm text-muted-foreground">
                    Ajoutez d'abord une matière et un professeur avant de créer des groupes.
                </p>
            )}

            <div className="mb-4">
                <Input
                    placeholder="Rechercher un groupe..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Matière</TableHead>
                            <TableHead>Niveau</TableHead>
                            <TableHead>Professeur</TableHead>
                            <TableHead>Tarif par défaut</TableHead>
                            <TableHead className="text-center">Élèves actifs</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="w-24"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {groups.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                    Aucun groupe pour l'instant.
                                </TableCell>
                            </TableRow>
                        ) : (
                            groups.data.map((group) => (
                                <TableRow key={group.id}>
                                    <TableCell className="font-medium">{group.name}</TableCell>
                                    <TableCell>{group.subject?.name}</TableCell>
                                    <TableCell>{group.subject?.level?.name ?? '—'}</TableCell>
                                    <TableCell>{group.teacher?.full_name}</TableCell>
                                    <TableCell>
                                        {group.default_monthly_fee
                                            ? `${Number(group.default_monthly_fee).toFixed(2).replace('.', ',')} DH`
                                            : '—'}
                                    </TableCell>
                                    <TableCell className="text-center">{group.active_enrollments_count ?? 0}</TableCell>
                                    <TableCell>
                                        <Badge variant={group.active ? 'default' : 'secondary'}>
                                            {group.active ? 'Actif' : 'Archivé'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(group)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(group)}>
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
                        <DialogTitle>Ajouter un groupe</DialogTitle>
                    </DialogHeader>
                    <GroupForm
                        form={createForm}
                        onSubmit={handleCreate}
                        subjects={subjects.data}
                        teachers={teachers.data}
                        submitLabel="Créer"
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier le groupe</DialogTitle>
                    </DialogHeader>
                    <GroupForm
                        form={editForm}
                        onSubmit={handleEdit}
                        subjects={subjects.data}
                        teachers={teachers.data}
                        submitLabel="Enregistrer"
                    />
                </DialogContent>
            </Dialog>
        </>
    );
}

type GroupFormProps = {
    form: ReturnType<typeof useForm<GroupFormData>>;
    onSubmit: (e: FormEvent) => void;
    subjects: Subject[];
    teachers: Teacher[];
    submitLabel: string;
};

function GroupForm({ form, onSubmit, subjects, teachers, submitLabel }: GroupFormProps) {
    return (
        <form onSubmit={onSubmit}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="group-name">Nom du groupe</Label>
                    <Input
                        id="group-name"
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="ex : 1ac-1"
                        autoFocus
                    />
                    <InputError message={form.errors.name} />
                </div>

                <div className="grid gap-2">
                    <Label>Matière</Label>
                    <Select value={form.data.subject_id} onValueChange={(v) => form.setData('subject_id', v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner une matière" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map((subject) => (
                                <SelectItem key={subject.id} value={String(subject.id)}>
                                    {subject.name}
                                    {subject.level?.name ? ` · ${subject.level.name}` : ''}
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
                            <SelectValue placeholder="Sélectionner un professeur" />
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
                    <Label htmlFor="group-fee">Tarif mensuel par défaut (DH)</Label>
                    <Input
                        id="group-fee"
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.data.default_monthly_fee}
                        onChange={(e) => form.setData('default_monthly_fee', e.target.value)}
                        placeholder="Optionnel"
                    />
                    <p className="text-xs text-muted-foreground">
                        Pré-rempli lors de la création d'une inscription. Modifiable par élève.
                    </p>
                    <InputError message={form.errors.default_monthly_fee} />
                </div>

                <div className="grid gap-2">
                    <Label>Statut</Label>
                    <Select
                        value={form.data.active ? '1' : '0'}
                        onValueChange={(v) => form.setData('active', v === '1')}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Actif</SelectItem>
                            <SelectItem value="0">Archivé</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" type="button">Annuler</Button>
                </DialogClose>
                <Button type="submit" disabled={form.processing}>
                    {form.processing && <Spinner />}
                    {submitLabel}
                </Button>
            </DialogFooter>
        </form>
    );
}

GroupsIndex.layout = {
    breadcrumbs: [
        { title: 'Groupes', href: index.url() },
    ],
};
