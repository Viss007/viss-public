<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Logs every web request/response when config('logging.verbose_http') is true.
 * Intended for local debugging (terminal scroll via stderr channel).
 */
class VerboseHttpLog
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('logging.verbose_http')) {
            return $next($request);
        }

        $requestId = (string) Str::uuid();
        $request->attributes->set('verbose_request_id', $requestId);

        $started = microtime(true);

        Log::debug('[HTTP] >>> incoming', [
            'id' => $requestId,
            'method' => $request->method(),
            'full_url' => $request->fullUrl(),
            'path' => $request->path(),
            'route' => $request->route()?->getName(),
            'action' => $request->route()?->getActionName(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'query' => $request->query->all(),
            'input' => $this->sanitizeInput($request->all()),
            'content_type' => $request->header('Content-Type'),
        ]);

        $response = $next($request);

        $ms = round((microtime(true) - $started) * 1000, 2);

        Log::debug('[HTTP] <<< response', [
            'id' => $requestId,
            'status' => $response->getStatusCode(),
            'ms' => $ms,
        ]);

        return $response;
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array<string, mixed>
     */
    private function sanitizeInput(array $input): array
    {
        foreach (['password', 'password_confirmation', 'current_password'] as $key) {
            if (array_key_exists($key, $input)) {
                $input[$key] = '***';
            }
        }
        if (array_key_exists('_token', $input)) {
            $input['_token'] = '[csrf]';
        }

        return $input;
    }
}
