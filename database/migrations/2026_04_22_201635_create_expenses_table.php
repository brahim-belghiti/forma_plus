<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->string('description');
            $table->decimal('amount', 10, 2);
            $table->date('spent_at');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['school_id', 'spent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
