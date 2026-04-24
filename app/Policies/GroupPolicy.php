<?php

namespace App\Policies;

use App\Models\Group;
use App\Models\User;

class GroupPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Group $group): bool
    {
        return $user->school_id === $group->school_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Group $group): bool
    {
        return $user->school_id === $group->school_id;
    }

    public function delete(User $user, Group $group): bool
    {
        return $user->school_id === $group->school_id;
    }
}
