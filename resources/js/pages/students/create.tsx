import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { index, store } from '@/actions/App/Http/Controllers/StudentController';
import StudentBasicForm from './partials/student-basic-form';
import type { Level } from '@/types';

type Props = {
    levels: { data: Level[] };
};

export default function CreateStudent({ levels }: Props) {
    const form = useForm({
        first_name: '',
        last_name: '',
        phone: '',
        guardian_name: '',
        guardian_phone: '',
        level_id: '',
    });

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        form.post(store.url());
    }

    return (
        <>
            <Head title="Ajouter un élève" />
            <h1 className="text-2xl font-semibold mb-6">Ajouter un élève</h1>
            <p className="text-sm text-muted-foreground mb-6">
                Créez l'élève puis ajoutez ses inscriptions (matière, professeur, tarif mensuel) depuis la page de modification.
            </p>
            <StudentBasicForm
                data={form.data}
                errors={form.errors}
                processing={form.processing}
                levels={levels}
                setData={form.setData}
                onSubmit={handleSubmit}
                submitLabel="Continuer vers les inscriptions"
            />
        </>
    );
}

CreateStudent.layout = {
    breadcrumbs: [
        { title: 'Élèves', href: index.url() },
        { title: 'Ajouter un élève', href: '#' },
    ],
};
