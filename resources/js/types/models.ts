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
