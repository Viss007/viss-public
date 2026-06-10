<?php

namespace Tests\Feature;

use App\Livewire\TemplatePlayground;
use Illuminate\Support\Facades\Http;
use Livewire\Livewire;
use Tests\TestCase;

class TemplatePlaygroundTest extends TestCase
{
    public function test_homepage_renders_playground(): void
    {
        $this->get('/websites')
            ->assertOk()
            ->assertSee('Template Playground', false)
            ->assertSee('Corporate', false)
            ->assertSee('Dental practice', false)
            ->assertSee('Online booking', false)
            ->assertSee('Newsroom', false)
            ->assertSee('Admin sign-in', false)
            ->assertSee('template-grid-admin-modal', false);
    }

    public function test_template_route_renders_preview(): void
    {
        $this->get('/websites/corporate')
            ->assertOk()
            ->assertSee('Apex Consulting', false);

        $this->get('/websites/modulus')
            ->assertOk()
            ->assertSee('Precision-built', false);

        $this->get('/websites/not-a-template')
            ->assertNotFound();
    }

    public function test_livewire_select_redirects_to_template_route(): void
    {
        Livewire::test(TemplatePlayground::class)
            ->assertSet('activeTemplate', null)
            ->call('select', 'corporate')
            ->assertRedirect(route('playground.template', 'corporate'));
    }

    public function test_mount_sets_active_template_from_route(): void
    {
        Livewire::test(TemplatePlayground::class, ['template' => 'booking'])
            ->assertSet('activeTemplate', 'booking')
            ->assertSet('externalPreviewAdmin', false);
    }

    public function test_reset_redirects_to_grid(): void
    {
        Livewire::test(TemplatePlayground::class, ['template' => 'corporate'])
            ->call('resetToDefault')
            ->assertRedirect(route('playground.home'));
    }

    public function test_open_admin_modal_is_server_state_not_js_global(): void
    {
        Livewire::test(TemplatePlayground::class)
            ->assertSet('showGridAdminModal', false)
            ->call('openAdminModal', 'saas')
            ->assertSet('showGridAdminModal', true)
            ->assertSet('gridAdminTargetTemplate', 'saas')
            ->call('closeGridAdminModal')
            ->assertSet('showGridAdminModal', false)
            ->assertSet('gridAdminTargetTemplate', null);
    }

    public function test_admin_login_reset_visitor_emits_debug_logger_event_order(): void
    {
        Http::fake();

        Livewire::test(TemplatePlayground::class)
            ->assertSet('gridAdminAuthenticated', false)
            ->call('openAdminModal', 'corporate')
            ->set('gridAdminUser', 'admin')
            ->set('gridAdminPass', 'demo')
            ->call('submitGridAdminLogin')
            ->assertSet('gridAdminAuthenticated', true)
            ->assertRedirect(route('playground.template', 'corporate'))
            ->call('resetToDefault')
            ->assertRedirect(route('playground.home'));

        Http::assertSentCount(8);

        $events = [];
        foreach (Http::recorded() as $pair) {
            /** @var \Illuminate\Http\Client\Request $request */
            $request = $pair[0];
            $body = json_decode($request->body(), true);
            $events[] = $body['event'] ?? '';
        }

        $this->assertSame([
            'visitor.view.loaded',
            'admin.opened',
            'admin.state.checked',
            'admin.login.attempt',
            'admin.state.changed',
            'admin.state.changed',
            'template.switch',
            'visitor.view.loaded',
        ], $events);
    }
}
