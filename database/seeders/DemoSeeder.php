<?php

namespace Database\Seeders;

use App\Enums\DayOfWeek;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\ClassSession;
use App\Models\Enrollment;
use App\Models\Expense;
use App\Models\Group;
use App\Models\Level;
use App\Models\Payment;
use App\Models\Salary;
use App\Models\School;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\Timeslot;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class DemoSeeder extends Seeder
{
    /** @var array<string, Level> */
    private array $levels = [];

    /** @var array<string, array<string, Subject>> */
    private array $subjects = [];

    /** @var array<string, array<string, array<int, string>>> */
    private array $teacherPlans = [];

    private School $school;

    public function run(): void
    {
        $this->school = School::first() ?? School::factory()->create(['name' => 'Forma+']);

        $this->seedLevels();
        $this->seedSubjects();
        $teachers = $this->seedTeachers();
        $classrooms = $this->seedClassrooms();
        $students = $this->seedStudents();
        $groups = $this->seedGroups($teachers);
        $enrollments = $this->seedEnrollments($students, $groups);
        $this->seedTimeslots($groups, $classrooms);
        $this->seedPayments($enrollments);
        $sessions = $this->seedClassSessions($groups);
        $this->seedAttendances($sessions, $enrollments);
        $this->seedSalaries($teachers);
        $this->seedExpenses();
    }

    private function seedLevels(): void
    {
        $names = [
            'Primaire 1', 'Primaire 2', 'Primaire 3', 'Primaire 4', 'Primaire 5', 'Primaire 6',
            '1AC', '2AC', '3AC',
            'Tronc Commun',
            '1BAC PC', '1BAC Sc Maths', '1BAC SVT',
            '2BAC PC', '2BAC Sc Maths', '2BAC SVT',
        ];

        foreach ($names as $name) {
            $this->levels[$name] = Level::create([
                'school_id' => $this->school->id,
                'name' => $name,
            ]);
        }
    }

    private function seedSubjects(): void
    {
        $primaire = ['Mathématiques', 'Français'];
        $full = ['Mathématiques', 'Physique-Chimie', 'SVT', 'Français', 'Anglais'];

        foreach ($this->levels as $levelName => $level) {
            $subjectNames = str_starts_with($levelName, 'Primaire') ? $primaire : $full;
            foreach ($subjectNames as $subjectName) {
                $this->subjects[$levelName][$subjectName] = Subject::create([
                    'school_id' => $this->school->id,
                    'level_id' => $level->id,
                    'name' => $subjectName,
                ]);
            }
        }
    }

    /**
     * @return array<string, Teacher>
     */
    private function seedTeachers(): array
    {
        $plans = [
            'ahmed' => [
                'first_name' => 'Ahmed', 'last_name' => 'Alami', 'phone' => '0612000001', 'salary_rate' => 55,
                'teaches' => [
                    'Primaire 4' => ['Mathématiques'],
                    'Primaire 5' => ['Mathématiques'],
                    'Primaire 6' => ['Mathématiques'],
                    '1AC' => ['Mathématiques'],
                    '2AC' => ['Mathématiques'],
                    '3AC' => ['Mathématiques'],
                ],
            ],
            'sara' => [
                'first_name' => 'Sara', 'last_name' => 'Bennani', 'phone' => '0612000002', 'salary_rate' => 60,
                'teaches' => [
                    'Tronc Commun' => ['Mathématiques'],
                    '1BAC PC' => ['Mathématiques'],
                    '2BAC PC' => ['Mathématiques'],
                ],
            ],
            'karim' => [
                'first_name' => 'Karim', 'last_name' => 'El Fassi', 'phone' => '0612000003', 'salary_rate' => 65,
                'teaches' => [
                    '1BAC Sc Maths' => ['Mathématiques'],
                    '2BAC Sc Maths' => ['Mathématiques'],
                    '1BAC SVT' => ['Mathématiques'],
                    '2BAC SVT' => ['Mathématiques'],
                ],
            ],
            'fatima' => [
                'first_name' => 'Fatima', 'last_name' => 'Zahra', 'phone' => '0612000004', 'salary_rate' => 55,
                'teaches' => [
                    '2AC' => ['Physique-Chimie'],
                    '3AC' => ['Physique-Chimie'],
                    'Tronc Commun' => ['Physique-Chimie'],
                    '1BAC PC' => ['Physique-Chimie'],
                    '2BAC PC' => ['Physique-Chimie'],
                    '1BAC Sc Maths' => ['Physique-Chimie'],
                ],
            ],
            'youssef' => [
                'first_name' => 'Youssef', 'last_name' => 'Amrani', 'phone' => '0612000005', 'salary_rate' => 50,
                'teaches' => [
                    '2AC' => ['SVT'],
                    '3AC' => ['SVT'],
                    'Tronc Commun' => ['SVT'],
                    '1BAC SVT' => ['SVT'],
                    '2BAC SVT' => ['SVT'],
                ],
            ],
            'leila' => [
                'first_name' => 'Leila', 'last_name' => 'Chraibi', 'phone' => '0612000006', 'salary_rate' => 50,
                'teaches' => [
                    'Primaire 3' => ['Français'],
                    'Primaire 5' => ['Français'],
                    '1AC' => ['Français', 'Anglais'],
                    '2AC' => ['Anglais'],
                    '3AC' => ['Anglais'],
                    'Tronc Commun' => ['Anglais'],
                ],
            ],
        ];

        $teachers = [];
        foreach ($plans as $key => $plan) {
            $teacher = Teacher::create([
                'school_id' => $this->school->id,
                'first_name' => $plan['first_name'],
                'last_name' => $plan['last_name'],
                'phone' => $plan['phone'],
                'salary_rate' => $plan['salary_rate'],
            ]);

            $subjectIds = [];
            foreach ($plan['teaches'] as $levelName => $subjectNames) {
                foreach ($subjectNames as $subjectName) {
                    $subjectIds[] = $this->subjects[$levelName][$subjectName]->id;
                }
            }
            $teacher->subjects()->sync(array_unique($subjectIds));

            $this->teacherPlans[$key] = $plan['teaches'];
            $teachers[$key] = $teacher;
        }

        return $teachers;
    }

    /**
     * @return array<int, Classroom>
     */
    private function seedClassrooms(): array
    {
        return collect(['Salle A', 'Salle B', 'Salle C', 'Salle D', 'Salle E'])
            ->map(fn ($name) => Classroom::create([
                'school_id' => $this->school->id,
                'name' => $name,
            ]))
            ->all();
    }

    /**
     * @return array<string, array<int, Student>>
     */
    private function seedStudents(): array
    {
        $firstNames = ['Amine', 'Youssef', 'Mehdi', 'Omar', 'Hamza', 'Anas', 'Ilyas', 'Rachid', 'Said', 'Hicham', 'Adam', 'Nizar', 'Walid', 'Badr', 'Zakaria', 'Salma', 'Imane', 'Houda', 'Nadia', 'Khadija', 'Zineb', 'Aicha', 'Rania', 'Amina', 'Chaimae', 'Dounia', 'Asma', 'Meryem', 'Oumaima', 'Yasmine'];
        $lastNames = ['Alami', 'Bennani', 'El Fassi', 'Benjelloun', 'Chraibi', 'Tazi', 'Amrani', 'Lahlou', 'Belhaj', 'Kettani', 'Berrada', 'Sefrioui', 'Idrissi', 'Slaoui', 'Benkirane', 'Zaki', 'El Malki', 'Hajji', 'Fassi', 'Nadir'];

        $distribution = [
            'Primaire 1' => 3, 'Primaire 2' => 3, 'Primaire 3' => 3, 'Primaire 4' => 3, 'Primaire 5' => 3, 'Primaire 6' => 3,
            '1AC' => 8, '2AC' => 8, '3AC' => 8,
            'Tronc Commun' => 10,
            '1BAC PC' => 8, '1BAC Sc Maths' => 6, '1BAC SVT' => 7,
            '2BAC PC' => 10, '2BAC Sc Maths' => 10, '2BAC SVT' => 10,
        ];

        $students = [];
        foreach ($distribution as $levelName => $count) {
            $students[$levelName] = [];
            for ($i = 0; $i < $count; $i++) {
                $first = Arr::random($firstNames);
                $last = Arr::random($lastNames);
                $students[$levelName][] = Student::create([
                    'school_id' => $this->school->id,
                    'level_id' => $this->levels[$levelName]->id,
                    'first_name' => $first,
                    'last_name' => $last,
                    'phone' => '06'.fake()->numerify('########'),
                    'guardian_name' => Arr::random($firstNames).' '.$last,
                    'guardian_phone' => '06'.fake()->numerify('########'),
                ]);
            }
        }

        return $students;
    }

    /**
     * @param  array<string, Teacher>  $teachers
     * @return array<int, Group>
     */
    private function seedGroups(array $teachers): array
    {
        $groups = [];
        $levelAbbrev = [
            'Primaire 1' => 'P1', 'Primaire 2' => 'P2', 'Primaire 3' => 'P3',
            'Primaire 4' => 'P4', 'Primaire 5' => 'P5', 'Primaire 6' => 'P6',
            '1AC' => '1AC', '2AC' => '2AC', '3AC' => '3AC',
            'Tronc Commun' => 'TC',
            '1BAC PC' => '1BAC-PC', '1BAC Sc Maths' => '1BAC-SM', '1BAC SVT' => '1BAC-SVT',
            '2BAC PC' => '2BAC-PC', '2BAC Sc Maths' => '2BAC-SM', '2BAC SVT' => '2BAC-SVT',
        ];
        $subjectAbbrev = [
            'Mathématiques' => 'Math',
            'Physique-Chimie' => 'PC',
            'SVT' => 'SVT',
            'Français' => 'Fr',
            'Anglais' => 'En',
        ];
        $feeBySubject = [
            'Mathématiques' => 350,
            'Physique-Chimie' => 300,
            'SVT' => 280,
            'Français' => 250,
            'Anglais' => 250,
        ];

        foreach ($teachers as $key => $teacher) {
            foreach ($this->teacherPlans[$key] as $levelName => $subjectNames) {
                foreach ($subjectNames as $subjectName) {
                    $subject = $this->subjects[$levelName][$subjectName];
                    $name = $levelAbbrev[$levelName].'-'.$subjectAbbrev[$subjectName];
                    $groups[] = Group::create([
                        'school_id' => $this->school->id,
                        'subject_id' => $subject->id,
                        'teacher_id' => $teacher->id,
                        'name' => $name,
                        'default_monthly_fee' => $feeBySubject[$subjectName],
                        'active' => true,
                    ]);
                }
            }
        }

        return $groups;
    }

    /**
     * @param  array<string, array<int, Student>>  $studentsByLevel
     * @param  array<int, Group>  $groups
     * @return array<int, Enrollment>
     */
    private function seedEnrollments(array $studentsByLevel, array $groups): array
    {
        $groupsByLevelId = [];
        foreach ($groups as $group) {
            $levelId = $group->subject->level_id;
            $groupsByLevelId[$levelId][] = $group;
        }

        $startChoices = ['-5 months', '-4 months', '-3 months'];
        $enrollments = [];

        foreach ($studentsByLevel as $levelName => $students) {
            $levelId = $this->levels[$levelName]->id;
            $availableGroups = $groupsByLevelId[$levelId] ?? [];
            if (empty($availableGroups)) {
                continue;
            }

            foreach ($students as $student) {
                $take = min(count($availableGroups), random_int(1, min(3, count($availableGroups))));
                $picked = Arr::random($availableGroups, $take);
                $picked = is_array($picked) ? $picked : [$picked];

                foreach ($picked as $group) {
                    $baseFee = (float) ($group->default_monthly_fee ?? 300);
                    $fee = $baseFee + random_int(-50, 50);

                    $startDate = CarbonImmutable::parse(Arr::random($startChoices))->startOfMonth();

                    $enrollments[] = Enrollment::create([
                        'school_id' => $this->school->id,
                        'student_id' => $student->id,
                        'group_id' => $group->id,
                        'monthly_fee' => $fee,
                        'start_date' => $startDate->toDateString(),
                        'active' => true,
                    ]);
                }
            }
        }

        return $enrollments;
    }

    /**
     * @param  array<int, Group>  $groups
     * @param  array<int, Classroom>  $classrooms
     */
    private function seedTimeslots(array $groups, array $classrooms): void
    {
        $slotTemplates = [
            ['start' => '15:00', 'end' => '16:30'],
            ['start' => '16:30', 'end' => '18:00'],
            ['start' => '18:00', 'end' => '19:30'],
            ['start' => '19:30', 'end' => '21:00'],
        ];
        $weekdays = [DayOfWeek::Monday, DayOfWeek::Tuesday, DayOfWeek::Wednesday, DayOfWeek::Thursday, DayOfWeek::Friday, DayOfWeek::Saturday];

        $bookedByClassroomDay = [];
        $bookedByTeacherDay = [];

        $overlaps = static function (string $aStart, string $aEnd, array $existing): bool {
            foreach ($existing as [$start, $end]) {
                if ($aStart < $end && $aEnd > $start) {
                    return true;
                }
            }

            return false;
        };

        foreach ($groups as $group) {
            $usedDays = [];
            $placed = 0;
            $candidates = [];

            foreach ($weekdays as $day) {
                foreach ($slotTemplates as $tpl) {
                    foreach ($classrooms as $classroom) {
                        $candidates[] = ['day' => $day, 'tpl' => $tpl, 'classroom' => $classroom];
                    }
                }
            }

            shuffle($candidates);

            foreach ($candidates as $pick) {
                if ($placed >= 2) {
                    break;
                }

                if (isset($usedDays[$pick['day']->value])) {
                    continue;
                }

                $classroomKey = $pick['day']->value.'|'.$pick['classroom']->id;
                $teacherKey = $pick['day']->value.'|'.$group->teacher_id;

                if ($overlaps($pick['tpl']['start'], $pick['tpl']['end'], $bookedByClassroomDay[$classroomKey] ?? [])) {
                    continue;
                }

                if ($overlaps($pick['tpl']['start'], $pick['tpl']['end'], $bookedByTeacherDay[$teacherKey] ?? [])) {
                    continue;
                }

                Timeslot::create([
                    'school_id' => $this->school->id,
                    'group_id' => $group->id,
                    'classroom_id' => $pick['classroom']->id,
                    'day_of_week' => $pick['day']->value,
                    'start_time' => $pick['tpl']['start'],
                    'end_time' => $pick['tpl']['end'],
                ]);

                $bookedByClassroomDay[$classroomKey][] = [$pick['tpl']['start'], $pick['tpl']['end']];
                $bookedByTeacherDay[$teacherKey][] = [$pick['tpl']['start'], $pick['tpl']['end']];
                $usedDays[$pick['day']->value] = true;
                $placed++;
            }
        }
    }

    /**
     * @param  array<int, Enrollment>  $enrollments
     */
    private function seedPayments(array $enrollments): void
    {
        $now = CarbonImmutable::now()->startOfMonth();

        foreach ($enrollments as $enrollment) {
            $start = CarbonImmutable::parse($enrollment->start_date)->startOfMonth();
            $cursor = $start;

            while ($cursor->lessThanOrEqualTo($now)) {
                $leaveUnpaid = random_int(1, 100) <= 25;
                if (! $leaveUnpaid) {
                    Payment::create([
                        'school_id' => $this->school->id,
                        'enrollment_id' => $enrollment->id,
                        'amount' => (float) $enrollment->monthly_fee,
                        'period_month' => $cursor->month,
                        'period_year' => $cursor->year,
                        'paid_at' => $cursor->addDays(random_int(1, 20))->toDateString(),
                        'notes' => null,
                    ]);
                }
                $cursor = $cursor->addMonth();
            }
        }
    }

    /**
     * @param  array<int, Group>  $groups
     * @return array<int, ClassSession>
     */
    private function seedClassSessions(array $groups): array
    {
        $today = CarbonImmutable::now()->startOfDay();
        $sessions = [];

        foreach ($groups as $group) {
            $dates = [];
            for ($weeksAgo = 1; $weeksAgo <= 6; $weeksAgo++) {
                $dates[] = $today->subWeeks($weeksAgo)->subDays(random_int(0, 2))->toDateString();
            }
            $dates = array_unique($dates);

            foreach ($dates as $date) {
                $sessions[] = ClassSession::create([
                    'school_id' => $this->school->id,
                    'group_id' => $group->id,
                    'date' => $date,
                    'teacher_present' => random_int(1, 100) <= 95,
                    'notes' => null,
                ]);
            }
        }

        return $sessions;
    }

    /**
     * @param  array<int, ClassSession>  $sessions
     * @param  array<int, Enrollment>  $enrollments
     */
    private function seedAttendances(array $sessions, array $enrollments): void
    {
        $enrollmentsByGroup = [];
        foreach ($enrollments as $enrollment) {
            $enrollmentsByGroup[$enrollment->group_id][] = $enrollment;
        }

        foreach ($sessions as $session) {
            if (! $session->teacher_present) {
                continue;
            }

            $groupEnrollments = $enrollmentsByGroup[$session->group_id] ?? [];
            foreach ($groupEnrollments as $enrollment) {
                if ($enrollment->start_date->gt($session->date)) {
                    continue;
                }

                Attendance::create([
                    'class_session_id' => $session->id,
                    'student_id' => $enrollment->student_id,
                    'present' => random_int(1, 100) <= 85,
                    'notes' => null,
                ]);
            }
        }
    }

    /**
     * @param  array<string, Teacher>  $teachers
     */
    private function seedSalaries(array $teachers): void
    {
        $now = CarbonImmutable::now()->startOfMonth();

        foreach ($teachers as $teacher) {
            for ($monthsAgo = 2; $monthsAgo <= 3; $monthsAgo++) {
                $period = $now->subMonths($monthsAgo);
                $amount = random_int(2500, 6000);

                Salary::create([
                    'school_id' => $this->school->id,
                    'teacher_id' => $teacher->id,
                    'amount' => $amount,
                    'period_month' => $period->month,
                    'period_year' => $period->year,
                    'paid_at' => $period->endOfMonth()->toDateString(),
                    'notes' => null,
                ]);
            }
        }
    }

    private function seedExpenses(): void
    {
        $categories = [
            ['Loyer du local', 3500],
            ['Facture d\'électricité', 450],
            ['Facture d\'eau', 180],
            ['Facture internet', 300],
            ['Fournitures de bureau', 220],
            ['Entretien', 150],
            ['Photocopies', 180],
            ['Publicité', 400],
            ['Réparation matériel', 250],
            ['Divers', 120],
        ];

        $now = CarbonImmutable::now();
        foreach ($categories as [$desc, $amount]) {
            Expense::create([
                'school_id' => $this->school->id,
                'description' => $desc,
                'amount' => $amount,
                'spent_at' => $now->subDays(random_int(1, 60))->toDateString(),
                'notes' => null,
            ]);
        }
    }
}
