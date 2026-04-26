<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $admin, User $secretary): bool
    {
        return $admin->isAdmin()
            && $admin->school_id === $secretary->school_id
            && $secretary->isSecretary();
    }

    public function delete(User $admin, User $secretary): bool
    {
        return $admin->isAdmin()
            && $admin->school_id === $secretary->school_id
            && $secretary->isSecretary();
    }

    public function resetPassword(User $admin, User $secretary): bool
    {
        return $this->update($admin, $secretary);
    }
}
