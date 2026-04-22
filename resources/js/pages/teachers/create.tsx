import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { index, store } from '@/actions/App/Http/Controllers/TeacherController';
import TeacherForm from './partials/teacher-form';
import type { Level, Subject } from '@/types';

type Props = {
    levels: { data: Level[] };
    subjects: { data: Subject[] };
};

export default function CreateTeacher({ levels, subjects }: Props) {
    const form = useForm({
        first_name: '',
        last_name: '',
        phone: '',
        salary_rate: '',
        subject_ids: [] as number[],
        level_ids: [] as number[],
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.post(store.url());
    }

    return (
        <>
            <Head title="Add Teacher" />
            <h1 className="text-2xl font-semibold mb-6">Add Teacher</h1>
            <TeacherForm
                data={form.data}
                errors={form.errors}
                processing={form.processing}
                levels={levels}
                subjects={subjects}
                setData={form.setData}
                onSubmit={handleSubmit}
                submitLabel="Create Teacher"
            />
        </>
    );
}

CreateTeacher.layout = {
    breadcrumbs: [
        { title: 'Teachers', href: index.url() },
        { title: 'Add Teacher', href: '#' },
    ],
};
