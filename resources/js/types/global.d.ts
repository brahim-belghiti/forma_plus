import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            flash: {
                receipt: { url: string; number: string } | null;
            };
            [key: string]: unknown;
        };
    }
}
