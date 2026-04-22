import { Head, router, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { index, create, edit, destroy } from '@/actions/App/Http/Controllers/StudentController';
import type { Student, Level, PaginatedData } from '@/types';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';

type Props = {
    students: PaginatedData<Student>;
    levels: { data: Level[] };
    filters: {
        search?: string;
        level_id?: string;
    };
};

export default function StudentsIndex({ students, levels, filters }: Props) {
    const handleSearch = useDebouncedCallback((value: string) => {
        router.get(index.url(), { ...filters, search: value || undefined }, { preserveState: true, replace: true });
    }, 300);

    function handleLevelFilter(value: string) {
        router.get(index.url(), { ...filters, level_id: value === 'all' ? undefined : value }, { preserveState: true, replace: true });
    }

    function handleDelete(student: Student) {
        if (!confirm(`Are you sure you want to delete "${student.full_name}"?`)) return;
        router.delete(destroy.url(student.id));
    }

    return (
        <>
            <Head title="Students" />
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold">Students</h1>
                <Button asChild>
                    <Link href={create.url()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Student
                    </Link>
                </Button>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <Input
                    placeholder="Search by name..."
                    defaultValue={filters.search ?? ''}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="max-w-sm"
                />
                <Select value={filters.level_id ?? 'all'} onValueChange={handleLevelFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue placeholder="All levels" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All levels</SelectItem>
                        {levels.data.map((level) => (
                            <SelectItem key={level.id} value={String(level.id)}>
                                {level.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Level</TableHead>
                            <TableHead>Subjects</TableHead>
                            <TableHead>Guardian</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead className="w-24"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                    No students found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            students.data.map((student) => (
                                <TableRow key={student.id}>
                                    <TableCell className="font-medium">{student.full_name}</TableCell>
                                    <TableCell>{student.level?.name ?? '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {student.subjects?.map((subject) => (
                                                <Badge key={subject.id} variant="secondary">
                                                    {subject.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>{student.guardian_name ?? '-'}</TableCell>
                                    <TableCell>{student.phone ?? student.guardian_phone ?? '-'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1 justify-end">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={edit.url(student.id)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(student)}>
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

            {/* Pagination */}
            {students.meta.last_page > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                        Showing {students.meta.from} to {students.meta.to} of {students.meta.total} students
                    </p>
                    <div className="flex gap-1">
                        {students.meta.links.map((link, i) => (
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

StudentsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Students',
            href: index.url(),
        },
    ],
};
