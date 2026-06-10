        <section class="mod-sim-section dvele-section" id="design-your-home" aria-labelledby="mod-sim-heading">
            <div class="mod-sim-section__title-row">
                <div class="mod-sim-section__title-row-spacer" aria-hidden="true"></div>
                <h2 class="dvele-h-large mod-sim-section__title" id="mod-sim-heading">Design Your Own Measurements</h2>
                <div class="mod-sim-section__title-row-spacer" aria-hidden="true"></div>
            </div>

            <div class="dvele-section-pad">
                <div class="dvele-container">
                    <div class="mod-sim">
                        <div class="mod-sim__stage">
                            <div class="mod-sim__palette mod-sim__palette--toolbar" id="mod-sim-palette-root">
                                <div class="mod-sim__palette-header">
                                    <div class="mod-sim__palette-header-start">
                                        <button type="button" class="mod-sim__palette-toggle" id="mod-sim-palette-toggle" aria-expanded="true" aria-controls="mod-sim-palette-panel" aria-label="Collapse room modules">
                                            <svg class="mod-sim__palette-toggle-chevron" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="6 9 12 15 18 9"/></svg>
                                        </button>
                                        <aside class="mod-sim__sidebar mod-sim__sidebar--palette-header" aria-label="Layout summary">
                                            <dl class="mod-sim-stats mod-sim-stats--horizontal">
                                                <div class="mod-sim-stats__row">
                                                    <dt>Area</dt>
                                                    <dd id="mod-sim-total">0 m²</dd>
                                                </div>
                                                <div class="mod-sim-stats__row">
                                                    <dt>Rooms</dt>
                                                    <dd id="mod-sim-rooms">0</dd>
                                                </div>
                                                <div class="mod-sim-stats__row mod-sim-stats__row--price">
                                                    <dt>Estimate <span class="mod-sim-stats__note">€1,650/m²</span></dt>
                                                    <dd id="mod-sim-price">€0</dd>
                                                </div>
                                            </dl>
                                            <div class="mod-sim__palette-pricing-cta">
                                                <a href="{{ $modulusUrls['pricing'] }}" class="dvele-process-copy-cta__link" wire:navigate><span class="dvele-process-copy-cta__read">Go</span><span class="dvele-process-copy-cta__sep" aria-hidden="true"> → </span><span class="dvele-process-copy-cta__dest">Pricing</span></a>
                                            </div>
                                        </aside>
                                    </div>
                                    <div class="mod-sim__actions mod-sim__actions--palette-header">
                                        <button type="button" class="dvele-button mod-sim-pdf" id="mod-sim-pdf" aria-label="Download PDF">
                                            <span class="mod-sim-pdf__inner">
                                                <svg class="mod-sim-pdf__ico" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                                <span class="mod-sim-pdf__txt">PDF</span>
                                            </span>
                                        </button>
                                        <button type="button" class="dvele-button mod-sim-generate" id="mod-sim-generate">Generate Layout</button>
                                        <p class="mod-sim__ai-note">Powered by <span class="mod-sim__ai-note-highlight">AI</span></p>
                                    </div>
                                </div>
                                <div class="mod-sim__palette-panel" id="mod-sim-palette-panel" role="region" aria-label="Room modules">
                                    <p class="mod-sim__chips-hint mod-sim__chips-hint--with-chips">Hold &amp; Drag &amp; Drop</p>
                                    <div class="mod-sim__chips">
                                        <button type="button" class="mod-sim-chip" data-module="living" style="--chip:#3d6e9f"><span class="mod-sim-chip__ico" aria-hidden="true">🛋️</span> Living Room</button>
                                        <button type="button" class="mod-sim-chip" data-module="kitchen" style="--chip:#c17f4a"><span class="mod-sim-chip__ico" aria-hidden="true">🍴</span> Kitchen</button>
                                        <button type="button" class="mod-sim-chip" data-module="bedroom" style="--chip:#4a8c5c"><span class="mod-sim-chip__ico" aria-hidden="true">🛏️</span> Bedroom</button>
                                        <button type="button" class="mod-sim-chip" data-module="bathroom" style="--chip:#6b8fa3"><span class="mod-sim-chip__ico" aria-hidden="true">🚿</span> Bathroom</button>
                                        <button type="button" class="mod-sim-chip" data-module="toilet" style="--chip:#5a7d8c"><span class="mod-sim-chip__ico" aria-hidden="true">🚽</span> Toilet</button>
                                        <button type="button" class="mod-sim-chip" data-module="bath_toilet" style="--chip:#5f86a0"><span class="mod-sim-chip__ico" aria-hidden="true">🚿🚽</span> Bath/Toilet</button>
                                        <button type="button" class="mod-sim-chip" data-module="office" style="--chip:#6b5b95"><span class="mod-sim-chip__ico" aria-hidden="true">💼</span> Office</button>
                                        <button type="button" class="mod-sim-chip" data-module="hallway" style="--chip:#8aa8c4"><span class="mod-sim-chip__ico" aria-hidden="true">🚪</span> Hall</button>
                                        <button type="button" class="mod-sim-chip" data-module="garage" style="--chip:#5c6478"><span class="mod-sim-chip__ico" aria-hidden="true">🚗</span> Garage</button>
                                        <button type="button" class="mod-sim-chip" data-module="garden" style="--chip:#2f6f4e"><span class="mod-sim-chip__ico" aria-hidden="true">🪴</span> Garden</button>
                                        <button type="button" class="mod-sim-chip" data-module="front_yard" style="--chip:#3d8b6e"><span class="mod-sim-chip__ico" aria-hidden="true">🏡</span> FRONT YARD</button>
                                        <button type="button" class="mod-sim-chip" data-module="back_yard" style="--chip:#256340"><span class="mod-sim-chip__ico" aria-hidden="true">🌳</span> BACK YARD</button>
                                        <button type="button" class="mod-sim-chip" data-module="storage" style="--chip:#8b7355"><span class="mod-sim-chip__ico" aria-hidden="true">📦</span> Storage Room</button>
                                        <button type="button" class="mod-sim-chip" data-module="balcony" style="--chip:#4a90c2"><span class="mod-sim-chip__ico" aria-hidden="true">🌤️</span> Balcony</button>
                                        <button type="button" class="mod-sim-chip" data-module="boiler" style="--chip:#a0523d"><span class="mod-sim-chip__ico" aria-hidden="true">🔥</span> Boiler Room</button>
                                    </div>
                                </div>
                            </div>
                            <div class="mod-sim__canvas-block">
                                <div class="mod-sim-canvas" id="mod-floor-canvas" role="application" aria-label="Top-down floor plate, square grid">
                                    <div class="mod-sim-canvas__grid" aria-hidden="true"></div>
                                    <div class="mod-sim-canvas__axis mod-sim-canvas__axis--h" aria-hidden="true"></div>
                                    <div class="mod-sim-canvas__axis mod-sim-canvas__axis--v" aria-hidden="true"></div>
                                    <div class="mod-sim-modules" id="mod-floor-modules"></div>
                                </div>
                                <p class="mod-sim__canvas-note mod-sim__canvas-note--below-canvas">View from above</p>
                            </div>
                            <div class="mod-sim__submit-wrap">
                                <button type="button" class="dvele-button mod-sim-submit-design" id="mod-sim-submit-design">Submit design</button>
                            </div>
                        </div>
                    </div>

                    <div class="mod-sim-modal" id="mod-sim-modal" role="dialog" aria-modal="true" aria-labelledby="mod-sim-modal-title" hidden>
                        <div class="mod-sim-modal__backdrop" id="mod-sim-modal-backdrop" tabindex="-1"></div>
                        <div class="mod-sim-modal__panel">
                            <h2 class="mod-sim-modal__title" id="mod-sim-modal-title">Start a new design?</h2>
                            <p class="mod-sim-modal__body">All rooms will be removed from the floor plate.</p>
                            <div class="mod-sim-modal__actions">
                                <button type="button" class="mod-sim-modal__cancel" id="mod-sim-modal-cancel">Cancel</button>
                                <button type="button" class="dvele-button mod-sim-modal__confirm" id="mod-sim-modal-confirm">Yes, generate new</button>
                            </div>
                        </div>
                    </div>

                    <div
                        class="mod-sim-submit-overlay"
                        id="mod-sim-submit-overlay"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="{{ session('design_submit') && session('status') ? 'mod-sim-submit-overlay-success-title' : 'mod-sim-submit-overlay-title' }}"
                        @if (old('form_context') === 'design_submit' && $errors->any()) data-open-on-load="true" @endif
                        @if (session('design_submit') && session('status')) data-open-success-on-load="true" @endif
                        hidden
                    >
                        <div class="mod-sim-submit-overlay__backdrop" id="mod-sim-submit-overlay-backdrop" tabindex="-1"></div>
                        <div class="mod-sim-submit-overlay__panel">
                            <button type="button" class="mod-sim-submit-overlay__close" id="mod-sim-submit-overlay-close" aria-label="Close dialog">&times;</button>
                            <div id="mod-sim-submit-overlay-body" @if (session('design_submit') && session('status')) hidden @endif>
                                <h2 class="mod-sim-submit-overlay__title" id="mod-sim-submit-overlay-title">
                                    Your PDF
                                    <span class="mod-sim-submit-overlay__title-loaded">
                                        Loaded
                                        <svg
                                            class="mod-sim-submit-overlay__check"
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="28"
                                            height="28"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            aria-hidden="true"
                                            focusable="false"
                                        >
                                            <path
                                                d="M20 6L9 17l-5-5"
                                                stroke="currentColor"
                                                stroke-width="2.5"
                                                stroke-linecap="round"
                                                stroke-linejoin="round"
                                            />
                                        </svg>
                                    </span>
                                </h2>
                                <p class="mod-sim-submit-overlay__lead">
                                    NOTE: This submittal will require email confirmation. Message will be sent directly to the inbox.
                                </p>
                                @if ($errors->any())
                                    <ul class="mod-contact-errors">
                                        @foreach ($errors->all() as $err)
                                            <li>{{ $err }}</li>
                                        @endforeach
                                    </ul>
                                @endif
                                <form id="mod-design-submit-form" class="mod-contact-form mod-contact-form--padded" method="post" action="{{ route('playground.modulus.reach_out.submit') }}" novalidate>
                                    @csrf
                                    <input type="hidden" name="return_fragment" value="design-your-home">
                                    <input type="hidden" name="form_context" value="design_submit">
                                    <div class="mod-contact-field">
                                        <label class="mod-contact-label" for="mod-design-submit-name">Name</label>
                                        <input id="mod-design-submit-name" name="name" type="text" autocomplete="name" value="{{ old('name') }}" required>
                                    </div>
                                    <div class="mod-contact-field">
                                        <label class="mod-contact-label" for="mod-design-submit-email">Email</label>
                                        <input id="mod-design-submit-email" name="email" type="email" autocomplete="email" value="{{ old('email') }}" required>
                                    </div>
                                    <div class="mod-contact-field">
                                        <label class="mod-contact-label" for="mod-design-submit-phone">Phone</label>
                                        <input id="mod-design-submit-phone" name="phone" type="tel" autocomplete="tel" value="{{ old('phone') }}">
                                    </div>
                                    <div class="mod-contact-field">
                                        <label class="mod-contact-label" for="mod-design-submit-message">Message</label>
                                        <textarea id="mod-design-submit-message" name="message" rows="5">{{ old('message') }}</textarea>
                                    </div>
                                    <button type="submit" class="dvele-button mod-contact-submit">Send message</button>
                                </form>
                            </div>
                            <div
                                class="mod-sim-submit-overlay__success-view"
                                id="mod-sim-submit-overlay-success-view"
                                role="status"
                                aria-live="polite"
                                @unless (session('design_submit') && session('status')) hidden @endunless
                            >
                                <p class="mod-sim-submit-overlay__success-text" id="mod-sim-submit-overlay-success-title">
                                    {{ session('design_submit') && session('status') ? session('status') : '' }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
