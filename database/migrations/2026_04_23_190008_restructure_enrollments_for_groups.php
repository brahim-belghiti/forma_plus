<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('teacher_id');
            $table->dropConstrainedForeignId('subject_id');
            $table->foreignId('group_id')->after('student_id')->constrained()->cascadeOnDelete();

            $table->index(['group_id', 'active']);
        });
    }

    public function down(): void
    {
        Schema::table('enrollments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('group_id');
            $table->foreignId('teacher_id')->after('student_id')->constrained()->cascadeOnDelete();
            $table->foreignId('subject_id')->after('teacher_id')->constrained()->cascadeOnDelete();
        });
    }
};
