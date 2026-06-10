<?php

namespace App\Livewire;

use App\Services\DebugLogger;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('layouts.playground')]
class TemplatePlayground extends Component
{
    /** Must match `ADMIN_STORAGE_KEY` in `resources/js/template-admin.js` (sessionStorage). */
    public const ADMIN_STORAGE_KEY = 'vissai_website_templates_admin';

    public ?string $activeTemplate = null;

    /** Modulus sub-page on /websites/modulus/{page} — null means home. */
    public ?string $modulusPage = null;

    /** When true and template is external, iframe loads admin_path on that demo origin. */
    public bool $externalPreviewAdmin = false;

    /** Grid admin modal — server state (no fragile $this->js global; survives Vite load order). */
    public bool $showGridAdminModal = false;

    public ?string $gridAdminTargetTemplate = null;

    public string $gridAdminUser = 'admin';

    public string $gridAdminPass = 'demo';

    public ?string $gridAdminError = null;

    /** Server-side mirror of grid admin sign-in (sessionStorage is set in JS on successful login). */
    public bool $gridAdminAuthenticated = false;

    /**
     * @return array<int, string>
     */
    private static function mockTemplateIds(): array
    {
        return ['corporate', 'product', 'blog', 'saas', 'dentists', 'booking', 'modulus'];
    }

    /**
     * External demos selectable from the grid (iframe full-preview).
     * `news_crud` stays in config for URLs only — embedded inside Newsroom (`blog`).
     *
     * @return array<int, string>
     */
    private static function externalTemplateIds(): array
    {
        return array_values(array_diff(
            array_keys(config('vissai.external_templates', [])),
            ['news_crud', 'dentists', 'booking', 'modulus'],
        ));
    }

    /**
     * @return array{base: string, admin_url: string}|null
     */
    private static function newsCrudEmbedConfig(): ?array
    {
        /** @var array{visitor_url?: string, admin_path?: string}|null $cfg */
        $cfg = config('vissai.external_templates.news_crud');
        if (! is_array($cfg) || empty($cfg['visitor_url'])) {
            return null;
        }
        $base = rtrim((string) $cfg['visitor_url'], '/');
        $suffix = isset($cfg['admin_path']) ? (string) $cfg['admin_path'] : '/news/create';
        $adminUrl = str_starts_with($suffix, 'http://') || str_starts_with($suffix, 'https://')
            ? $suffix
            : $base . (str_starts_with($suffix, '/') ? $suffix : '/' . $suffix);

        return ['base' => $base, 'admin_url' => $adminUrl];
    }

    /**
     * @return array<int, string>
     */
    public static function selectableTemplateIds(): array
    {
        return array_merge(self::mockTemplateIds(), self::externalTemplateIds());
    }

    /**
     * Route constraint for /websites/{template}.
     *
     * @return array<int, string>
     */
    public static function selectableTemplateSlugs(): array
    {
        return self::selectableTemplateIds();
    }

    public function mount(?string $template = null, ?string $page = null): void
    {
        if ($page !== null && $template === null && request()->routeIs('playground.modulus.page')) {
            $template = 'modulus';
        }

        if ($template === null) {
            DebugLogger::event('visitor.view.loaded', array_merge(
                ['view' => 'grid'],
                $this->adminStatusDetails()
            ));

            return;
        }

        if (! in_array($template, self::selectableTemplateIds(), true)) {
            abort(404);
        }

        if ($template === 'modulus' && $page === 'admin' && ! session('modulus_site_admin')) {
            session()->flash('modulus_admin_denied', true);
            $this->redirectRoute('playground.template', ['template' => 'modulus'], navigate: true);

            return;
        }

        $this->externalPreviewAdmin = request()->boolean('admin');
        $this->activeTemplate = $template;
        $this->modulusPage = $template === 'modulus' ? ($page ?? 'home') : null;
        DebugLogger::event('template.switch', $template.($page ? ':'.$page : ''));
    }

    /**
     * @return array{grid_admin_authenticated: bool}
     */
    private function adminStatusDetails(): array
    {
        return ['grid_admin_authenticated' => $this->gridAdminAuthenticated];
    }

    private function emitAdminStateChangedIfNeeded(bool $previous, bool $next): void
    {
        if ($previous === $next) {
            return;
        }

        DebugLogger::event('admin.state.changed', [
            'previous_grid_admin_authenticated' => $previous,
            'grid_admin_authenticated' => $next,
        ]);
    }

