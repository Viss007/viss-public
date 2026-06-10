<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class ModulusPlaygroundAuthController extends Controller
{
    public function login(Request $request): JsonResponse|RedirectResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'max:190'],
            'password' => ['required', 'string', 'max:500'],
        ]);

        $user = (string) config('modulus_playground.admin_username');
        $pass = (string) config('modulus_playground.admin_password');

        if (! hash_equals($user, $validated['email']) || ! hash_equals($pass, $validated['password'])) {
            return $this->fail($request, 'Invalid username or password.', 401);
        }

        $request->session()->put('modulus_site_admin', true);
        $request->session()->regenerate();

        $redirectUrl = route('playground.modulus.page', ['page' => 'admin']);

        if ($request->expectsJson()) {
            return response()->json(['ok' => true, 'redirect' => $redirectUrl]);
        }

        return redirect()->to($redirectUrl);
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget('modulus_site_admin');
        $request->session()->regenerate();

        return redirect()->route('playground.template', ['template' => 'modulus']);
    }

    private function fail(Request $request, string $message, int $status): JsonResponse|RedirectResponse
    {
        if ($request->expectsJson()) {
            return response()->json(['ok' => false, 'error' => $message], $status);
        }

        return back()->withErrors(['email' => $message]);
    }
}
