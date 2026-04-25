<?php

namespace Database\Factories;

use App\Models\Attendance;
use App\Models\ClassSession;
use App\Models\Student;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Attendance>
 */
class AttendanceFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'class_session_id' => ClassSession::factory(),
            'student_id' => Student::factory(),
            'present' => true,
            'notes' => null,
        ];
    }
}
