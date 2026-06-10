@php
    $services = [
        ['id' => 'higiena', 'name' => 'Higiena', 'minutes' => 60],
        ['id' => 'balinimas', 'name' => 'Dantų balinimas', 'minutes' => 90],
        ['id' => 'implantacija', 'name' => 'Implantacija', 'minutes' => 60],
        ['id' => 'konsultacija', 'name' => 'Konsultacija', 'minutes' => 30],
        ['id' => 'uzpildai', 'name' => 'Plombavimas (užpildai)', 'minutes' => 60],
        ['id' => 'protezavimas', 'name' => 'Protezavimas', 'minutes' => 60],
        ['id' => 'endodontija', 'name' => 'Endodontinis gydymas', 'minutes' => 90],
        ['id' => 'vaiku', 'name' => 'Vaikų odontologija', 'minutes' => 30],
    ];
    $timeSlots = [
        ['label' => '09:00', 'taken' => false],
        ['label' => '09:30', 'taken' => true],
        ['label' => '10:00', 'taken' => false],
        ['label' => '10:30', 'taken' => true],
        ['label' => '11:00', 'taken' => false],
        ['label' => '11:30', 'taken' => true],
        ['label' => '12:00', 'taken' => false],
        ['label' => '12:30', 'taken' => false],
        ['label' => '13:00', 'taken' => true],
        ['label' => '13:30', 'taken' => true],
        ['label' => '14:00', 'taken' => false],
        ['label' => '14:30', 'taken' => true],
        ['label' => '15:00', 'taken' => true],
        ['label' => '15:30', 'taken' => false],
        ['label' => '16:00', 'taken' => true],
        ['label' => '16:30', 'taken' => true],
    ];
    $calendarWeeks = [
        [['d' => 1, 'out' => false, 'disabled' => true], ['d' => 2, 'out' => false, 'disabled' => true], ['d' => 3, 'out' => false, 'disabled' => true], ['d' => 4, 'out' => false, 'disabled' => true], ['d' => 5, 'out' => false, 'disabled' => true], ['d' => 6, 'out' => false, 'disabled' => true], ['d' => 7, 'out' => false, 'disabled' => true, 'today' => true]],
        [['d' => 8, 'out' => false, 'disabled' => false, 'selected' => true], ['d' => 9, 'out' => false, 'disabled' => false], ['d' => 10, 'out' => false, 'disabled' => false], ['d' => 11, 'out' => false, 'disabled' => false], ['d' => 12, 'out' => false, 'disabled' => false], ['d' => 13, 'out' => false, 'disabled' => true], ['d' => 14, 'out' => false, 'disabled' => true]],
        [['d' => 15, 'out' => false, 'disabled' => false], ['d' => 16, 'out' => false, 'disabled' => false], ['d' => 17, 'out' => false, 'disabled' => false], ['d' => 18, 'out' => false, 'disabled' => false], ['d' => 19, 'out' => false, 'disabled' => false], ['d' => 20, 'out' => false, 'disabled' => true], ['d' => 21, 'out' => false, 'disabled' => true]],
        [['d' => 22, 'out' => false, 'disabled' => false], ['d' => 23, 'out' => false, 'disabled' => false], ['d' => 24, 'out' => false, 'disabled' => false], ['d' => 25, 'out' => false, 'disabled' => false], ['d' => 26, 'out' => false, 'disabled' => false], ['d' => 27, 'out' => false, 'disabled' => true], ['d' => 28, 'out' => false, 'disabled' => true]],
        [['d' => 29, 'out' => false, 'disabled' => false], ['d' => 30, 'out' => false, 'disabled' => false], ['d' => 1, 'out' => true, 'disabled' => false], ['d' => 2, 'out' => true, 'disabled' => false], ['d' => 3, 'out' => true, 'disabled' => false], ['d' => 4, 'out' => true, 'disabled' => true], ['d' => 5, 'out' => true, 'disabled' => true]],
    ];
