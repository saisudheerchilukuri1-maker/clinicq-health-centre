const express = require('express');
const { initializeDatabase } = require('./database/initDb');
const doctorRoutes = require('./routes/doctorRoutes');
const roomRoutes = require('./routes/roomRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database (creates tables & seed records on startup)
initializeDatabase();

// Middleware
app.use(express.json());

// Basic request logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// API Root / Health Check
app.get('/', (req, res) => {
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

// Mount Routes
app.use('/doctors', doctorRoutes);
app.use('/rooms', roomRoutes);
app.use('/bookings', bookingRoutes);

// 404 and Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  ClinicQ Health Centre Backend Server Running`);
    console.log(`  Listening on: http://localhost:${PORT}`);
    console.log(`  Environment:  ${process.env.NODE_ENV || 'development'}`);
    console.log(`===============================================`);
  });
}

module.exports = app;
