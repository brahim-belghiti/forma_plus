import { Link } from '@inertiajs/react';
import { BookOpen, Banknote, Calendar, CreditCard, DoorOpen, FolderGit2, GraduationCap, LayoutGrid, Layers, Receipt, UserCheck, Users } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as levelsIndex } from '@/actions/App/Http/Controllers/LevelController';
import { index as studentsIndex } from '@/actions/App/Http/Controllers/StudentController';
import { index as subjectsIndex } from '@/actions/App/Http/Controllers/SubjectController';
import { index as teachersIndex } from '@/actions/App/Http/Controllers/TeacherController';
import { index as classroomsIndex } from '@/actions/App/Http/Controllers/ClassroomController';
import { index as timeslotsIndex } from '@/actions/App/Http/Controllers/TimeslotController';
import { index as paymentsIndex } from '@/actions/App/Http/Controllers/PaymentController';
import { index as salariesIndex } from '@/actions/App/Http/Controllers/SalaryController';
import { index as expensesIndex } from '@/actions/App/Http/Controllers/ExpenseController';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Tableau de bord',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Niveaux',
        href: levelsIndex.url(),
        icon: Layers,
    },
    {
        title: 'Matières',
        href: subjectsIndex.url(),
        icon: GraduationCap,
    },
    {
        title: 'Élèves',
        href: studentsIndex.url(),
        icon: Users,
    },
    {
        title: 'Professeurs',
        href: teachersIndex.url(),
        icon: UserCheck,
    },
    {
        title: 'Salles',
        href: classroomsIndex.url(),
        icon: DoorOpen,
    },
    {
        title: 'Emploi du temps',
        href: timeslotsIndex.url(),
        icon: Calendar,
    },
    {
        title: 'Paiements',
        href: paymentsIndex.url(),
        icon: CreditCard,
    },
    {
        title: 'Salaires',
        href: salariesIndex.url(),
        icon: Banknote,
    },
    {
        title: 'Dépenses',
        href: expensesIndex.url(),
        icon: Receipt,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Dépôt',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
