<?php

namespace App\Support;

final class ModulusPlaygroundUrls
{
    /**
     * @return array<string, string>
     */
    public static function map(?string $currentPage = 'home'): array
    {
        $home = route('playground.template', ['template' => 'modulus']);

        $page = static function (string $slug) use ($home): string {
            if ($slug === 'home') {
                return $home;
            }

            return route('playground.modulus.page', ['page' => $slug]);
        };

        return [
            'home' => $page('home'),
            'about' => $page('about'),
            'process' => $page('process'),
            'gallery' => $page('gallery'),
            'pricing' => $page('pricing'),
            'reach_out' => $page('reach-out'),
            'booking' => $page('booking'),
            'admin' => $page('admin'),
            'privacy' => $page('privacy'),
            'terms' => $page('terms'),
            'cookies' => $page('cookies'),
        ];
    }
}
