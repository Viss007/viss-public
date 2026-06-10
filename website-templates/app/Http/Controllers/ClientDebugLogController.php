<?php

namespace App\Http\Controllers;

use App\Services\DebugLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Same-origin sink for browser errors so they reach the local debug-logger via DebugLogger (PHP POST /log).
 */
class ClientDebugLogController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'kind' => 'required|string|max:64',
            'message' => 'nullable|string|max:65535',
            'filename' => 'nullable|string|max:2048',
            'lineno' => 'nullable|integer',
            'colno' => 'nullable|integer',
            'stack' => 'nullable|string|max:65535',
        ]);

        $kind = (string) $data['kind'];
        $payload = array_filter([
            'message' => $data['message'] ?? null,
            'filename' => $data['filename'] ?? null,
            'lineno' => $data['lineno'] ?? null,
            'colno' => $data['colno'] ?? null,
            'stack' => $data['stack'] ?? null,
            'path' => $request->path(),
        ], static fn ($v) => $v !== null && $v !== '');

        DebugLogger::event('client.'.$kind, $payload === [] ? null : $payload);

        return response()->json(['ok' => true]);
    }
}
