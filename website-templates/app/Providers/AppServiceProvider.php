<?php

namespace App\Providers;

use App\Services\DebugLogger;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

use function Livewire\on;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (! class_exists('DebugLogger', false)) {
            class_alias(DebugLogger::class, 'DebugLogger');
        }

        on('exception', function ($component, \Throwable $e, callable $stopPropagation): void {
            if (! is_object($component) || ! str_starts_with($component::class, 'App\\Livewire\\')) {
                return;
            }
            DebugLogger::event('error.occurred', $e->getMessage());
        });

        Paginator::useTailwind();

        if (config('logging.verbose_db')) {
            DB::listen(function ($query): void {
                Log::debug('[SQL]', [
                    'sql' => $query->sql,
                    'bindings' => $query->bindings,
                    'time_ms' => $query->time,
                ]);
            });
        }
    }
}
