import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { index, update } from '@/actions/App/Http/Controllers/StudentController';
import StudentBasicForm from './partials/student-basic-form';
import StudentEnrollments from './partials/student-enrollments';
import { Separator } from '@/components/ui/separator';
import type { Student, Level, Group } from '@/types';

type Props = {
    student: { data: Student };
    levels: { data: Level[] };
    groups: { data: Group[] };
};

export default function EditStudent({ student, levels, groups }: Props) {
    const s = student.data;

    const form = useForm({
        first_name: s.first_name,
        last_name: s.last_name,
        phone: s.phone ?? '',
        guardian_name: s.guardian_name ?? '',
        guardian_phone: s.guardian_phone ?? '',
        level_id: s.level_id ? String(s.level_id) : '',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.put(update.url(s.id));
    }

    return (
        <>
            <Head title={`Modifier ${s.full_name}`} />
            <h1 className="text-2xl font-semibold mb-6">Modifier {s.full_name}</h1>

            <StudentBasicForm
                data={form.data}
                errors={form.errors}
                processing={form.processing}
                levels={levels}
                setData={form.setData}
                onSubmit={handleSubmit}
                submitLabel="Enregistrer"
            />

            <Separator className="my-8" />

            <StudentEnrollments student={s} groups={groups.data} />
        </>
    );
}

EditStudent.layout = {
    breadcrumbs: [
        { title: 'Élèves', href: index.url() },
        { title: 'Modifier l\'élève', href: '#' },
    ],
};
