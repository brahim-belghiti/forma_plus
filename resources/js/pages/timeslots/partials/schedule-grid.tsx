import { AlertTriangle } from 'lucide-react';
import type { MouseEvent } from 'react';
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Timeslot } from '@/types';

const HOUR_HEIGHT = 60;
const SNAP_MINUTES = 30;

const COLOR_PALETTE = [
    'bg-sky-100 border-sky-500 text-sky-900 dark:bg-sky-950/60 dark:border-sky-500 dark:text-sky-100',
    'bg-emerald-100 border-emerald-500 text-emerald-900 dark:bg-emerald-950/60 dark:border-emerald-500 dark:text-emerald-100',
    'bg-amber-100 border-amber-500 text-amber-900 dark:bg-amber-950/60 dark:border-amber-500 dark:text-amber-100',
    'bg-violet-100 border-violet-500 text-violet-900 dark:bg-violet-950/60 dark:border-violet-500 dark:text-violet-100',
    'bg-rose-100 border-rose-500 text-rose-900 dark:bg-rose-950/60 dark:border-rose-500 dark:text-rose-100',
    'bg-cyan-100 border-cyan-500 text-cyan-900 dark:bg-cyan-950/60 dark:border-cyan-500 dark:text-cyan-100',
    'bg-lime-100 border-lime-500 text-lime-900 dark:bg-lime-950/60 dark:border-lime-500 dark:text-lime-100',
    'bg-fuchsia-100 border-fuchsia-500 text-fuchsia-900 dark:bg-fuchsia-950/60 dark:border-fuchsia-500 dark:text-fuchsia-100',
];

function colorFor(id: number): string {
    return COLOR_PALETTE[id % COLOR_PALETTE.length];
}

function parseTime(value: string): number {
    const [h, m] = value.split(':').map(Number);

    return h * 60 + m;
}

function formatTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export type ScheduleColumn = {
    key: string | number;
    label: string;
    short: string;
    timeslots: Timeslot[];
    onEmptyClick: (time: string) => void;
};

export type ScheduleGridProps = {
    columns: ScheduleColumn[];
    hourStart: number;
    hourEnd: number;
    conflicts: Set<number>;
    onBlockClick: (timeslot: Timeslot) => void;
    minColumnWidth?: number;
    secondaryLabel?: (timeslot: Timeslot) => string;
};

