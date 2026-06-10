@php
    use App\Support\ModulusPlaygroundBooking;
    $bookingProps = [
        'initialSlots' => ModulusPlaygroundBooking::slots(),
        'services' => array_values(ModulusPlaygroundBooking::services()),
    ];
    $bookingCss = asset('modulus-booking-build/assets/booking-Cy4Kn6p4.css');
    $bookingJs = asset('modulus-booking-build/assets/booking-D4df686v.js');
@endphp
        <section class="mod-booking-integrated" id="top">
            <div class="mx-auto max-w-5xl px-5 pt-14 pb-8 sm:pt-20 sm:pb-12">
                <div class="mod-booking-integrated__panel">
                    <script id="booking-props" type="application/json">@json($bookingProps)</script>
                    <div id="booking-root"></div>
                </div>
                <div class="mod-booking-integrated__footer-spacer" aria-hidden="true"></div>
                <div class="mod-booking-integrated__footer-actions">
                    <p class="mod-booking-integrated__back-link">
                        <a href="{{ $modulusUrls['reach_out'] }}">← Return</a>
                    </p>
                </div>
            </div>
        </section>
        <link rel="stylesheet" href="{{ $bookingCss }}" />
        <script type="module" src="{{ $bookingJs }}"></script>
