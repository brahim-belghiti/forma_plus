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
