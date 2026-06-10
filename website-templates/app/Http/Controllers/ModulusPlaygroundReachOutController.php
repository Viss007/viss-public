<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

final class ModulusPlaygroundReachOutController extends Controller
{
    public function submit(Request $request): RedirectResponse
    {
        $messageRules = $request->input('form_context') === 'design_submit'
            ? ['nullable', 'string', 'max:5000']
            : ['required', 'string', 'max:5000'];

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'message' => $messageRules,
            'return_fragment' => ['nullable', 'string', 'in:design-your-home'],
            'form_context' => ['nullable', 'string', 'max:64'],
        ]);

        $status = 'Thanks — we will get back to you shortly.';

        if (($validated['return_fragment'] ?? null) === 'design-your-home') {
            return redirect()
                ->route('playground.template', ['template' => 'modulus'])
                ->withFragment('design-your-home')
                ->with('status', $status)
                ->with('design_submit', true);
        }

        return redirect()
            ->route('playground.modulus.page', ['page' => 'reach-out'])
            ->withFragment('contact-form')
            ->with('status', $status);
    }
}
