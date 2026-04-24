<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('student_id');
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('enrollment_id')->after('school_id')->constrained()->cascadeOnDelete();
            $table->unique(['enrollment_id', 'period_year', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['enrollment_id', 'period_year', 'period_month']);
            $table->dropConstrainedForeignId('enrollment_id');
            $table->foreignId('student_id')->after('school_id')->constrained()->cascadeOnDelete();
            $table->index(['student_id', 'period_year', 'period_month']);
        });
    }
};
