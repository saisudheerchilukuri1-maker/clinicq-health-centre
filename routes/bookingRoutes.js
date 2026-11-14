const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { validateIdParam, validateBooking } = require('../middleware/validation');

// GET /bookings - Get all bookings
router.get('/', bookingController.getAllBookings);

// GET /bookings/details - JOIN endpoint combining Doctors, Rooms, and Bookings
// Placed before /:id to prevent route shadowing
router.get('/details', bookingController.getBookingDetails);

// GET /bookings/:id - Get one booking
router.get('/:id', validateIdParam('id'), bookingController.getBookingById);

// POST /bookings - Create a booking
router.post('/', validateBooking(false), bookingController.createBooking);

// PUT /bookings/:id - Update a booking
router.put('/:id', validateIdParam('id'), validateBooking(true), bookingController.updateBooking);

// DELETE /bookings/:id - Delete a booking
router.delete('/:id', validateIdParam('id'), bookingController.deleteBooking);

module.exports = router;
