<?php

$portfolioBase = rtrim((string) env('VISSAI_PORTFOLIO_URL', 'http://127.0.0.1:3333'), '/');

return [

    /*
    |--------------------------------------------------------------------------
    | Marketing portfolio base URL (no trailing slash)
    |--------------------------------------------------------------------------
    |
    | Template playground shell nav links (About, Projects, etc.) point
    | here so local dev matches http://127.0.0.1:3333 and production can override.
    |
    */

    'portfolio_url' => $portfolioBase,

    /*
    |--------------------------------------------------------------------------
    | ChatGPT MCP (loopback child — proxied as /automations/* on :3333)
    |--------------------------------------------------------------------------
    */

    'chatgpt_mcp_internal_url' => rtrim((string) env('CHATGPT_MCP_INTERNAL_URL', 'http://127.0.0.1:2091'), '/'),

    'speed_to_lead_internal_url' => rtrim((string) env('SPEED_TO_LEAD_INTERNAL_URL', 'http://127.0.0.1:3001'), '/'),

    'docs_agent_internal_url' => rtrim((string) env('DOCS_AGENT_INTERNAL_URL', 'http://127.0.0.1:3000'), '/'),

    /*
    |--------------------------------------------------------------------------
    | Platform operator hub (Fastify gateway — no trailing slash)
    |--------------------------------------------------------------------------
    |
    | Center VissAI wordmark in portfolio shell nav opens this hub for /gw/*
    | product navigation (default local: http://127.0.0.1:3040).
    |
    */

    'platform_url' => rtrim((string) env('VISSAI_PLATFORM_URL', 'http://127.0.0.1:3040'), '/'),

    /*
    |--------------------------------------------------------------------------
    | Template admin / embed URLs (inline on :3333 — no satellite iframes)
    |--------------------------------------------------------------------------
    |
    | dentists, booking, modulus render inline via TemplatePlayground mock IDs.
    | visitor_url defaults point at /websites/{slug} on the portfolio origin.
    | news_crud supplies blog admin embed paths only.
    |
    */

    'external_templates' => [
        'dentists' => [
            'visitor_url' => rtrim((string) env('VISSAI_DENTISTS_TEMPLATE_URL', $portfolioBase.'/websites/dentists'), '/'),
            'admin_path' => (string) env('VISSAI_DENTISTS_TEMPLATE_ADMIN_PATH', '/pasiulymas'),
        ],
        'modulus' => [
            'visitor_url' => rtrim((string) env('VISSAI_MODULUS_TEMPLATE_URL', $portfolioBase.'/websites/modulus'), '/'),
            'admin_path' => (string) env('VISSAI_MODULUS_TEMPLATE_ADMIN_PATH', '/admin-hub'),
            'playground_handoff_key' => (string) env('SITE_ADMIN_PLAYGROUND_HANDOFF_KEY', 'vissai-modulus-playground-local'),
        ],
        'news_crud' => [
            'visitor_url' => rtrim((string) env('VISSAI_NEWS_CRUD_TEMPLATE_URL', $portfolioBase.'/websites/blog'), '/'),
            'admin_path' => (string) env('VISSAI_NEWS_CRUD_TEMPLATE_ADMIN_PATH', '/news/create'),
        ],
        'booking' => [
            'visitor_url' => rtrim((string) env('VISSAI_BOOKING_DEMO_URL', $portfolioBase.'/websites/booking'), '/'),
            'admin_path' => '/',
        ],
    ],

];
