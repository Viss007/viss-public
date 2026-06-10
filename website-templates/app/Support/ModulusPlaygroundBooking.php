<?php

namespace App\Support;

use DateTimeImmutable;
use Illuminate\Support\Str;

/** Demo booking data for Modulus playground — mirrors 8124 slot shape without leaving :3333. */
final class ModulusPlaygroundBooking
{
    /** @var list<array{id: string, name: string, durationMinutes: int, description: string}> */
    private const SERVICES = [
        ['id' => 'consultation', 'name' => 'Initial consultation', 'durationMinutes' => 30, 'description' => 'Discuss your project scope, budget, and timeline with our team.'],
        ['id' => 'design_session', 'name' => 'Design & customization', 'durationMinutes' => 60, 'description' => 'Floor plans, finishes, and options tailored to your site.'],
        ['id' => 'site_survey', 'name' => 'Site survey & feasibility', 'durationMinutes' => 90, 'description' => 'On-site assessment for access, utilities, and foundation requirements.'],
        ['id' => 'showroom_visit', 'name' => 'Showroom & model tour', 'durationMinutes' => 60, 'description' => 'Tour modular units, layouts, and material samples.'],
    ];

    private const SESSION_KEY = 'modulus_playground_bookings';

    /** @return list<array{id: string, name: string, durationMinutes: int, description: string}> */
    public static function services(): array
    {
        return self::SERVICES;
    }

    /** @return array<string, list<array{start: string, label: string, taken: bool}>> */
    public static function slots(): array
    {
        $booked = [];
        foreach (self::bookedSlotKeys() as $k) {
            $booked[$k] = true;
        }

        return self::generateSlots(new DateTimeImmutable, $booked);
    }

    /** @return list<array<string, mixed>> */
    public static function allBookings(): array
    {
        $items = self::bookings();
        usort($items, fn ($a, $b) => strcmp((string) ($b['createdAt'] ?? ''), (string) ($a['createdAt'] ?? '')));

        return $items;
    }

    /** @return list<string> */
    public static function bookedSlotKeys(): array
    {
        $keys = [];
        foreach (self::bookings() as $b) {
            $start = (string) ($b['startIso'] ?? '');
            if ($start !== '') {
                $keys[] = $start;
            }
        }

        return $keys;
    }

    /**
     * @param  array{serviceId: string, startIso: string, patientName: string, patientPhone: string, patientEmail: string, comment?: string|null}  $input
     * @return array<string, mixed>
     */
    public static function create(array $input): array
    {
        $svc = null;
        foreach (self::SERVICES as $s) {
            if ($s['id'] === ($input['serviceId'] ?? '')) {
                $svc = $s;
                break;
            }
        }
        if ($svc === null) {
            throw new \InvalidArgumentException('Unknown session type (serviceId).');
        }

        foreach (['startIso', 'patientName', 'patientPhone', 'patientEmail'] as $field) {
            if (! is_string($input[$field] ?? null) || trim((string) $input[$field]) === '') {
                throw new \InvalidArgumentException("Missing field: {$field}.");
            }
        }

        $occupied = array_flip(self::bookedSlotKeys());
        if (isset($occupied[$input['startIso']])) {
            throw new \RuntimeException('That time slot is no longer available.');
        }

        $booking = [
            'id' => (string) Str::uuid(),
            'serviceId' => $svc['id'],
            'serviceName' => $svc['name'],
            'startIso' => $input['startIso'],
            'durationMinutes' => $svc['durationMinutes'],
            'patientName' => trim($input['patientName']),
            'patientPhone' => trim($input['patientPhone']),
            'patientEmail' => trim($input['patientEmail']),
            'comment' => isset($input['comment']) && is_string($input['comment']) && trim($input['comment']) !== ''
                ? trim($input['comment'])
                : null,
            'createdAt' => (new DateTimeImmutable)->format(DATE_ATOM),
        ];

        $all = self::bookings();
        $all[] = $booking;
        session([self::SESSION_KEY => $all]);

        return $booking;
    }

    /** @return list<array<string, mixed>> */
    private static function bookings(): array
    {
        $v = session(self::SESSION_KEY, []);

        return is_array($v) ? $v : [];
    }

    /**
     * @param  array<string, true>  $booked
     * @return array<string, list<array{start: string, label: string, taken: bool}>>
     */
    private static function generateSlots(DateTimeImmutable $from, array $booked): array
    {
        $out = [];
        $base = $from->setTime(0, 0, 0);
        $now = new DateTimeImmutable;

        for ($d = 0; $d < 30; $d++) {
            $day = $base->modify("+{$d} days");
            if ((int) $day->format('N') > 5) {
                continue;
            }

            $dayKey = $day->format('Y-m-d');
            $slots = [];

            for ($h = 9; $h < 17; $h++) {
                for ($m = 0; $m < 60; $m += 30) {
                    $start = $day->setTime($h, $m, 0);
                    if ($start < $now) {
                        continue;
                    }

                    $iso = $start->format('Y-m-d\TH:i');
                    $hash = (crc32("{$dayKey}|{$iso}") & 0xFFFFFFFF) / 4294967295.0;
                    $slots[] = [
                        'start' => $iso,
                        'label' => $start->format('H:i'),
                        'taken' => $hash < 0.3 || isset($booked[$iso]),
                    ];
                }
            }

            if ($slots !== []) {
                $out[$dayKey] = $slots;
            }
        }

        return $out;
    }
}