@endphp

<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,400&display=swap" rel="stylesheet" />

<div class="tpl-booking min-h-screen flex flex-col antialiased">
    <header class="tpl-booking__header border-b">
        <div class="tpl-booking__shell flex items-center justify-between py-4">
            <a href="#" class="tpl-booking__brand flex items-center gap-3 no-underline">
                <span class="tpl-booking__logo" aria-hidden="true">M</span>
                <span class="flex flex-col leading-tight">
                    <span class="tpl-booking__brand-title font-heading">Modulus</span>
                    <span class="tpl-booking__brand-sub">Book a visit</span>
                </span>
            </a>
            <a href="#" class="tpl-booking__admin-link text-sm no-underline">Admin</a>
        </div>
    </header>

    <main class="flex-1">
        <div class="tpl-booking__shell px-5 py-8 sm:py-12">
            <div class="mb-8">
                <h1 class="tpl-booking__title font-heading">Book a visit</h1>
                <p class="tpl-booking__lede mt-3 max-w-2xl">
                    Choose a service, day, and time — no phone tag. You will receive a confirmation by email.
                </p>
            </div>

            <div class="tpl-booking__grid">
                <section class="space-y-6">
                    <div class="tpl-booking__card p-4 sm:p-6">
                        <h2 class="tpl-booking__step-label mb-3">1. Pasirinkite dieną</h2>
                        <div class="rdp-root">
                            <div class="rdp-months">
                                <div class="rdp-month">
                                    <div class="rdp-nav">
                                        <button type="button" class="rdp-button_previous" aria-label="Go to the Previous Month"></button>
                                        <div class="rdp-month_caption">2026 m. birželis</div>
                                        <button type="button" class="rdp-button_next" aria-label="Go to the Next Month"></button>
                                    </div>
                                    <table class="rdp-month_grid" role="grid">
                                        <thead>
                                            <tr class="rdp-weekdays">
                                                @foreach (['Pr', 'An', 'Tr', 'Kt', 'Pn', 'Št', 'Sk'] as $wd)
                                                    <th scope="col" class="rdp-weekday">{{ $wd }}</th>
                                                @endforeach
                                            </tr>
                                        </thead>
                                        <tbody>
                                            @foreach ($calendarWeeks as $week)
                                                <tr class="rdp-week">
                                                    @foreach ($week as $cell)
                                                        <td role="gridcell" @class([
                                                            'rdp-day',
                                                            'rdp-outside' => $cell['out'] ?? false,
                                                            'rdp-disabled' => $cell['disabled'] ?? false,
                                                            'rdp-today' => ($cell['today'] ?? false) && ! ($cell['selected'] ?? false),
                                                            'rdp-selected' => $cell['selected'] ?? false,
                                                        ])>
                                                            <button
                                                                type="button"
                                                                class="rdp-day_button"
                                                                @disabled($cell['disabled'] ?? false)
                                                                data-day="{{ $cell['d'] }}"
                                                                aria-pressed="{{ ($cell['selected'] ?? false) ? 'true' : 'false' }}"
                                                            >{{ $cell['d'] }}</button>
                                                        </td>
                                                    @endforeach
                                                </tr>
                                            @endforeach
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        <p class="tpl-booking__hint mt-2">
                            Pilkos dienos — nedarbingos arba visiškai užimtos. Paryškinta — jūsų pasirinkimas.
                        </p>
                    </div>

                    <div class="tpl-booking__card p-4 sm:p-6">
                        <h2 class="tpl-booking__step-label mb-3">2. Pasirinkite laiką</h2>
                        <div class="tpl-booking__slots grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                            @foreach ($timeSlots as $slot)
                                <button
                                    type="button"
                                    class="tpl-booking__slot"
                                    data-slot="{{ $slot['label'] }}"
                                    @disabled($slot['taken'])
                                    @class(['is-taken' => $slot['taken']])
                                >{{ $slot['label'] }}</button>
                            @endforeach
                        </div>
                    </div>
                </section>

                <aside>
                    <form class="tpl-booking__card tpl-booking__form p-4 sm:p-6 space-y-4" onsubmit="return false;">
                        <h2 class="tpl-booking__step-label">3. Jūsų duomenys</h2>

                        <div>
                            <label class="tpl-booking__field-label" for="tpl-service">Paslauga</label>
                            <select id="tpl-service" class="tpl-booking__input w-full" required>
                                @foreach ($services as $service)
                                    <option value="{{ $service['id'] }}">{{ $service['name'] }} · {{ $service['minutes'] }} min</option>
                                @endforeach
                            </select>
                        </div>

                        <div>
                            <label class="tpl-booking__field-label" for="tpl-name">Vardas, pavardė</label>
                            <input id="tpl-name" class="tpl-booking__input w-full" type="text" required autocomplete="name" />
                        </div>

                        <div>
                            <label class="tpl-booking__field-label" for="tpl-phone">Telefonas</label>
                            <input id="tpl-phone" class="tpl-booking__input w-full" type="tel" required autocomplete="tel" placeholder="+370 ..." />
                        </div>

                        <div>
                            <label class="tpl-booking__field-label" for="tpl-email">El. paštas</label>
                            <input id="tpl-email" class="tpl-booking__input w-full" type="email" required autocomplete="email" />
                        </div>

                        <div>
                            <label class="tpl-booking__field-label" for="tpl-comment">
                                Komentaras <span class="tpl-booking__optional">(nebūtinas)</span>
                            </label>
                            <textarea
                                id="tpl-comment"
                                class="tpl-booking__input tpl-booking__textarea w-full"
                                placeholder="Pvz. skausmas viršutiniame danty, alergijos, ..."
                            ></textarea>
                        </div>

                        <div class="tpl-booking__picked">
                            <div class="tpl-booking__picked-label">Pasirinktas laikas</div>
                            <div id="tpl-picked-time" class="tpl-booking__picked-value mt-1">Dar nepasirinkta</div>
                        </div>

                        <button type="submit" id="tpl-submit" class="tpl-booking__submit w-full" disabled>
                            Patvirtinti registraciją
                        </button>
                    </form>
                </aside>
            </div>
        </div>
    </main>

    <footer class="tpl-booking__footer border-t">
        <div class="tpl-booking__shell tpl-booking__footer-inner py-6">
            <span>© Modulus. All rights reserved.</span>
            <span>Scheduling powered by the same engine as the main site demo.</span>
        </div>
    </footer>
