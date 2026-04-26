export type Classroom = {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
};

export type Personnel = {
    id: number;
    name: string;
    email: string;
    created_at: string;
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
    level_id: number;
    level?: Level;
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
    subjects_count?: number;
    created_at: string;
    updated_at: string;
};

export type Group = {
    id: number;
    name: string;
    default_monthly_fee: string | null;
    active: boolean;
    subject_id: number;
    teacher_id: number;
    subject?: Subject;
    teacher?: Teacher;
    active_enrollments_count?: number;
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
    enrollments?: Enrollment[];
    enrollments_count?: number;
    active_enrollments_count?: number;
    created_at: string;
    updated_at: string;
};

export type Enrollment = {
    id: number;
    student_id: number;
    group_id: number;
    monthly_fee: string;
    start_date: string;
    end_date: string | null;
    active: boolean;
    student?: Student;
    group?: Group;
    created_at: string;
    updated_at: string;
};

export type Timeslot = {
    id: number;
    group_id: number;
    classroom_id: number;
    day_of_week: number;
    day_of_week_label: string;
    start_time: string;
    end_time: string;
    group?: Group;
    classroom?: Classroom;
    created_at: string;
    updated_at: string;
};

export type Payment = {
    id: number;
    enrollment_id: number;
    amount: string;
    period_month: number;
    period_year: number;
    paid_at: string;
    notes: string | null;
    enrollment?: Enrollment;
    created_at: string;
    updated_at: string;
};

export type UnpaidRow = {
    enrollment: Enrollment;
    unpaid_periods: Array<{ year: number; month: number }>;
    total_due: number;
};

export type Attendance = {
    id: number;
    class_session_id: number;
    student_id: number;
    present: boolean;
    notes: string | null;
    student?: Student;
};

export type ClassSession = {
    id: number;
    group_id: number;
    date: string;
    teacher_present: boolean;
    notes: string | null;
    group?: Group;
    attendances?: Attendance[];
    present_count?: number;
    attendances_count?: number;
    created_at: string;
    updated_at: string;
};

export type SalaryContext = {
    teacher_id: number;
    month: number;
    year: number;
    sessions_count: number;
    present_attendances: number;
    fees_collected: number;
    rate: number;
    suggested_amount: number;
} | null;

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
