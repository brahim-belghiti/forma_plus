import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import type { Level } from '@/types';

type StudentBasicFormData = {
    first_name: string;
    last_name: string;
    phone: string;
    guardian_name: string;
    guardian_phone: string;
    level_id: string;
};

type Props = {
    data: StudentBasicFormData;
    errors: Partial<Record<keyof StudentBasicFormData, string>>;
    processing: boolean;
    levels: { data: Level[] };
    setData: <K extends keyof StudentBasicFormData>(key: K, value: StudentBasicFormData[K]) => void;
    onSubmit: (e: FormEvent) => void;
    submitLabel: string;
};

export default function StudentBasicForm({ data, errors, processing, levels, setData, onSubmit, submitLabel }: Props) {
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

            <div className="grid gap-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                    id="phone"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                />
                <InputError message={errors.phone} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="guardian_name">Nom du tuteur</Label>
                    <Input
                        id="guardian_name"
                        value={data.guardian_name}
                        onChange={(e) => setData('guardian_name', e.target.value)}
                    />
                    <InputError message={errors.guardian_name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="guardian_phone">Téléphone du tuteur</Label>
                    <Input
                        id="guardian_phone"
                        value={data.guardian_phone}
                        onChange={(e) => setData('guardian_phone', e.target.value)}
                    />
                    <InputError message={errors.guardian_phone} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Niveau</Label>
                <Select value={data.level_id} onValueChange={(value) => setData('level_id', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                        {levels.data.map((level) => (
                            <SelectItem key={level.id} value={String(level.id)}>
                                {level.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <InputError message={errors.level_id} />
            </div>

            <Button type="submit" disabled={processing}>
                {processing && <Spinner />}
                {submitLabel}
            </Button>
        </form>
    );
}