</div>

<style>
    .tpl-booking {
        --background: #f7f7f7;
        --surface: #ffffff;
        --foreground: #3d4d5c;
        --heading: #0a2540;
        --brand: #0a2540;
        --brand-foreground: #ededed;
        --brand-soft: #e8eef2;
        --brand-hover: #0d3050;
        --muted: #5c6b78;
        --border: #e0e6ec;
        --ring: rgba(10, 37, 64, 0.28);
        background: var(--background);
        color: var(--foreground);
        font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif;
        font-size: 15px;
        line-height: 26px;
    }

    .tpl-booking .font-heading,
    .tpl-booking__title,
    .tpl-booking__brand-title {
        font-family: "Fraunces", Georgia, serif;
    }

    .tpl-booking__shell {
        max-width: 64rem;
        margin-inline: auto;
        padding-inline: 1.25rem;
    }

    .tpl-booking__header,
    .tpl-booking__footer {
        border-color: var(--border);
        background: var(--surface);
    }

    .tpl-booking__logo {
        display: inline-flex;
        height: 2.5rem;
        width: 2.5rem;
        align-items: center;
        justify-content: center;
        background: var(--brand);
        color: var(--brand-foreground);
        font-size: 0.875rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border: 1px solid var(--brand);
    }

    .tpl-booking__brand-title {
        font-size: 1.125rem;
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: var(--heading);
    }

    .tpl-booking__brand-sub {
        font-size: 0.75rem;
        color: var(--muted);
        letter-spacing: 0.05em;
    }

    .tpl-booking__admin-link {
        color: var(--muted);
    }

    .tpl-booking__admin-link:hover {
        color: var(--brand);
    }

    .tpl-booking__title {
        font-size: clamp(1.875rem, 4vw, 2.25rem);
        font-weight: 400;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        color: var(--heading);
        line-height: 1.15;
        margin: 0;
    }

    .tpl-booking__lede {
        color: var(--foreground);
    }

    .tpl-booking__grid {
        display: grid;
        gap: 2rem;
    }

    @media (min-width: 1024px) {
        .tpl-booking__grid {
            grid-template-columns: minmax(0, 1fr) 22rem;
        }

        .tpl-booking__form {
            position: sticky;
            top: 1rem;
        }
    }

    .tpl-booking__card {
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 2px;
        box-shadow: 0 1px 2px rgb(10 37 64 / 0.04);
    }

    .tpl-booking__step-label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted);
        margin: 0;
    }

    .tpl-booking__hint {
        font-size: 0.75rem;
        color: var(--muted);
        line-height: 1.5;
        margin: 0;
    }

    .tpl-booking__field-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        margin-bottom: 0.25rem;
    }

    .tpl-booking__optional {
        color: var(--muted);
        font-weight: 400;
    }

    .tpl-booking__input {
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 2px;
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
        color: var(--foreground);
    }

    .tpl-booking__textarea {
        min-height: 5rem;
        resize: vertical;
    }

    .tpl-booking__input:focus {
        outline: none;
        box-shadow: 0 0 0 3px var(--ring);
        border-color: var(--brand);
    }

    .tpl-booking__picked {
        border: 1px solid var(--border);
        background: var(--brand-soft);
        border-radius: 2px;
        padding: 0.75rem;
        font-size: 0.875rem;
    }

    .tpl-booking__picked-label {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--brand-hover);
    }

    .tpl-booking__picked-value {
        color: var(--heading);
        font-weight: 500;
    }

    .tpl-booking__submit {
        border: 1px solid var(--brand);
        background: var(--brand);
        color: #fff;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-size: 0.875rem;
        min-height: 50px;
        padding-inline: 2.25rem;
        transition: background-color 0.15s, border-color 0.15s;
    }

    .tpl-booking__submit:hover:not(:disabled) {
        background: var(--brand-hover);
        border-color: var(--brand-hover);
    }

    .tpl-booking__submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .tpl-booking__slot {
        border: 1px solid var(--border);
        background: var(--surface);
        border-radius: 2px;
        padding: 0.5rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: var(--foreground);
        transition: border-color 0.15s, color 0.15s, background-color 0.15s;
    }

    .tpl-booking__slot:hover:not(:disabled):not(.is-picked) {
        border-color: var(--brand);
        color: var(--brand-hover);
    }

    .tpl-booking__slot.is-taken {
        background: color-mix(in srgb, var(--border) 50%, transparent);
        color: var(--muted);
        cursor: not-allowed;
        text-decoration: line-through;
    }

    .tpl-booking__slot.is-picked {
        border-color: var(--brand);
        background: var(--brand);
        color: #fff;
        box-shadow: 0 1px 2px rgb(10 37 64 / 0.12);
    }

    .tpl-booking__footer-inner {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: var(--muted);
        line-height: 1.5;
    }

    @media (min-width: 640px) {
        .tpl-booking__footer-inner {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
        }
    }

    .rdp-root {
        --rdp-accent-color: var(--brand);
        --rdp-accent-background-color: var(--brand-soft);
        --rdp-day-height: 2.5rem;
        --rdp-day-width: 2.5rem;
        font-size: 0.875rem;
    }

    .rdp-nav {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.75rem;
    }

    .rdp-month_caption {
        font-family: "Fraunces", Georgia, serif;
        font-size: 1rem;
        color: var(--heading);
        font-weight: 400;
    }

    .rdp-button_previous,
    .rdp-button_next {
        width: 2rem;
        height: 2rem;
        border: none;
        background: transparent;
        cursor: pointer;
        position: relative;
    }

    .rdp-button_previous::before,
    .rdp-button_next::before {
        content: "";
        display: block;
        width: 0.5rem;
        height: 0.5rem;
        border-top: 2px solid var(--brand);
        border-right: 2px solid var(--brand);
        margin: auto;
    }

    .rdp-button_previous::before {
        transform: rotate(-135deg);
    }

    .rdp-button_next::before {
        transform: rotate(45deg);
    }

    .rdp-month_grid {
        width: 100%;
        border-collapse: collapse;
    }

    .rdp-weekday {
        color: var(--muted);
        font-weight: 600;
        font-size: 0.75rem;
        padding-bottom: 0.5rem;
        text-align: center;
    }

    .rdp-day {
        text-align: center;
        padding: 2px;
    }

    .rdp-day_button {
        width: var(--rdp-day-width);
        height: var(--rdp-day-height);
        border: none;
        border-radius: 9999px;
        background: transparent;
        color: var(--foreground);
        font-weight: 500;
        cursor: pointer;
    }

    .rdp-outside .rdp-day_button {
        color: color-mix(in srgb, var(--muted) 65%, transparent);
    }

    .rdp-disabled .rdp-day_button {
        color: color-mix(in srgb, var(--muted) 55%, transparent);
        cursor: not-allowed;
    }

    .rdp-today:not(.rdp-selected) .rdp-day_button {
        color: var(--brand);
        font-weight: 600;
    }

    .rdp-selected .rdp-day_button {
        background: var(--brand) !important;
        color: var(--brand-foreground) !important;
    }

    .tpl-booking__slots {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 0.5rem;
    }

    @media (min-width: 640px) {
        .tpl-booking__slots {
            grid-template-columns: repeat(4, minmax(0, 1fr));
        }
    }

    @media (min-width: 768px) {
        .tpl-booking__slots {
            grid-template-columns: repeat(6, minmax(0, 1fr));
        }
    }
