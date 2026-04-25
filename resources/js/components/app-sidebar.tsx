import { Link, usePage } from '@inertiajs/react';
import { Banknote, Calendar, ClipboardList, CreditCard, DoorOpen, FolderGit2, GraduationCap, LayoutGrid, Layers, Receipt, UserCheck, Users } from 'lucide-react';
import { index as classroomsIndex } from '@/actions/App/Http/Controllers/ClassroomController';
import { index as sessionsIndex } from '@/actions/App/Http/Controllers/ClassSessionController';
import { index as expensesIndex } from '@/actions/App/Http/Controllers/ExpenseController';
import { index as groupsIndex } from '@/actions/App/Http/Controllers/GroupController';
import { index as levelsIndex } from '@/actions/App/Http/Controllers/LevelController';
import { unpaid as paymentsUnpaid } from '@/actions/App/Http/Controllers/PaymentController';
import { index as salariesIndex } from '@/actions/App/Http/Controllers/SalaryController';
import { index as studentsIndex } from '@/actions/App/Http/Controllers/StudentController';
import { index as subjectsIndex } from '@/actions/App/Http/Controllers/SubjectController';
import { index as teachersIndex } from '@/actions/App/Http/Controllers/TeacherController';
import { index as timeslotsIndex } from '@/actions/App/Http/Controllers/TimeslotController';
import AppLogo from '@/components/app-logo';
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
import type { NavItem } from '@/types';

type NavItemWithRole = NavItem & { adminOnly?: boolean };

const mainNavItems: NavItemWithRole[] = [
    {
        title: 'Tableau de bord',
        href: dashboard(),
        icon: LayoutGrid,
        adminOnly: true,
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
        title: 'Groupes',
        href: groupsIndex.url(),
        icon: FolderGit2,
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
        title: 'Séances',
        href: sessionsIndex.url(),
        icon: ClipboardList,
    },
    {
        title: 'Paiements',
        href: paymentsUnpaid.url(),
        icon: CreditCard,
    },
    {
        title: 'Salaires',
        href: salariesIndex.url(),
        icon: Banknote,
        adminOnly: true,
    },
    {
        title: 'Dépenses',
        href: expensesIndex.url(),
        icon: Receipt,
        adminOnly: true,
    },
];



export function AppSidebar() {
    const { auth } = usePage().props;
    const isAdmin = auth.user?.role === 'admin';
    const visibleItems = mainNavItems.filter((item) => isAdmin || !item.adminOnly);
    const homeHref = isAdmin ? dashboard() : studentsIndex.url();

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={homeHref} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={visibleItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
