<?php

namespace App\Models;

use App\Models\Traits\BelongsToSchool;
use Database\Factories\ClassroomFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'school_id'])]
class Classroom extends Model
{
    /** @use HasFactory<ClassroomFactory> */
    use BelongsToSchool, HasFactory;
}
