const express = require('express');
const router = express.Router();

const doctorRoutes = require('./doctorRoutes');
const roomRoutes = require('./roomRoutes');
const bookingRoutes = require('./bookingRoutes');

/**
 * Root / Health Check Endpoint
 * Provides server status, version, and documentation map of available resources.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to ClinicQ Health Centre API',
    version: '1.0.0',
    documentation: {
      doctors: '/doctors',
      rooms: '/rooms',
      bookings: '/bookings',
      bookingDetails: '/bookings/details'
    }
  });
});

/**
 * Central Route Registration
 * Mounts all domain-specific routers to their respective endpoint paths.
 */
router.use('/doctors', doctorRoutes);
router.use('/rooms', roomRoutes);
router.use('/bookings', bookingRoutes);

// Expose child routers on the central router object for modular flexibility
router.doctorRoutes = doctorRoutes;
router.roomRoutes = roomRoutes;
router.bookingRoutes = bookingRoutes;

module.exports = router;
