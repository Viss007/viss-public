@php
    use App\Support\ModulusPlaygroundBooking;

    $bookings = ModulusPlaygroundBooking::allBookings();
@endphp
@include('livewire.templates.partials.modulus-playground.admin-hub-inner')
