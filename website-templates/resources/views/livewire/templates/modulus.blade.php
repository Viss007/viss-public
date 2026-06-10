@php
    use App\Support\ModulusPlaygroundUrls;

    $modulusPage = $modulusPage ?? 'home';
    $modulusUrls = ModulusPlaygroundUrls::map($modulusPage);
    $modulusPhoneDisplay = '+370 655 12 893';
    $modulusPhoneTel = '+37065512893';
    $modulusWhatsappUrl = 'https://wa.me/37065512893';
    $modulusFacebookUrl = 'https://www.facebook.com/';
    $modulusInstagramUrl = 'https://www.instagram.com/';
    $dveleCssPath = public_path('css/dvele-clone-rve.css');
    $dveleCssV = is_file($dveleCssPath) ? filemtime($dveleCssPath) : 0;

    $modulusPagePartial = match ($modulusPage) {
        'home' => 'page-home',
        'reach-out' => 'page-reach-out',
        'booking' => 'page-booking',
        'admin' => 'page-admin',
        'about', 'process', 'gallery', 'pricing' => 'page-' . $modulusPage,
        default => 'page-placeholder',
    };

    $modulusProcessBodyPages = ['about', 'process', 'gallery', 'pricing', 'privacy', 'terms', 'cookies'];
    $modulusShellClass = 'tpl-modulus dvele-clone min-h-screen antialiased';
    if (in_array($modulusPage, $modulusProcessBodyPages, true)) {
        $modulusShellClass .= ' mod-process-body';
    }
    if ($modulusPage === 'gallery') {
        $modulusShellClass .= ' mod-gallery-shell';
    }
@endphp

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,400&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="{{ asset('css/dvele-clone-rve.css') }}?v={{ $dveleCssV }}" />
<link rel="stylesheet" href="{{ asset('css/modulus-playground-visible.css') }}?v=4" />

@if ($modulusPage === 'admin')
<div class="tpl-modulus dvele-clone min-h-0 flex flex-1 flex-col bg-zinc-950 text-white antialiased" data-modulus-page="{{ $modulusPage }}">
    <main class="mod-admin-root-main flex min-h-0 flex-1 flex-col">
        @include('livewire.templates.partials.modulus-playground.' . $modulusPagePartial)
    </main>
</div>
@else
<div class="{{ $modulusShellClass }}" data-modulus-page="{{ $modulusPage }}">
    @include('livewire.templates.partials.modulus-playground.shell-nav')

    <main>
        @include('livewire.templates.partials.modulus-playground.' . $modulusPagePartial)
    </main>

    @if ($modulusPage === 'home')
        @include('livewire.templates.partials.modulus-playground.auth-lightbox')
    @endif

    @include('livewire.templates.partials.modulus-playground.shell-footer')
</div>
@endif
