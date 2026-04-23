import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import type { Level, Subject } from '@/types';

type TeacherFormData = {
    first_name: string;
    last_name: string;
    phone: string;
    salary_rate: string;
    subject_ids: number[];
    level_ids: number[];
};

type Props = {
    data: TeacherFormData;
    errors: Partial<Record<keyof TeacherFormData, string>>;
    processing: boolean;
    levels: { data: Level[] };
    subjects: { data: Subject[] };
    setData: <K extends keyof TeacherFormData>(key: K, value: TeacherFormData[K]) => void;
    onSubmit: (e: FormEvent) => void;
    submitLabel: string;
};

export default function TeacherForm({ data, errors, processing, levels, subjects, setData, onSubmit, submitLabel }: Props) {
    function toggleId(field: 'subject_ids' | 'level_ids', id: number) {
        const ids = data[field].includes(id)
            ? data[field].filter((v) => v !== id)
            : [...data[field], id];
        setData(field, ids);
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="first_name">Prénom</Label>
                    <Input
                        id="first_name"
                        value={data.first_name}
                        onChange={(e) => setData('first_name', e.target.value)}
                        required
                        autoFocus
                    />
                    <InputError message={errors.first_name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="last_name">Nom</Label>
                    <Input
                        id="last_name"
                        value={data.last_name}
                        onChange={(e) => setData('last_name', e.target.value)}
                        required
                    />
                    <InputError message={errors.last_name} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                        id="phone"
                        value={data.phone}
                        onChange={(e) => setData('phone', e.target.value)}
                    />
                    <InputError message={errors.phone} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="salary_rate">Taux de salaire (%)</Label>
                    <Input
                        id="salary_rate"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={data.salary_rate}
                        onChange={(e) => setData('salary_rate', e.target.value)}
                        placeholder="Laisser vide pour utiliser le taux par défaut"
                    />
                    <InputError message={errors.salary_rate} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Matières enseignées</Label>
                <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
                    {subjects.data.length === 0 ? (
                        <p className="text-sm text-muted-foreground col-span-2">Aucune matière disponible.</p>
                    ) : (
                        subjects.data.map((subject) => (
                            <label key={subject.id} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={data.subject_ids.includes(subject.id)}
                                    onCheckedChange={() => toggleId('subject_ids', subject.id)}
                                />
                                <span className="text-sm">{subject.name}</span>
                            </label>
                        ))
                    )}
                </div>
                <InputError message={errors.subject_ids} />
            </div>

            <div className="grid gap-2">
                <Label>Niveaux enseignés</Label>
                <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
                    {levels.data.length === 0 ? (
                        <p className="text-sm text-muted-foreground col-span-2">Aucun niveau disponible.</p>
                    ) : (
                        levels.data.map((level) => (
                            <label key={level.id} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={data.level_ids.includes(level.id)}
                                    onCheckedChange={() => toggleId('level_ids', level.id)}
                                />
                                <span className="text-sm">{level.name}</span>
                            </label>
                        ))
                    )}
                </div>
                <InputError message={errors.level_ids} />
            </div>

            <Button type="submit" disabled={processing}>
                {processing && <Spinner />}
                {submitLabel}
            </Button>
        </form>
    );
}
