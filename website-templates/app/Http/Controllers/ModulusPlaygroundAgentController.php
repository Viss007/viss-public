<?php

namespace App\Http\Controllers;

use Illuminate\Http\Response;

final class ModulusPlaygroundAgentController extends Controller
{
    public function dashboard(): Response
    {
        if (! session('modulus_site_admin')) {
            abort(403);
        }

        $path = public_path('agent/voice-dashboard.html');
        if (! is_file($path)) {
            abort(500, 'Unable to load agent dashboard.');
        }

        $html = file_get_contents($path);
        if ($html === false) {
            abort(500, 'Unable to load agent dashboard.');
        }

        $html = str_replace('__LARAVEL_CSRF_TOKEN__', csrf_token(), $html);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Cache-Control' => 'no-store',
        ]);
    }
}
