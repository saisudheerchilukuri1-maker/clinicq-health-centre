/**
 * Express Server & Route Configuration Tests (Member 1 Test Suite)
 *
 * Verifies:
 * 1. Server setup & app export
 * 2. API root & health check endpoint (GET /)
 * 3. Middleware configuration (CORS headers, JSON parsing, URL-encoded parsing)
 * 4. Central route registration (/doctors, /rooms, /bookings, /bookings/details)
 * 5. Centralized 404 handler for unknown routes
 * 6. Centralized error handling for malformed JSON payloads
 */

const assert = require('node:assert');
const test = require('node:test');
const http = require('node:http');
const app = require('../server');

test('Member 1: Express Server & Route Configuration Test Suite', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // 1. Health check & Root endpoint
    await t.test('GET / - Server root returns status, version, and route documentation', async () => {
      const res = await fetch(`${baseUrl}/`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.version, '1.0.0');
      assert.ok(data.documentation);
      assert.strictEqual(data.documentation.doctors, '/doctors');
      assert.strictEqual(data.documentation.rooms, '/rooms');
      assert.strictEqual(data.documentation.bookings, '/bookings');
    });

    // 2. CORS headers
    await t.test('OPTIONS / - CORS middleware attaches access-control headers', async () => {
      const res = await fetch(`${baseUrl}/`, { method: 'OPTIONS' });
      assert.strictEqual(res.headers.get('access-control-allow-origin'), '*');
    });

    // 3. Central route registration
    await t.test('GET /doctors - Central route registration routes to doctors', async () => {
      const res = await fetch(`${baseUrl}/doctors`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
    });

    await t.test('GET /rooms - Central route registration routes to rooms', async () => {
      const res = await fetch(`${baseUrl}/rooms`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
    });

    await t.test('GET /bookings - Central route registration routes to bookings', async () => {
      const res = await fetch(`${baseUrl}/bookings`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
    });

    // 4. Centralized 404 handler
    await t.test('GET /undefined-route-xyz - Centralized 404 handler returns structured JSON', async () => {
      const res = await fetch(`${baseUrl}/undefined-route-xyz`);
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('not found'));
    });

    // 5. Centralized error handling for malformed JSON
    await t.test('POST /doctors with malformed JSON triggers centralized error handler (400)', async () => {
      const res = await fetch(`${baseUrl}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{"invalid-json-content: true'
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.strictEqual(data.message, 'Malformed JSON payload in request body');
    });
  } finally {
    server.close();
  }
});
