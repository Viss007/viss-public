<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

/**
 * Fire-and-forget client for the local debug-logger (POST JSON to /log).
 * Events are queued; each call flushes immediately so logging does not rely on
 * register_shutdown_function (unreliable with some PHP built-in server / worker setups).
 */
class DebugLogger
{
    /** @var list<array{event: string, details: ?string, duration: ?float}> */
    private static array $queue = [];

    public static function event(string $event, mixed $details = null, ?float $duration = null): void
    {
        $event = trim($event);
        if ($event === '') {
            return;
        }

        self::$queue[] = [
            'event' => $event,
            'details' => self::normalizeDetails($details),
            'duration' => $duration,
        ];

        self::flush();
    }

    private static function normalizeDetails(mixed $details): ?string
    {
        if ($details === null) {
            return null;
        }
        if (is_string($details)) {
            return $details === '' ? null : $details;
        }
        if (is_scalar($details)) {
            return (string) $details;
        }

        $encoded = json_encode($details, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return $encoded === false ? null : $encoded;
    }

    public static function flush(): void
    {
        if (self::$queue === []) {
            return;
        }

        $url = (string) config('services.debug_logger.url');
        $pending = self::$queue;
        self::$queue = [];

        foreach ($pending as $row) {
            try {
                $payload = ['event' => $row['event']];
                if ($row['details'] !== null) {
                    $payload['details'] = $row['details'];
                }
                if ($row['duration'] !== null) {
                    $payload['duration'] = $row['duration'];
                }

                Http::withOptions([
                    'connect_timeout' => 0.05,
                    'timeout' => 0.1,
                ])
                    ->asJson()
                    ->post($url, $payload);
            } catch (\Throwable) {
                // Logger is optional; never break the app.
            }
        }
    }
}
