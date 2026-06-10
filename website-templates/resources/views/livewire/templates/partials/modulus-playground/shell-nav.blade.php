@php
    $modulusCurrent = $modulusPage ?? 'home';
@endphp
<div class="dvele-nav__underline" aria-hidden="true"></div>

<header class="dvele-nav">
    <div class="dvele-nav__left">
        <a class="dvele-nav__brand" href="{{ $modulusUrls['home'] }}" wire:navigate @if($modulusCurrent === 'home') aria-current="page" @endif>Modulus</a>
        <div class="dvele-nav__lang" role="navigation" aria-label="Kalba">
            <a href="#" class="dvele-nav__lang-link">LT</a>
            <span class="dvele-nav__lang-sep" aria-hidden="true">/</span>
            <a href="#" class="dvele-nav__lang-link dvele-nav__lang-link--current" aria-current="true">EN</a>
        </div>
    </div>
    <div class="dvele-nav__right">
        <nav class="dvele-nav__links" aria-label="Primary">
            <a href="{{ $modulusUrls['home'] }}" wire:navigate @if($modulusCurrent === 'home') aria-current="page" @endif>Home</a>
            <a href="{{ $modulusUrls['about'] }}" wire:navigate @if($modulusCurrent === 'about') aria-current="page" @endif>About</a>
            <a href="{{ $modulusCurrent === 'home' ? $modulusUrls['home'].'#process' : $modulusUrls['process'] }}" wire:navigate @if($modulusCurrent === 'process') aria-current="page" @endif>Process</a>
            <a href="{{ $modulusUrls['gallery'] }}" wire:navigate @if($modulusCurrent === 'gallery') aria-current="page" @endif>Gallery</a>
            <a href="{{ $modulusUrls['pricing'] }}" wire:navigate @if($modulusCurrent === 'pricing') aria-current="page" @endif>Pricing</a>
            <a href="{{ $modulusUrls['reach_out'] }}" wire:navigate @if($modulusCurrent === 'reach-out') aria-current="page" @endif>REACH OUT</a>
        </nav>
        <button type="button" class="dvele-menu-btn" id="dvele-open-menu" aria-expanded="false" aria-controls="dvele-drawer" aria-label="Open menu">
            <span></span><span></span><span></span>
        </button>
    </div>
</header>

<div class="dvele-drawer" id="dvele-drawer">
    <button type="button" class="dvele-drawer__close" id="dvele-close-menu" aria-label="Close menu">&times;</button>
    <div class="dvele-drawer__center">
        <p class="dvele-drawer__big"><em>Your</em> Content</p>
    </div>
</div>