    public function select(string $template): void
    {
        if (! in_array($template, self::selectableTemplateIds(), true)) {
            return;
        }
        $this->redirectRoute('playground.template', ['template' => $template], navigate: true);
    }

    public function resetToDefault(): void
    {
        $prevAuth = $this->gridAdminAuthenticated;
        $this->gridAdminAuthenticated = false;
        $this->emitAdminStateChangedIfNeeded($prevAuth, false);

        $this->externalPreviewAdmin = false;
        $this->activeTemplate = null;
        DebugLogger::event('template.switch', 'default');
        DebugLogger::event('visitor.view.loaded', array_merge(
            ['view' => 'grid'],
            $this->adminStatusDetails()
        ));

        $this->js(
            "(function(){try{if(typeof window.__vissaiTemplatePlaygroundClearAdmin==='function'){window.__vissaiTemplatePlaygroundClearAdmin();}}catch(e){}})()"
        );

        $this->redirectRoute('playground.home', navigate: true);
    }

    /**
     * Admin buttons on the grid: open modal via Livewire state (DOM visibility), not $this->js globals.
     */
    public function openAdminModal(string $template): void
    {
        if (! in_array($template, self::selectableTemplateIds(), true)) {
            return;
        }
        $this->gridAdminTargetTemplate = $template;
        $this->gridAdminUser = 'admin';
        $this->gridAdminPass = 'demo';
        $this->gridAdminError = null;
        $this->showGridAdminModal = true;
        DebugLogger::event('admin.opened');
    }

    public function closeGridAdminModal(): void
    {
        $this->showGridAdminModal = false;
        $this->gridAdminTargetTemplate = null;
        $this->gridAdminError = null;
    }

    /**
     * Sign in from grid modal: validate in PHP, set sessionStorage for template-admin.js chrome, then select template.
     */
    public function submitGridAdminLogin(): void
    {
        DebugLogger::event('admin.state.checked', array_merge(
            ['context' => 'submitGridAdminLogin'],
            $this->adminStatusDetails()
        ));
        DebugLogger::event('admin.login.attempt');
        $this->gridAdminError = null;

        if (trim($this->gridAdminUser) !== 'admin' || $this->gridAdminPass !== 'demo') {
            $this->gridAdminError = 'Invalid username or password.';

            return;
        }

        $target = $this->gridAdminTargetTemplate;
        $this->showGridAdminModal = false;
        $this->gridAdminTargetTemplate = null;

        $prevAuth = $this->gridAdminAuthenticated;
        $this->gridAdminAuthenticated = true;
        $this->emitAdminStateChangedIfNeeded($prevAuth, true);

        $key = self::ADMIN_STORAGE_KEY;
        $this->js("(function(){try{sessionStorage.setItem('{$key}','1')}catch(e){}})()");

        if ($target === null) {
            return;
        }

        if (in_array($target, self::externalTemplateIds(), true)) {
            DebugLogger::event('template.switch', $target . ':admin');
            $this->redirect(
                route('playground.template', ['template' => $target]).'?admin=1',
                navigate: true
            );

            return;
        }

        if (in_array($target, self::mockTemplateIds(), true)) {
            $this->redirectRoute('playground.template', ['template' => $target], navigate: true);
        }
    }

    public function render()
    {
        $iframeSrc = null;

        if ($this->activeTemplate !== null && in_array($this->activeTemplate, self::externalTemplateIds(), true)) {
            /** @var array{visitor_url?: string, admin_path?: string}|null $cfg */
            $cfg = config('vissai.external_templates.' . $this->activeTemplate);
            $base = isset($cfg['visitor_url']) ? rtrim((string) $cfg['visitor_url'], '/') : '';
            if ($base !== '') {
                if ($this->externalPreviewAdmin) {
                    $suffix = isset($cfg['admin_path']) ? (string) $cfg['admin_path'] : '/';
                    $iframeSrc = str_starts_with($suffix, 'http://') || str_starts_with($suffix, 'https://')
                        ? $suffix
                        : $base . ($suffix === '' ? '/' : (str_starts_with($suffix, '/') ? $suffix : '/' . $suffix));
                } else {
                    $iframeSrc = $base . '/';
                }
            }
        }

        return view('livewire.template-playground', [
            'iframeSrc' => $iframeSrc,
            'newsCrudEmbed' => self::newsCrudEmbedConfig(),
        ]);
    }
}
