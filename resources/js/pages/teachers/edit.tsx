import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { index, update } from '@/actions/App/Http/Controllers/TeacherController';
import TeacherForm from './partials/teacher-form';
import type { Teacher, Subject } from '@/types';

type Props = {
    teacher: { data: Teacher };
    subjects: { data: Subject[] };
};

export default function EditTeacher({ teacher, subjects }: Props) {
    const t = teacher.data;

    const form = useForm({
        first_name: t.first_name,
        last_name: t.last_name,
        phone: t.phone ?? '',
        salary_rate: t.salary_rate ?? '',
        subject_ids: t.subjects?.map((s) => s.id) ?? [],
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.put(update.url(t.id));
    }

    return (
        <>
            <Head title={`Modifier ${t.full_name}`} />
            <h1 className="text-2xl font-semibold mb-6">Modifier {t.full_name}</h1>
            <TeacherForm
                data={form.data}
                errors={form.errors}
                processing={form.processing}
                subjects={subjects}
                setData={form.setData}
                onSubmit={handleSubmit}
                submitLabel="Enregistrer"
            />
        </>
    );
}

EditTeacher.layout = {
    breadcrumbs: [
        { title: 'Professeurs', href: index.url() },
        { title: 'Modifier le professeur', href: '#' },
    ],
};
