import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { index, update } from '@/actions/App/Http/Controllers/TeacherController';
import TeacherForm from './partials/teacher-form';
import type { Teacher, Level, Subject } from '@/types';

type Props = {
    teacher: { data: Teacher };
    levels: { data: Level[] };
    subjects: { data: Subject[] };
};

export default function EditTeacher({ teacher, levels, subjects }: Props) {
    const t = teacher.data;

    const form = useForm({
        first_name: t.first_name,
        last_name: t.last_name,
        phone: t.phone ?? '',
        salary_rate: t.salary_rate ?? '',
        subject_ids: t.subjects?.map((s) => s.id) ?? [],
        level_ids: t.levels?.map((l) => l.id) ?? [],
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.put(update.url(t.id));
    }

    return (
        <>
            <Head title={`Edit ${t.full_name}`} />
            <h1 className="text-2xl font-semibold mb-6">Edit {t.full_name}</h1>
            <TeacherForm
                data={form.data}
                errors={form.errors}
                processing={form.processing}
                levels={levels}
                subjects={subjects}
                setData={form.setData}
                onSubmit={handleSubmit}
                submitLabel="Save Changes"
            />
        </>
    );
}

EditTeacher.layout = {
    breadcrumbs: [
        { title: 'Teachers', href: index.url() },
        { title: 'Edit Teacher', href: '#' },
    ],
};
