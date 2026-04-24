<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('level_id')->after('school_id')->constrained()->cascadeOnDelete();
            $table->unique(['school_id', 'level_id', 'name']);
            $table->dropUnique(['school_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->unique(['school_id', 'name']);
            $table->dropUnique(['school_id', 'level_id', 'name']);
            $table->dropConstrainedForeignId('level_id');
        });
    }
};
