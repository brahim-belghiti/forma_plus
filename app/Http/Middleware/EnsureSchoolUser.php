<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSchoolUser
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->school_id === null) {
            abort(403);
        }

        return $next($request);
    }
}
