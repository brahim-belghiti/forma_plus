<?php

namespace App\Policies;

use App\Models\ClassSession;
use App\Models\User;

class ClassSessionPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, ClassSession $classSession): bool
    {
        return $user->school_id === $classSession->school_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, ClassSession $classSession): bool
    {
        return $user->school_id === $classSession->school_id;
    }

    public function delete(User $user, ClassSession $classSession): bool
    {
        return $user->school_id === $classSession->school_id;
    }
}
