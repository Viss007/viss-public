{{-- Outside Livewire morph: viewport-fixed Logout when admin session is active (login only from grid Admin buttons). --}}
<div
    id="template-admin-ui"
    class="pointer-events-auto fixed bottom-4 left-4 z-[9999] hidden flex max-w-[min(100vw-2rem,18rem)] flex-col items-stretch gap-2"
>
    <div class="flex flex-wrap items-center gap-2">
        <button
            type="button"
            id="template-admin-logout-btn"
            class="hidden rounded-full border border-rose-500/50 bg-rose-950/90 px-4 py-2 text-xs font-semibold text-rose-100 shadow-lg backdrop-blur-sm transition hover:bg-rose-900"
        >
            Logout
        </button>
    </div>
</div>
