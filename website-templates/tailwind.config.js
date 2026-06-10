import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './vendor/livewire/livewire/**/*.blade.php',
        './storage/framework/views/*.php',
        './resources/**/*.blade.php',
        './resources/**/*.js',
        './resources/**/*.vue',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['DM Sans', 'Figtree', ...defaultTheme.fontFamily.sans],
                mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
                display: ['Fraunces', 'Georgia', ...defaultTheme.fontFamily.serif],
            },
            boxShadow: {
                glow: '0 0 80px -20px rgba(239,68,68,0.25)',
            },
            gridTemplateColumns: {
                // Portfolio hub sticky nav — same geometry as CDN arbitrary grid; named so JIT cannot drop it from public/build
                'portfolio-nav': 'minmax(0, 1fr) auto minmax(0, 1fr)',
            },
            colors: {
                // Portfolio hub shell (must match Desktop\Public Tailwind CDN theme)
                ink: '#050508',
                panel: '#0c0e12',
                line: 'rgba(255,255,255,0.06)',
                corporate: {
                    // Warm light surfaces + deep evergreen accent (consulting, not SaaS-grey)
                    ink: '#0f1419',
                    'ink-soft': '#3d4654',
                    mist: '#f1efe8',
                    canvas: '#f7f4ec',
                    line: '#e2dfd6',
                    // Premium accent: deep forest-teal, readable on light + strong on white
                    accent: '#0c4a3e',
                    'accent-mid': '#0f766e',
                    'accent-bright': '#14b8a6',
                },
            },
        },
    },
    plugins: [],
};
