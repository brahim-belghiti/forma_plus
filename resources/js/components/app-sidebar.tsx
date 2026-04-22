import { Link } from '@inertiajs/react';
import { BookOpen, DoorOpen, FolderGit2, GraduationCap, LayoutGrid, Layers, UserCheck, Users } from 'lucide-react';
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
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Levels',
        href: levelsIndex.url(),
        icon: Layers,
    },
    {
        title: 'Subjects',
        href: subjectsIndex.url(),
        icon: GraduationCap,
    },
    {
        title: 'Students',
        href: studentsIndex.url(),
        icon: Users,
    },
    {
        title: 'Teachers',
        href: teachersIndex.url(),
        icon: UserCheck,
    },
    {
        title: 'Classrooms',
        href: classroomsIndex.url(),
        icon: DoorOpen,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
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
