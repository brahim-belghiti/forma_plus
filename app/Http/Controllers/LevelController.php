<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLevelRequest;
use App\Http\Requests\UpdateLevelRequest;
use App\Http\Resources\LevelResource;
use App\Models\Level;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class LevelController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', Level::class);

        return Inertia::render('levels/index', [
            'levels' => LevelResource::collection(
                Level::withCount('subjects')->orderBy('name')->get()
            ),
        ]);
    }

    public function store(StoreLevelRequest $request): RedirectResponse
    {
        Level::create($request->validated());

        return back();
    }

    public function update(UpdateLevelRequest $request, Level $level): RedirectResponse
    {
        $level->update($request->validated());

        return back();
    }

    public function destroy(Level $level): RedirectResponse
    {
        $this->authorize('delete', $level);

        $level->delete();

        return back();
    }
}
