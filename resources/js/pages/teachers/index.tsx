import { Head, router, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { index, create, edit, destroy } from '@/actions/App/Http/Controllers/TeacherController';
import type { Teacher, PaginatedData } from '@/types';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';

type Props = {
    teachers: PaginatedData<Teacher>;
    filters: { search?: string };
};

export default function TeachersIndex({ teachers, filters }: Props) {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.role === 'admin';

    const handleSearch = useDebouncedCallback((value: string) => {
        router.get(index.url(), { search: value || undefined }, { preserveState: true, replace: true });
    }, 300);

    function handleDelete(teacher: Teacher) {
        if (!confirm(`Voulez-vous vraiment supprimer « ${teacher.full_name} » ?`)) return;
        router.delete(destroy.url(teacher.id));
    }

    return (
        <>
            <Head title="Professeurs" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Professeurs</h1>
                <Button asChild>
                    <Link href={create.url()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un professeur
                    </Link>
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <Input
                    placeholder="Rechercher par nom..."
                    defaultValue={filters.search ?? ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Téléphone</TableHead>
                            <TableHead>Matières</TableHead>
                            {isAdmin && <TableHead className="text-center">Taux de salaire</TableHead>}
                            <TableHead className="w-24"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teachers.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-muted-foreground py-8">
                                    Aucun professeur trouvé.
                                </TableCell>
                            </TableRow>
                        ) : (
                            teachers.data.map((teacher) => (
                                <TableRow key={teacher.id}>
                                    <TableCell className="font-medium">{teacher.full_name}</TableCell>
                                    <TableCell>{teacher.phone ?? '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {teacher.subjects?.map((s) => (
                                                <Badge key={s.id} variant="secondary">
                                                    {s.name}
                                                    {s.level?.name ? ` · ${s.level.name}` : ''}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell className="text-center">
                                            {teacher.salary_rate
                                                ? `${teacher.salary_rate}%`
                                                : `${teacher.effective_salary_rate}% (défaut)`}
                                        </TableCell>
                                    )}
                                    <TableCell>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={edit.url(teacher.id)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(teacher)}>
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

            {teachers.meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                        Affichage de {teachers.meta.from} à {teachers.meta.to} sur {teachers.meta.total} professeurs
                    </p>
                    <div className="flex gap-1">
                        {teachers.meta.links.map((link, i) => (
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
        </>
    );
}

TeachersIndex.layout = {
    breadcrumbs: [
        { title: 'Professeurs', href: index.url() },
    ],
};
