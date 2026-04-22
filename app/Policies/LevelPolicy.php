<?php

namespace App\Policies;

use App\Models\Level;
use App\Models\User;

class LevelPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Level $level): bool
    {
        return $user->school_id === $level->school_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Level $level): bool
    {
        return $user->school_id === $level->school_id;
    }

    public function delete(User $user, Level $level): bool
    {
        return $user->school_id === $level->school_id;
    }
}
