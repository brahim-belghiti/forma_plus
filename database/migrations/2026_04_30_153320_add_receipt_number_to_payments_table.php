<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->ulid('receipt_number')->nullable()->unique()->after('id');
        });

        DB::table('payments')->whereNull('receipt_number')->orderBy('id')->each(function ($row) {
            DB::table('payments')->where('id', $row->id)->update([
                'receipt_number' => (string) Str::ulid(),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['receipt_number']);
            $table->dropColumn('receipt_number');
        });
    }
};
