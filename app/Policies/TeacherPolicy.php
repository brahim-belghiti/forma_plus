<?php

namespace App\Policies;

use App\Models\Teacher;
use App\Models\User;

class TeacherPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Teacher $teacher): bool
    {
        return $user->school_id === $teacher->school_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Teacher $teacher): bool
    {
        return $user->school_id === $teacher->school_id;
    }

    public function delete(User $user, Teacher $teacher): bool
    {
        return $user->school_id === $teacher->school_id;
    }
}
