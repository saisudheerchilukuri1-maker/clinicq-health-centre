/**
 * ClinicQ Health Centre - Express Server Entry Point
 *
 * Responsibilities:
 * 1. Express server setup and configuration
 * 2. Middleware configuration (CORS, body parsers, request logger)
 * 3. Central route registration
 * 4. Centralized error-handling integration
 * 5. Server startup lifecycle and graceful shutdown
 */

const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./database/initDb');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Server environment and port configuration
const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const NODE_ENV = process.env.NODE_ENV || 'development';

// 1. EXPRESS SERVER SETUP
const app = express();
app.disable('x-powered-by');

// Initialize database (creates tables & seed records on startup)
initializeDatabase();

// 2. MIDDLEWARE CONFIGURATION
// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// HTTP request logger middleware (disabled in test environment)
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  if (process.env.NODE_ENV !== 'test') {
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// 3. CENTRAL ROUTE REGISTRATION
// Mount the central router at root, dispatching to /, /doctors, /rooms, /bookings
app.use('/', routes);

// 4. CENTRALIZED ERROR-HANDLING INTEGRATION
// Catch 404 for undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// 5. SERVER STARTUP AND LIFECYCLE MANAGEMENT
let server;

if (require.main === module) {
  server = app.listen(PORT, HOST, () => {
    console.log(`===============================================`);
    console.log(`  ClinicQ Health Centre Backend Server Running`);
    console.log(`  Listening on: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
    console.log(`  Environment:  ${NODE_ENV}`);
    console.log(`  PID:          ${process.pid}`);
    console.log(`===============================================`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please choose another port via PORT env variable.`);
    } else {
      console.error('Server failed to start:', err.message);
    }
    process.exit(1);
  });

  // Graceful shutdown handling
  const handleShutdown = (signal) => {
    console.log(`\n[${signal}] Initiating graceful shutdown...`);
    server.close(() => {
      console.log('HTTP server closed.');
      try {
        const db = require('./config/database');
        db.close();
        console.log('Database connection closed.');
      } catch (err) {
        console.error('Error closing database connection:', err.message);
      }
      process.exit(0);
    });

    // Force shutdown after timeout if connections fail to close promptly
    setTimeout(() => {
      console.error('Forcefully terminating process due to shutdown timeout.');
      process.exit(1);
    }, 5000).unref();
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });
}

module.exports = app;
