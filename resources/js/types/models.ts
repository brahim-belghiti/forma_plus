export type Classroom = {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
};

export type Level = {
    id: number;
    name: string;
    subjects?: Subject[];
    subjects_count?: number;
    created_at: string;
    updated_at: string;
};

export type Subject = {
    id: number;
    name: string;
    levels?: Level[];
    levels_count?: number;
    created_at: string;
    updated_at: string;
};

export type Teacher = {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string | null;
    salary_rate: string | null;
    effective_salary_rate: number;
    subjects?: Subject[];
    levels?: Level[];
    subjects_count?: number;
    levels_count?: number;
    created_at: string;
    updated_at: string;
};

export type Student = {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string | null;
    guardian_name: string | null;
    guardian_phone: string | null;
    level: Level | null;
    level_id: number | null;
    subjects?: Subject[];
    subjects_count?: number;
    created_at: string;
    updated_at: string;
};

export type Timeslot = {
    id: number;
    teacher_id: number;
    subject_id: number;
    level_id: number;
    classroom_id: number;
    day_of_week: number;
    day_of_week_label: string;
    start_time: string;
    end_time: string;
    teacher?: Teacher;
    subject?: Subject;
    level?: Level;
    classroom?: Classroom;
    created_at: string;
    updated_at: string;
};

export type Payment = {
    id: number;
    student_id: number;
    amount: string;
    period_month: number;
    period_year: number;
    paid_at: string;
    notes: string | null;
    student?: Student;
    created_at: string;
    updated_at: string;
};

export type Salary = {
    id: number;
    teacher_id: number;
    amount: string;
    period_month: number;
    period_year: number;
    paid_at: string;
    notes: string | null;
    teacher?: Teacher;
    created_at: string;
    updated_at: string;
};

export type Expense = {
    id: number;
    description: string;
    amount: string;
    spent_at: string;
    notes: string | null;
    created_at: string;
    updated_at: string;
};

export type PaginatedData<T> = {
    data: T[];
    links: {
        first: string | null;
        last: string | null;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        per_page: number;
        to: number | null;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
};
