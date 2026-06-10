<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', config('app.name'))</title>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-slate-50 text-slate-900 antialiased">
    <header class="border-b border-slate-200 bg-white">
        <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <a href="{{ route('news.index') }}" class="text-lg font-semibold tracking-tight text-slate-900 hover:text-indigo-600">
                VissAI - News
            </a>
            <nav class="flex items-center gap-4 text-sm font-medium">
                <a href="{{ route('news.index') }}" class="text-slate-600 hover:text-indigo-600">All articles</a>
                <a href="{{ route('news.create') }}" class="rounded-md bg-indigo-600 px-3 py-2 text-white shadow-sm hover:bg-indigo-500">
                    New article
                </a>
            </nav>
        </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        @if (session('success'))
            <div class="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
                {{ session('success') }}
            </div>
        @endif

        @if (session('error'))
            <div class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {{ session('error') }}
            </div>
        @endif

        @yield('content')
    </main>
</body>
</html>
