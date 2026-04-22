import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { index, update } from '@/actions/App/Http/Controllers/StudentController';
import StudentForm from './partials/student-form';
import type { Student, Level, Subject } from '@/types';

type Props = {
    student: { data: Student };
    levels: { data: Level[] };
    subjects: { data: Subject[] };
};

export default function EditStudent({ student, levels, subjects }: Props) {
    const s = student.data;

    const form = useForm({
        first_name: s.first_name,
        last_name: s.last_name,
        phone: s.phone ?? '',
        guardian_name: s.guardian_name ?? '',
        guardian_phone: s.guardian_phone ?? '',
        level_id: s.level_id ? String(s.level_id) : '',
        subject_ids: s.subjects?.map((sub) => sub.id) ?? [],
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.put(update.url(s.id));
    }

    return (
        <>
            <Head title={`Edit ${s.full_name}`} />
            <h1 className="text-2xl font-semibold mb-6">Edit {s.full_name}</h1>
            <StudentForm
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

EditStudent.layout = {
    breadcrumbs: [
        { title: 'Students', href: index.url() },
        { title: 'Edit Student', href: '#' },
    ],
};
