<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Database\Factories\LevelFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['name', 'school_id'])]
class Level extends Model
{
    /** @use HasFactory<LevelFactory> */
    use BelongsToSchool, HasFactory;

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class);
    }
}
