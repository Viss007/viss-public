        <section class="dvele-hero" id="top" aria-label="Hero">
            <div class="dvele-hero__bg-frame">
                <img src="https://cdn.prod.website-files.com/633ef3c0bd3be81b55ba5334/6411be62fa853569808db2be_Dvele-Prefab-Homes.jpg" alt="" width="1920" height="1080" fetchpriority="high" aria-hidden="true">
                <div class="dvele-hero__gradient" aria-hidden="true"></div>
                <div class="dvele-hero__auth-launch">
                    <nav class="dvele-hero__auth-nav" aria-label="Account">
                        <button type="button" class="dvele-hero__auth-link" data-action="open-auth" data-auth-panel="login">Login</button>
                        <span class="dvele-hero__auth-sep" aria-hidden="true">/</span>
                        <button type="button" class="dvele-hero__auth-link" data-action="open-auth" data-auth-panel="register">Register</button>
                    </nav>
                </div>
                <div class="dvele-hero__contact-overlay">
                    @include('livewire.templates.partials.modulus-playground.contact-quick-actions')
                </div>
            </div>
            <div class="dvele-hero__inner">
                <h1 class="dvele-display-h"><em>Precision-built</em> for modern life</h1>
                <div class="dvele-hero__grid">
                    <div class="dvele-hero__vid-frame">
                        <video autoplay muted playsinline loop poster="https://cdn.prod.website-files.com/633ef3c0bd3be81b55ba5334/6351701a968681b915c24fa1_Dvele-Portrait-Vid-2-poster-00001.jpg">
                            <source src="https://cdn.prod.website-files.com/633ef3c0bd3be81b55ba5334/6351701a968681b915c24fa1_Dvele-Portrait-Vid-2-transcode.mp4" type="video/mp4">
                            <source src="https://cdn.prod.website-files.com/633ef3c0bd3be81b55ba5334/6351701a968681b915c24fa1_Dvele-Portrait-Vid-2-transcode.webm" type="video/webm">
                        </video>
                    </div>
                </div>
            </div>
        </section>

        @include('livewire.templates.partials.modulus-playground.home-design')
        @include('livewire.templates.partials.modulus-playground.home-process')
        @include('livewire.templates.partials.modulus-playground.home-care')

        <section class="dvele-stat">
            <h2 class="dvele-display-h dvele-display-h--brand">Built for <em>decades</em>, not seasons</h2>
            <div class="dvele-process-copy-cta">
                <a href="{{ $modulusUrls['gallery'] }}" class="dvele-process-copy-cta__link" wire:navigate><span class="dvele-process-copy-cta__read">To</span><span class="dvele-process-copy-cta__sep" aria-hidden="true"> → </span><span class="dvele-process-copy-cta__dest">Gallery</span></a>
            </div>
        </section>

        <section class="dvele-gallery" aria-label="Gallery">
            <div class="dvele-gallery__viewport">
                <div class="dvele-gallery__track">
                    <div class="dvele-gallery__group">
                        <img src="https://cdn.prod.website-files.com/633ef3c0bd3be81b55ba5334/635ae02f469f133147908303_dvele-prefab-homes-gallery-7.jpg" alt="" loading="lazy" width="600" height="600">
                        <img src="https://cdn.prod.website-files.com/633ef3c0bd3be81b55ba5334/63c05bf32f725ad6e0372676_dvele-prefab-homes-gallery-9.webp" alt="" loading="lazy" width="600" height="600">
                        <img src="https://cdn.prod.website-files.com/633ef3c0bd3be81b55ba5334/635ae02d85da06235e6f9e12_dvele-prefab-homes-gallery-4.jpg" alt="" loading="lazy" width="600" height="600">
                        <img src="https://cdn.prod.website-files.com/633ef3c0bd3be81b55ba5334/63c18a4e4177620c402a1bc9_dvele-prefab-homes-gallery-8.jpg" alt="" loading="lazy" width="600" height="600">
                    </div>
                    <div class="dvele-gallery__group" aria-hidden="true">
                        <img src="https://cdn.prod.website-files.com/633ef3c0bd3be81b55ba5334/635ae02f469f133147908303_dvele-prefab-homes-gallery-7.jpg" alt="" loading="lazy" width="600" height="600">
                        <img src="https://cdn.prod.website-files.com/633ef3c0bd3be81b55ba5334/63c05bf32f725ad6e0372676_dvele-prefab-homes-gallery-9.webp" alt="" loading="lazy" width="600" height="600">
                        <img src="https://cdn.prod.website-files.com/633ef3c0bd3be81b55ba5334/635ae02d85da06235e6f9e12_dvele-prefab-homes-gallery-4.jpg" alt="" loading="lazy" width="600" height="600">
                        <img src="https://cdn.prod.website-files.com/633ef3c0bd3be81b55ba5334/63c18a4e4177620c402a1bc9_dvele-prefab-homes-gallery-8.jpg" alt="" loading="lazy" width="600" height="600">
                    </div>
                </div>
            </div>
        </section>
