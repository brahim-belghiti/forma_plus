import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { index, store } from '@/actions/App/Http/Controllers/StudentController';
import StudentForm from './partials/student-form';
import type { Level, Subject } from '@/types';

type Props = {
    levels: { data: Level[] };
    subjects: { data: Subject[] };
};

export default function CreateStudent({ levels, subjects }: Props) {
    const form = useForm({
        first_name: '',
        last_name: '',
        phone: '',
        guardian_name: '',
        guardian_phone: '',
        level_id: '',
        subject_ids: [] as number[],
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.post(store.url());
    }

    return (
        <>
            <Head title="Add Student" />
            <h1 className="text-2xl font-semibold mb-6">Add Student</h1>
            <StudentForm
                data={form.data}
                errors={form.errors}
                processing={form.processing}
                levels={levels}
                subjects={subjects}
                setData={form.setData}
                onSubmit={handleSubmit}
                submitLabel="Create Student"
            />
        </>
    );
}

CreateStudent.layout = {
    breadcrumbs: [
        { title: 'Students', href: index.url() },
        { title: 'Add Student', href: '#' },
    ],
};
