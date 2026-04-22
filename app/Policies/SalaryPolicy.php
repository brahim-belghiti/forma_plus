<?php

namespace App\Policies;

use App\Models\Salary;
use App\Models\User;

class SalaryPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Salary $salary): bool
    {
        return $user->school_id === $salary->school_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Salary $salary): bool
    {
        return $user->school_id === $salary->school_id;
    }

    public function delete(User $user, Salary $salary): bool
    {
        return $user->school_id === $salary->school_id;
    }
}
