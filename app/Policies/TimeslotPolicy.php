<?php

namespace App\Policies;

use App\Models\Timeslot;
use App\Models\User;

class TimeslotPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Timeslot $timeslot): bool
    {
        return $user->school_id === $timeslot->school_id;
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Timeslot $timeslot): bool
    {
        return $user->school_id === $timeslot->school_id;
    }

    public function delete(User $user, Timeslot $timeslot): bool
    {
        return $user->school_id === $timeslot->school_id;
    }
}
