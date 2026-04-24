<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('timeslots', function (Blueprint $table) {
            $table->dropConstrainedForeignId('teacher_id');
            $table->dropConstrainedForeignId('subject_id');
            $table->dropConstrainedForeignId('level_id');
            $table->foreignId('group_id')->after('school_id')->constrained()->cascadeOnDelete();

            $table->index(['group_id', 'day_of_week']);
        });
    }

    public function down(): void
    {
        Schema::table('timeslots', function (Blueprint $table) {
            $table->dropIndex(['group_id', 'day_of_week']);
            $table->dropConstrainedForeignId('group_id');
            $table->foreignId('teacher_id')->after('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->after('teacher_id')->constrained()->cascadeOnDelete();
            $table->foreignId('level_id')->after('subject_id')->constrained()->cascadeOnDelete();
        });
    }
};
