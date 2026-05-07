import { Head, Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;

    return (
        <>
            <Head title="Bienvenue">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link
                    href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600"
                    rel="stylesheet"
                />
            </Head>
            <div className="flex min-h-screen flex-col bg-[#FDFDFC] text-[#1b1b18] dark:bg-[#0a0a0a] dark:text-[#EDEDEC]">
                <header className="w-full border-b border-[#19140014] dark:border-[#ffffff0d]">
                    <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
                        <Link
                            href="/"
                            className="flex items-center gap-2 text-base font-semibold"
                        >
                            <AppLogoIcon className="size-8 text-[#1b1b18] dark:text-[#EDEDEC]" />
                            <span>forma+</span>
                        </Link>
                        <nav className="flex items-center gap-2 text-sm">
                            {auth.user ? (
                                <Link
                                    href={dashboard()}
                                    className="inline-block rounded-md border border-[#19140035] px-4 py-1.5 leading-normal hover:border-[#1915014a] dark:border-[#3E3E3A] dark:hover:border-[#62605b]"
                                >
                                    Tableau de bord
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    className="inline-block rounded-md border border-[#19140035] px-4 py-1.5 leading-normal hover:border-[#1915014a] dark:border-[#3E3E3A] dark:hover:border-[#62605b]"
                                >
                                    Se connecter
                                </Link>
                            )}
                        </nav>
                    </div>
                </header>

                <main className="flex flex-1 items-center">
                    <div className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-8 lg:py-24">
                        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
                            <div className="flex flex-col gap-6">
                                <span className="inline-flex w-fit items-center rounded-full border border-[#19140035] px-3 py-1 text-xs font-medium dark:border-[#3E3E3A]">
                                    Gestion de centre de formation
                                </span>
                                <h1 className="text-4xl font-semibold tracking-tight lg:text-5xl">
                                    Pilotez votre centre de formation en toute
                                    simplicité.
                                </h1>
                                <p className="max-w-xl text-base text-[#5a5a55] dark:text-[#a1a1a1]">
                                    forma+ regroupe vos étudiants, enseignants,
                                    classes, emplois du temps, paiements et
                                    dépenses dans une seule application claire
                                    et rapide.
                                </p>
                                <div className="flex flex-wrap items-center gap-3">
                                    {auth.user ? (
                                        <Link
                                            href={dashboard()}
                                            className="inline-flex items-center justify-center rounded-md bg-[#1b1b18] px-5 py-2.5 text-sm font-medium text-white hover:bg-black dark:bg-[#EDEDEC] dark:text-[#1b1b18] dark:hover:bg-white"
                                        >
                                            Aller au tableau de bord
                                        </Link>
                                    ) : (
                                        <Link
                                            href={login()}
                                            className="inline-flex items-center justify-center rounded-md bg-[#1b1b18] px-5 py-2.5 text-sm font-medium text-white hover:bg-black dark:bg-[#EDEDEC] dark:text-[#1b1b18] dark:hover:bg-white"
                                        >
                                            Se connecter
                                        </Link>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    {
                                        title: 'Étudiants',
                                        desc: 'Inscriptions, niveaux et groupes.',
                                    },
                                    {
                                        title: 'Enseignants',
                                        desc: 'Salaires et matières assignées.',
                                    },
                                    {
                                        title: 'Emploi du temps',
                                        desc: 'Sessions et créneaux horaires.',
                                    },
                                    {
                                        title: 'Finances',
                                        desc: 'Paiements et dépenses.',
                                    },
                                ].map((item) => (
                                    <div
                                        key={item.title}
                                        className="rounded-lg border border-[#19140014] bg-white p-5 dark:border-[#ffffff14] dark:bg-[#161615]"
                                    >
                                        <h3 className="text-sm font-semibold">
                                            {item.title}
                                        </h3>
                                        <p className="mt-1 text-xs text-[#5a5a55] dark:text-[#a1a1a1]">
                                            {item.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>

                <footer className="border-t border-[#19140014] dark:border-[#ffffff0d]">
                    <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-xs text-[#5a5a55] lg:px-8 dark:text-[#a1a1a1]">
                        <span>© {new Date().getFullYear()} forma+</span>
                    </div>
                </footer>
            </div>
        </>
    );
}
