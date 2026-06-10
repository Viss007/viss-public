<?php

declare(strict_types=1);

/**
 * Laravel stdio worker — no HTTP listen port. Node sends one JSON line per request on STDIN.
 */
$base = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'website-templates';
chdir($base);

require $base . '/vendor/autoload.php';

/** @var \Illuminate\Foundation\Application $app */
$app = require_once $base . '/bootstrap/app.php';
/** @var \Illuminate\Contracts\Http\Kernel $kernel */
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

fwrite(STDERR, "[laravel-stdio] ready\n");

while (($line = fgets(STDIN)) !== false) {
    $line = trim($line);
    if ($line === '') {
        continue;
    }

    $payload = json_decode($line, true);
    if (! is_array($payload)) {
        echo json_encode(['id' => null, 'error' => 'invalid_json'])."\n";
        continue;
    }

    $id = $payload['id'] ?? null;

    try {
        $method = strtoupper((string) ($payload['method'] ?? 'GET'));
        $uri = (string) ($payload['url'] ?? '/');
        $headers = is_array($payload['headers'] ?? null) ? $payload['headers'] : [];
        $cookies = is_array($payload['cookies'] ?? null) ? $payload['cookies'] : [];
        $body = (string) ($payload['body'] ?? '');

        $server = [
            'REQUEST_METHOD' => $method,
            'REQUEST_URI' => $uri,
            'SERVER_NAME' => '127.0.0.1',
            'SERVER_PORT' => '3333',
            'HTTP_HOST' => '127.0.0.1:3333',
            'SERVER_PROTOCOL' => 'HTTP/1.1',
            'REMOTE_ADDR' => '127.0.0.1',
        ];

        foreach ($headers as $name => $value) {
            if (! is_string($name) || ! is_string($value)) {
                continue;
            }
            $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
            $server[$key] = $value;
        }

        if (isset($headers['content-type'])) {
            $server['CONTENT_TYPE'] = $headers['content-type'];
        }
        if ($body !== '') {
            $server['CONTENT_LENGTH'] = (string) strlen($body);
        }

        $request = Illuminate\Http\Request::create($uri, $method, [], $cookies, [], $server, $body);
        $response = $kernel->handle($request);

        $outHeaders = [];
        foreach ($response->headers->allPreserveCaseWithoutCookies() as $name => $values) {
            $outHeaders[$name] = implode(', ', $values);
        }
        foreach ($response->headers->getCookies() as $cookie) {
            if (! isset($outHeaders['set-cookie'])) {
                $outHeaders['set-cookie'] = [];
            }
            $outHeaders['set-cookie'][] = (string) $cookie;
        }

        echo json_encode([
            'id' => $id,
            'status' => $response->getStatusCode(),
            'headers' => $outHeaders,
            'body' => base64_encode($response->getContent()),
        ], JSON_UNESCAPED_SLASHES)."\n";

        $kernel->terminate($request, $response);
    } catch (Throwable $e) {
        echo json_encode([
            'id' => $id,
            'error' => $e->getMessage(),
            'status' => 500,
            'headers' => ['Content-Type' => 'text/plain; charset=utf-8'],
            'body' => base64_encode('Laravel worker error'),
        ])."\n";
    }
}
