@php
    $modulusAddress = 'Konstitucijos pr. 7, LT-09308 Vilnius, Lithuania';
    $modulusMapEmbed = 'https://maps.google.com/maps?q=' . rawurlencode($modulusAddress) . '&z=16&hl=en&output=embed';
    $modulusEmail = 'hello@modulus.lt';
@endphp
        <section class="mod-contact-hero" id="top" aria-labelledby="mod-contact-heading">
            <div class="mod-contact-hero__inner">
                <p class="mod-contact-eyebrow" id="mod-contact-heading">We are here for you</p>
                @include('livewire.templates.partials.modulus-playground.contact-quick-actions')
            </div>
        </section>

        <section class="mod-contact-map-band" id="mod-contact-map" aria-label="Studio map">
            <div class="mod-contact-map-band__inner">
                <div class="mod-contact-map-shell">
                    <iframe class="mod-contact-map-iframe" src="{{ $modulusMapEmbed }}" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="Modulus studio — {{ $modulusAddress }}"></iframe>
                </div>
            </div>
        </section>

        <section class="mod-contact-reviews" id="mod-contact-reviews" aria-label="Homeowner reviews">
            <div class="mod-contact-reviews__inner">
                <div class="mod-contact-reviews__heading">
                    <div class="rating-wrapper is--absolute" role="img" aria-label="Average rating 5.0 out of 5">
                        <div class="text-block">5.0</div>
                        <div class="icon-embed-small is--home w-embed" aria-hidden="true">
                            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24"><path fill="currentColor" d="m12 17.27l4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72l3.67-3.18c.67-.58.31-1.68-.57-1.75l-4.83-.41l-1.89-4.46c-.34-.81-1.5-.81-1.84 0L9.19 8.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18l-1.1 4.72c-.2.86.73 1.54 1.49 1.08z"></path></svg>
                        </div>
                    </div>
                </div>
                <ul class="mod-contact-review-grid">
                    <li class="mod-contact-review-card">
                        <div class="mod-contact-review-card__head">
                            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=128&h=128&q=88" alt="" width="56" height="56" class="mod-contact-review-avatar" loading="lazy" decoding="async">
                            <div>
                                <p class="mod-contact-review-name">Eglė Kazlauskaitė</p>
                                <p class="mod-contact-review-meta">Vilnius</p>
                            </div>
                        </div>
                        <p class="mod-contact-review-quote">We were braced for the usual build chaos. Instead we got one thread from design sign-off to delivery. The house feels composed, not bolted together.</p>
                    </li>
                    <li class="mod-contact-review-card">
                        <div class="mod-contact-review-card__head">
                            <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=128&h=128&q=88" alt="" width="56" height="56" class="mod-contact-review-avatar" loading="lazy" decoding="async">
                            <div>
                                <p class="mod-contact-review-name">Mindaugas Žukauskas</p>
                                <p class="mod-contact-review-meta">Kaunas</p>
                            </div>
                        </div>
                        <p class="mod-contact-review-quote">The envelope and systems were spelled out up front. No mystery line items, and the place is quiet and even in temperature year-round.</p>
                    </li>
                    <li class="mod-contact-review-card">
                        <div class="mod-contact-review-card__head">
                            <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=128&h=128&q=88" alt="" width="56" height="56" class="mod-contact-review-avatar" loading="lazy" decoding="async">
                            <div>
                                <p class="mod-contact-review-name">Rūta Šimkūnaitė</p>
                                <p class="mod-contact-review-meta">Klaipėda</p>
                            </div>
                        </div>
                        <p class="mod-contact-review-quote">We cared about finishes more than square footage. The team treated materials as a curated palette, and our kitchen finally feels like us.</p>
                    </li>
                </ul>
            </div>
        </section>

        <section class="mod-contact-split" id="mod-contact-split" aria-label="Studio location and hours">
            <div class="mod-contact-split__inner">
                <div class="mod-contact-split__grid">
                    <div class="mod-contact-split__aside">
                        <div class="mod-contact-split__block">
                            <div class="mod-contact-details">
                                <p><span class="mod-contact-details__label">Address</span><br>{{ $modulusAddress }}</p>
                                <p><span class="mod-contact-details__label">Phone</span><br><a href="tel:{{ $modulusPhoneTel }}">{{ $modulusPhoneDisplay }}</a></p>
                                <p><span class="mod-contact-details__label">Email</span><br><a href="mailto:{{ $modulusEmail }}">{{ $modulusEmail }}</a></p>
                            </div>
                        </div>
                        <div class="mod-contact-split__block">
                            <div class="mod-contact-hours-wrap">
                                <table class="mod-contact-hours-table">
                                    <thead>
                                        <tr><th scope="col">Day</th><th scope="col">Time</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr><td>Monday</td><td>9:00 – 17:00</td></tr>
                                        <tr><td>Tuesday</td><td>9:00 – 17:00</td></tr>
                                        <tr><td>Wednesday</td><td>9:00 – 17:00</td></tr>
                                        <tr><td>Thursday</td><td>9:00 – 17:00</td></tr>
                                        <tr><td>Friday</td><td>9:00 – 17:00</td></tr>
                                        <tr><td>Saturday</td><td>By appointment</td></tr>
                                        <tr><td>Sunday</td><td>Closed</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="mod-contact-split__form-col">
                        @if (session('status'))
                            <p class="mod-contact-flash" role="status">{{ session('status') }}</p>
                        @endif
                        @if ($errors->any())
                            <ul class="mod-contact-errors">
                                @foreach ($errors->all() as $err)
                                    <li>{{ $err }}</li>
                                @endforeach
                            </ul>
                        @endif
                        <form id="contact-form" class="mod-contact-form mod-contact-form--padded" method="post" action="{{ route('playground.modulus.reach_out.submit') }}" novalidate>
                            @csrf
                            <div class="mod-contact-field">
                                <label class="mod-contact-label" for="mod-contact-name">Name</label>
                                <input id="mod-contact-name" name="name" type="text" autocomplete="name" value="{{ old('name') }}" required>
                            </div>
                            <div class="mod-contact-field">
                                <label class="mod-contact-label" for="mod-contact-email">Email</label>
                                <input id="mod-contact-email" name="email" type="email" autocomplete="email" value="{{ old('email') }}" required>
                            </div>
                            <div class="mod-contact-field">
                                <label class="mod-contact-label" for="mod-contact-phone">Phone</label>
                                <input id="mod-contact-phone" name="phone" type="tel" autocomplete="tel" value="{{ old('phone') }}">
                            </div>
                            <div class="mod-contact-field">
                                <label class="mod-contact-label" for="mod-contact-message">Message</label>
                                <textarea id="mod-contact-message" name="message" rows="5" required>{{ old('message') }}</textarea>
                            </div>
                            <button type="submit" class="dvele-button mod-contact-submit">Send message</button>
                        </form>
                    </div>
                </div>
            </div>
        </section>