export function ScheduleGrid({
    columns,
    hourStart,
    hourEnd,
    conflicts,
    onBlockClick,
    minColumnWidth = 140,
    secondaryLabel,
}: ScheduleGridProps) {
    const hours = useMemo(() => {
        const arr: number[] = [];

        for (let h = hourStart; h <= hourEnd; h++) {
            arr.push(h);
        }

        return arr;
    }, [hourStart, hourEnd]);

    const totalHeight = (hourEnd - hourStart) * HOUR_HEIGHT;
    const startMin = hourStart * 60;
    const maxClickMinutes = (hourEnd - hourStart) * 60 - SNAP_MINUTES;

    function handleColumnClick(column: ScheduleColumn, e: MouseEvent<HTMLDivElement>) {
        if ((e.target as HTMLElement).closest('[data-block]')) {
            return;
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const offsetY = e.clientY - rect.top;
        const minutesFromStart = (offsetY / HOUR_HEIGHT) * 60;
        const clamped = Math.max(0, Math.min(minutesFromStart, maxClickMinutes));
        const snapped = Math.round(clamped / SNAP_MINUTES) * SNAP_MINUTES;
        column.onEmptyClick(formatTime(startMin + snapped));
    }

    if (columns.length === 0) {
        return (
            <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
                Aucune colonne à afficher.
            </div>
        );
    }

    return (
        <TooltipProvider>
            <div className="overflow-x-auto rounded-lg border bg-card">
                <div
                    className="grid"
                    style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(${minColumnWidth}px, 1fr))` }}
                >
                    <div className="border-b bg-muted/40" />
                    {columns.map((col) => (
                        <div
                            key={col.key}
                            className="border-b border-l bg-muted/40 px-3 py-2 text-center text-sm font-semibold"
                        >
                            <span className="hidden sm:inline">{col.label}</span>
                            <span className="sm:hidden">{col.short}</span>
                        </div>
                    ))}

                    <div className="relative border-r bg-muted/20" style={{ height: totalHeight }}>
                        {hours.map((h) => (
                            <div
                                key={h}
                                className="absolute right-0 left-0 pr-2 text-right text-xs text-muted-foreground"
                                style={{ top: (h - hourStart) * HOUR_HEIGHT - 6 }}
                            >
                                {String(h).padStart(2, '0')}:00
                            </div>
                        ))}
                    </div>

                    {columns.map((col) => (
                        <div
                            key={col.key}
                            className="relative cursor-pointer border-l hover:bg-muted/10"
                            style={{ height: totalHeight }}
                            onClick={(e) => handleColumnClick(col, e)}
                        >
                            {hours.slice(1).map((h) => (
                                <div
                                    key={h}
                                    className="pointer-events-none absolute right-0 left-0 border-t border-border/60"
                                    style={{ top: (h - hourStart) * HOUR_HEIGHT }}
                                />
                            ))}
                            {hours.slice(0, -1).map((h) => (
                                <div
                                    key={`half-${h}`}
                                    className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-border/30"
                                    style={{ top: (h - hourStart) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                                />
                            ))}
                            {col.timeslots.map((t) => {
                                const start = parseTime(t.start_time);
                                const end = parseTime(t.end_time);
                                const top = ((start - startMin) / 60) * HOUR_HEIGHT;
                                const height = ((end - start) / 60) * HOUR_HEIGHT;
                                const isConflict = conflicts.has(t.id);
                                const sub = secondaryLabel ? secondaryLabel(t) : t.classroom?.name;

                                return (
                                    <Tooltip key={t.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                type="button"
                                                data-block
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onBlockClick(t);
                                                }}
                                                className={cn(
                                                    'absolute right-1 left-1 overflow-hidden rounded-md border-l-4 px-2 py-1 text-left text-xs shadow-sm transition hover:shadow-md hover:brightness-95 dark:hover:brightness-110',
                                                    colorFor(t.group?.subject_id ?? t.group_id),
                                                    isConflict && 'ring-2 ring-destructive ring-offset-1',
                                                )}
                                                style={{ top, height: Math.max(height, 24) }}
                                            >
                                                <div className="flex items-center gap-1 truncate font-semibold leading-tight">
                                                    {isConflict && <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" />}
                                                    <span className="truncate">{t.group?.name}</span>
                                                </div>
                                                <div className="truncate opacity-80">
                                                    {t.start_time.slice(0, 5)}–{t.end_time.slice(0, 5)}
                                                </div>
                                                {height >= 60 && sub && <div className="mt-0.5 truncate opacity-80">{sub}</div>}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right">
                                            <div className="space-y-0.5">
                                                <div className="font-semibold">{t.group?.name}</div>
                                                <div>
                                                    {t.group?.subject?.name}
                                                    {t.group?.subject?.level?.name ? ` · ${t.group.subject.level.name}` : ''}
                                                </div>
                                                <div>{t.group?.teacher?.full_name}</div>
                                                <div>
                                                    {t.classroom?.name} · {t.start_time.slice(0, 5)}–{t.end_time.slice(0, 5)}
                                                </div>
                                                {isConflict && (
                                                    <div className="mt-1 font-semibold text-destructive">Conflit détecté</div>
                                                )}
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </TooltipProvider>
    );
}

export function detectConflicts(timeslots: Timeslot[]): Set<number> {
    const conflicts = new Set<number>();

    for (let i = 0; i < timeslots.length; i++) {
        for (let j = i + 1; j < timeslots.length; j++) {
            const a = timeslots[i];
            const b = timeslots[j];

            if (a.day_of_week !== b.day_of_week) {
                continue;
            }

            const aStart = parseTime(a.start_time);
            const aEnd = parseTime(a.end_time);
            const bStart = parseTime(b.start_time);
            const bEnd = parseTime(b.end_time);

            if (aStart >= bEnd || bStart >= aEnd) {
                continue;
            }

            const sameClassroom = a.classroom_id === b.classroom_id;
            const sameTeacher =
                a.group?.teacher_id !== undefined &&
                b.group?.teacher_id !== undefined &&
                a.group.teacher_id === b.group.teacher_id;

            if (sameClassroom || sameTeacher) {
                conflicts.add(a.id);
                conflicts.add(b.id);
            }
        }
    }

    return conflicts;
}

export function computeHourRange(timeslots: Timeslot[]): { start: number; end: number } {
    let minStart = 8 * 60;
    let maxEnd = 21 * 60;

    for (const t of timeslots) {
        const s = parseTime(t.start_time);
        const e = parseTime(t.end_time);

        if (s < minStart) {
            minStart = s;
        }

        if (e > maxEnd) {
            maxEnd = e;
        }
    }

    const start = Math.max(0, Math.floor(minStart / 60));
    const end = Math.min(24, Math.ceil(maxEnd / 60));

    return { start, end };
}
