<?php

namespace App\Policies;

use App\Models\Enrollment;
use App\Models\User;

class EnrollmentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Enrollment $enrollment): bool
    {
        return $user->school_id === $enrollment->school_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Enrollment $enrollment): bool
    {
        return $user->school_id === $enrollment->school_id;
    }

    public function delete(User $user, Enrollment $enrollment): bool
    {
        return $user->school_id === $enrollment->school_id;
    }
}
