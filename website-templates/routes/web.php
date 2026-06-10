<?php

use App\Http\Controllers\ChatgptMcpProxyController;
use App\Http\Controllers\DocsAgentProxyController;
use App\Http\Controllers\SpeedToLeadProxyController;
use App\Http\Controllers\ClientDebugLogController;
use App\Http\Controllers\ModulusPlaygroundAgentController;
use App\Http\Controllers\ModulusPlaygroundAuthController;
use App\Http\Controllers\ModulusPlaygroundBookingController;
use App\Http\Controllers\ModulusPlaygroundReachOutController;
use App\Livewire\TemplatePlayground;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect('/about'));

Route::get('/about', fn () => response()->file(public_path('about.html')));
Route::get('/media', fn () => response()->file(public_path('media.html')));

Route::redirect('/websites.html', '/websites');

Route::get('/websites', TemplatePlayground::class)->name('playground.home');

Route::get('/websites/modulus/{page}', TemplatePlayground::class)
    ->where('page', 'about|process|gallery|pricing|reach-out|booking|admin|privacy|terms|cookies')
    ->name('playground.modulus.page');

Route::get('/websites/{template}', TemplatePlayground::class)
    ->where('template', implode('|', TemplatePlayground::selectableTemplateSlugs()))
    ->name('playground.template');

Route::post('/debug-client-log', [ClientDebugLogController::class, 'store'])->name('debug.client');

Route::post('/playground/modulus/site-admin-login', [ModulusPlaygroundAuthController::class, 'login'])
    ->name('playground.modulus.login');

Route::post('/playground/modulus/site-admin-logout', [ModulusPlaygroundAuthController::class, 'logout'])
    ->name('playground.modulus.logout');

Route::post('/playground/modulus/reach-out', [ModulusPlaygroundReachOutController::class, 'submit'])
    ->name('playground.modulus.reach_out.submit');

Route::get('/playground/modulus/agent-panel', [ModulusPlaygroundAgentController::class, 'dashboard'])
    ->name('playground.modulus.agent.dashboard');

Route::get('/api/bookings', [ModulusPlaygroundBookingController::class, 'index']);
Route::post('/api/bookings', [ModulusPlaygroundBookingController::class, 'store']);

$mcp = ChatgptMcpProxyController::class;
Route::get('/automations/health', [$mcp, 'health']);
Route::any('/automations/mcp', fn (\Illuminate\Http\Request $request) => app($mcp)->forward($request, 'mcp'));
Route::any('/automations/sse', fn (\Illuminate\Http\Request $request) => app($mcp)->forward($request, 'sse'));
Route::any('/automations/messages', fn (\Illuminate\Http\Request $request) => app($mcp)->forward($request, 'messages'));
Route::post('/automations/process-lead', fn (\Illuminate\Http\Request $request) => app($mcp)->forward($request, 'process-lead'));
Route::any('/automations/auth/{path?}', fn (\Illuminate\Http\Request $request, ?string $path = null) => app($mcp)->forward(
    $request,
    'auth'.($path !== null && $path !== '' ? '/'.$path : '')
))->where('path', '.*');

$stl = SpeedToLeadProxyController::class;
Route::get('/automations/speed-to-lead/health', [$stl, 'health']);
Route::any('/automations/speed-to-lead/{path?}', fn (\Illuminate\Http\Request $request, ?string $path = null) => app($stl)->forward(
    $request,
    $path ?? ''
))->where('path', '.*');

$docs = DocsAgentProxyController::class;
Route::get('/agents/docs-agent/health', [$docs, 'health']);
Route::any('/agents/docs-agent/{path?}', fn (\Illuminate\Http\Request $request, ?string $path = null) => app($docs)->forward(
    $request,
    $path ?? ''
))->where('path', '.*');
