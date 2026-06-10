{{-- Full-viewport auth UI — opened from home hero Login / Register (no navigation). --}}
<div id="dvele-auth-lightbox" class="dvele-auth-lightbox" hidden aria-hidden="true">
    <div class="dvele-auth-lightbox__backdrop" data-auth-close tabindex="-1"></div>
    <div
        class="dvele-auth-lightbox__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Sign in or register"
        tabindex="-1"
    >
        <div class="dvele-auth-lightbox__head">
            <button type="button" class="dvele-auth-lightbox__close" data-auth-close aria-label="Close">&times;</button>
        </div>
        <div class="dvele-auth-lightbox__body">
            <div class="dvele-auth-lightbox__tabs" role="tablist" aria-label="Login or register">
                <button
                    type="button"
                    class="dvele-auth-lightbox__tab"
                    role="tab"
                    id="dvele-auth-tab-login"
                    aria-selected="true"
                    aria-controls="dvele-auth-panel-login"
                    data-auth-mode="login"
                >
                    Login
                </button>
                <button
                    type="button"
                    class="dvele-auth-lightbox__tab"
                    role="tab"
                    id="dvele-auth-tab-register"
                    aria-selected="false"
                    aria-controls="dvele-auth-panel-register"
                    data-auth-mode="register"
                >
                    Register
                </button>
            </div>
            <section
                class="dvele-auth-lightbox__section"
                id="dvele-auth-panel-login"
                role="tabpanel"
                aria-labelledby="dvele-auth-tab-login"
            >
                <form
                    class="dvele-auth-lightbox__form"
                    action="#"
                    method="post"
                    data-auth-form="login"
                    data-login-url="{{ route('playground.modulus.login') }}"
                >
                    @csrf
                    <button
                        type="button"
                        class="dvele-auth-lightbox__oauth dvele-auth-lightbox__oauth--google"
                        disabled
                        title="Google sign-in is not connected yet"
                    >
                        <svg class="dvele-auth-lightbox__oauth-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>
                    <div class="dvele-auth-lightbox__divider" role="presentation">
                        <span class="dvele-auth-lightbox__divider-line" aria-hidden="true"></span>
                        <span class="dvele-auth-lightbox__divider-text">or</span>
                        <span class="dvele-auth-lightbox__divider-line" aria-hidden="true"></span>
                    </div>
                    <label class="dvele-auth-lightbox__label">
                        <span class="dvele-auth-lightbox__label-text">Username</span>
                        <input
                            type="text"
                            name="email"
                            autocomplete="username"
                            class="dvele-auth-lightbox__input"
                            value="admin"
                        />
                    </label>
                    <label class="dvele-auth-lightbox__label" for="dvele-auth-password-login">
                        <span class="dvele-auth-lightbox__label-text">Password</span>
                        <span class="dvele-auth-lightbox__input-wrap">
                            <input
                                id="dvele-auth-password-login"
                                type="password"
                                name="password"
                                autocomplete="current-password"
                                class="dvele-auth-lightbox__input dvele-auth-lightbox__input--password"
                                value="admin"
                            />
                            {{-- Single ghost icon button (Radix TextField slot pattern): one control, icons stacked in one slot --}}
                            <button
                                type="button"
                                class="dvele-auth-lightbox__pw-toggle dvele-auth-lightbox__pw-toggle--icon"
                                data-auth-pw-toggle
                                aria-label="Show password"
                                aria-pressed="false"
                                aria-controls="dvele-auth-password-login"
                            >
                                <span class="dvele-auth-lightbox__pw-toggle-icon" aria-hidden="true">
                                    <svg class="dvele-auth-lightbox__pw-svg dvele-auth-lightbox__pw-svg--off" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                    <svg class="dvele-auth-lightbox__pw-svg dvele-auth-lightbox__pw-svg--on" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </span>
                            </button>
                        </span>
                    </label>
                    <p id="dvele-auth-login-error" class="dvele-auth-lightbox__error" hidden role="alert"></p>
                    <button type="submit" class="dvele-button mod-contact-hero__booking-btn dvele-auth-lightbox__submit">Sign in</button>
                </form>
            </section>
            <section
                class="dvele-auth-lightbox__section"
                id="dvele-auth-panel-register"
                role="tabpanel"
                aria-labelledby="dvele-auth-tab-register"
                hidden
            >
                <form class="dvele-auth-lightbox__form" action="#" method="post" data-auth-form="register">
                    @csrf
                    <button
                        type="button"
                        class="dvele-auth-lightbox__oauth dvele-auth-lightbox__oauth--google"
                        disabled
                        title="Google sign-up is not connected yet"
                    >
                        <svg class="dvele-auth-lightbox__oauth-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>
                    <div class="dvele-auth-lightbox__divider" role="presentation">
                        <span class="dvele-auth-lightbox__divider-line" aria-hidden="true"></span>
                        <span class="dvele-auth-lightbox__divider-text">or</span>
                        <span class="dvele-auth-lightbox__divider-line" aria-hidden="true"></span>
                    </div>
                    <label class="dvele-auth-lightbox__label">
                        <span class="dvele-auth-lightbox__label-text">Email</span>
                        <input type="email" name="email" autocomplete="email" class="dvele-auth-lightbox__input" />
                    </label>
                    <label class="dvele-auth-lightbox__label" for="dvele-auth-password-register">
                        <span class="dvele-auth-lightbox__label-text">Password</span>
                        <span class="dvele-auth-lightbox__input-wrap">
                            <input
                                id="dvele-auth-password-register"
                                type="password"
                                name="password"
                                autocomplete="new-password"
                                class="dvele-auth-lightbox__input dvele-auth-lightbox__input--password"
                            />
                            <button
                                type="button"
                                class="dvele-auth-lightbox__pw-toggle dvele-auth-lightbox__pw-toggle--icon"
                                data-auth-pw-toggle
                                aria-label="Show password"
                                aria-pressed="false"
                                aria-controls="dvele-auth-password-register"
                            >
                                <span class="dvele-auth-lightbox__pw-toggle-icon" aria-hidden="true">
                                    <svg class="dvele-auth-lightbox__pw-svg dvele-auth-lightbox__pw-svg--off" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                    <svg class="dvele-auth-lightbox__pw-svg dvele-auth-lightbox__pw-svg--on" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                </span>
                            </button>
                        </span>
                    </label>
                    <button type="submit" class="dvele-button mod-contact-hero__booking-btn dvele-auth-lightbox__submit" disabled>Create account</button>
                </form>
            </section>
        </div>
    </div>
</div>
