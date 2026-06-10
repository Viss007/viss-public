<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Expose ChatGPT MCP on the Public :3333 origin (operator-facing one runtime).
 * Loopback Node listener stays internal; buyers and Custom GPT use /automations/* only.
 */
class ChatgptMcpProxyController extends Controller
{
    private function internalBase(): string
    {
        return rtrim((string) config('vissai.chatgpt_mcp_internal_url', 'http://127.0.0.1:2091'), '/');
    }

    /** @return list<string> */
    private function hopByHop(): array
    {
        return [
            'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
            'te', 'trailers', 'transfer-encoding', 'upgrade',
        ];
    }

    /** @return array<string, string> */
    private function forwardHeaders(Request $request): array
    {
        $out = [];
        foreach ($request->headers->all() as $key => $values) {
            $lower = strtolower($key);
            if (in_array($lower, ['host', 'content-length'], true)) {
                continue;
            }
            if (in_array($lower, $this->hopByHop(), true)) {
                continue;
            }
            $out[$key] = is_array($values) ? (string) ($values[0] ?? '') : (string) $values;
        }

        return $out;
    }

    public function health(): \Illuminate\Http\JsonResponse
    {
        try {
            $res = Http::timeout(5)->get($this->internalBase().'/health');
            $decoded = json_decode($res->body(), true);
            if (! is_array($decoded)) {
                return response()->json(['ok' => false, 'error' => 'chatgpt_mcp_bad_health'], $res->status() ?: 502);
            }
            if ($res->successful()) {
                $decoded['publicOrigin'] = rtrim((string) config('vissai.portfolio_url'), '/');
                $decoded['publicMcpPath'] = '/automations/mcp';
                $decoded['publicHealthPath'] = '/automations/health';
            }

            return response()->json($decoded, $res->status());
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'error' => 'chatgpt_mcp_unavailable',
                'message' => $e->getMessage(),
                'publicMcpPath' => '/automations/mcp',
            ], 503);
        }
    }

    public function forward(Request $request, string $internalPath): StreamedResponse|\Illuminate\Http\JsonResponse
    {
        $path = trim($internalPath, '/');
        $url = $this->internalBase().($path !== '' ? '/'.$path : '');
        $query = $request->getQueryString();
        if (is_string($query) && $query !== '') {
            $url .= '?'.$query;
        }

        try {
            $pending = Http::withHeaders($this->forwardHeaders($request))
                ->withBody($request->getContent())
                ->withOptions(['stream' => true, 'read_timeout' => 120]);

            $client = $pending->send($request->method(), $url);
            $psr = $client->toPsrResponse();
            $status = $psr->getStatusCode();
            $respHeaders = [];
            foreach ($psr->getHeaders() as $name => $values) {
                if (in_array(strtolower($name), $this->hopByHop(), true)) {
                    continue;
                }
                $respHeaders[$name] = $values;
            }

            return new StreamedResponse(function () use ($psr) {
                $body = $psr->getBody();
                while (! $body->eof()) {
                    echo $body->read(8192);
                    if (function_exists('flush')) {
                        flush();
                    }
                }
            }, $status, $respHeaders);
        } catch (\Throwable $e) {
            return response()->json([
                'ok' => false,
                'error' => 'chatgpt_mcp_proxy_failed',
                'message' => $e->getMessage(),
                'publicMcpPath' => '/automations/mcp',
            ], 502);
        }
    }
}
