import { Head } from '@inertiajs/react';

export default function AdminDashboard() {
    return (
        <>
            <Head title="Super Admin" />
            <div className="flex min-h-screen items-center justify-center bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold">Super Admin</h1>
                    <p className="mt-2 text-sm text-[#5a5a55] dark:text-[#a1a1a1]">
                        Tableau de bord à venir.
                    </p>
                </div>
            </div>
        </>
    );
}
