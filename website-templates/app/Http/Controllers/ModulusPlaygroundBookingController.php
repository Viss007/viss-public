<?php

namespace App\Http\Controllers;

use App\Support\ModulusPlaygroundBooking;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class ModulusPlaygroundBookingController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        if ($request->query('mode') === 'slots') {
            return response()->json(['ok' => true, 'slots' => ModulusPlaygroundBooking::slots()]);
        }

        return response()->json(['ok' => true, 'bookings' => []]);
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $booking = ModulusPlaygroundBooking::create($request->all());

            return response()->json(['ok' => true, 'booking' => $booking], 201);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 400);
        } catch (\RuntimeException $e) {
            return response()->json(['ok' => false, 'error' => $e->getMessage()], 409);
        } catch (\Throwable) {
            return response()->json(['ok' => false, 'error' => 'Something went wrong. Please try again.'], 500);
        }
    }
}
