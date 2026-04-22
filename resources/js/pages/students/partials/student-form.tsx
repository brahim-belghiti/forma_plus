import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';
import type { Level, Subject } from '@/types';

type StudentFormData = {
    first_name: string;
    last_name: string;
    phone: string;
    guardian_name: string;
    guardian_phone: string;
    level_id: string;
    subject_ids: number[];
};

type Props = {
    data: StudentFormData;
    errors: Partial<Record<keyof StudentFormData, string>>;
    processing: boolean;
    levels: { data: Level[] };
    subjects: { data: Subject[] };
    setData: <K extends keyof StudentFormData>(key: K, value: StudentFormData[K]) => void;
    onSubmit: (e: FormEvent) => void;
    submitLabel: string;
};

export default function StudentForm({ data, errors, processing, levels, subjects, setData, onSubmit, submitLabel }: Props) {
    function toggleSubject(subjectId: number) {
        const ids = data.subject_ids.includes(subjectId)
            ? data.subject_ids.filter((id) => id !== subjectId)
            : [...data.subject_ids, subjectId];
        setData('subject_ids', ids);
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="first_name">First name</Label>
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
                    <Label htmlFor="last_name">Last name</Label>
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                    id="phone"
                    value={data.phone}
                    onChange={(e) => setData('phone', e.target.value)}
                />
                <InputError message={errors.phone} />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="guardian_name">Guardian name</Label>
                    <Input
                        id="guardian_name"
                        value={data.guardian_name}
                        onChange={(e) => setData('guardian_name', e.target.value)}
                    />
                    <InputError message={errors.guardian_name} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="guardian_phone">Guardian phone</Label>
                    <Input
                        id="guardian_phone"
                        value={data.guardian_phone}
                        onChange={(e) => setData('guardian_phone', e.target.value)}
                    />
                    <InputError message={errors.guardian_phone} />
                </div>
            </div>

            <div className="grid gap-2">
                <Label>Level</Label>
                <Select value={data.level_id} onValueChange={(value) => setData('level_id', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a level" />
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

            <div className="grid gap-2">
                <Label>Subjects</Label>
                <div className="grid grid-cols-2 gap-2 rounded-lg border p-4">
                    {subjects.data.length === 0 ? (
                        <p className="text-sm text-muted-foreground col-span-2">No subjects available. Create subjects first.</p>
                    ) : (
                        subjects.data.map((subject) => (
                            <label key={subject.id} className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={data.subject_ids.includes(subject.id)}
                                    onCheckedChange={() => toggleSubject(subject.id)}
                                />
                                <span className="text-sm">{subject.name}</span>
                            </label>
                        ))
                    )}
                </div>
                <InputError message={errors.subject_ids} />
            </div>

            <Button type="submit" disabled={processing}>
                {processing && <Spinner />}
                {submitLabel}
            </Button>
        </form>
    );
}