</style>

<script>
(function () {
    var root = document.querySelector('.tpl-booking');
    if (!root) return;
    var pickedEl = root.querySelector('#tpl-picked-time');
    var submitBtn = root.querySelector('#tpl-submit');
    var selectedDay = '2026-06-08';
    var selectedSlot = null;

    root.querySelectorAll('.rdp-day_button:not(:disabled)').forEach(function (btn) {
        btn.addEventListener('click', function () {
            root.querySelectorAll('.rdp-day').forEach(function (cell) { cell.classList.remove('rdp-selected'); });
            var cell = btn.closest('.rdp-day');
            if (cell) cell.classList.add('rdp-selected');
            selectedDay = '2026-06-' + String(btn.dataset.day).padStart(2, '0');
            updatePicked();
        });
    });

    root.querySelectorAll('.tpl-booking__slot:not(:disabled)').forEach(function (btn) {
        btn.addEventListener('click', function () {
            root.querySelectorAll('.tpl-booking__slot').forEach(function (b) { b.classList.remove('is-picked'); });
            btn.classList.add('is-picked');
            selectedSlot = btn.dataset.slot;
            updatePicked();
        });
    });

    function updatePicked() {
        if (selectedSlot) {
            pickedEl.textContent = selectedDay + ' ' + selectedSlot;
            submitBtn.disabled = false;
        } else {
            pickedEl.textContent = 'Dar nepasirinkta';
            submitBtn.disabled = true;
        }
    }
})();
</script>
