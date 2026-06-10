<footer class="dvele-footer" id="contact">
    <nav class="dvele-footer__legal" aria-label="Legal">
        <a href="{{ $modulusUrls['privacy'] }}" wire:navigate>Privacy</a>
        <span class="dvele-footer__legal-sep" aria-hidden="true">·</span>
        <a href="{{ $modulusUrls['terms'] }}" wire:navigate>Terms</a>
        <span class="dvele-footer__legal-sep" aria-hidden="true">·</span>
        <a href="{{ $modulusUrls['cookies'] }}" wire:navigate>Cookies</a>
    </nav>
    <p class="dvele-footer__fine">
        © 2026 Modulus. All rights reserved —
        <span class="dvele-footer__fine-brand">
            <span class="mod-sim__ai-note-highlight">VissAI</span>
            <a href="#top" class="mod-scroll-top" aria-label="Back to top">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg>
            </a>
        </span>
    </p>
</footer>
