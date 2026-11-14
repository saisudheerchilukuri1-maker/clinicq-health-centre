/**
 * Comprehensive API Test Suite for ClinicQ Health Centre
 *
 * Verifies:
 * - Server health check
 * - Doctors CRUD + specialization query
 * - Rooms CRUD + floor query
 * - Bookings CRUD
 * - SQL JOIN endpoint (/bookings/details)
 * - Input validation & HTTP 400 responses
 * - Non-existent resource handling & HTTP 404 responses
 * - Booking conflicts (duplicate room/doctor time slots) & HTTP 409 responses
 * - Attempt to book soft-deleted room & HTTP 400 response
 */

const assert = require('node:assert');
const test = require('node:test');
const http = require('node:http');
const app = require('../server');

test('ClinicQ Health Centre Full API Test Suite', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let createdDoctorId;
  let createdRoomId;
  let createdBookingId;

  try {
    // 1. HEALTH CHECK
    await t.test('GET / - API health check', async () => {
      const res = await fetch(`${baseUrl}/`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.message.includes('ClinicQ Health Centre'));
    });

    // 2. DOCTORS ENDPOINTS
    await t.test('GET /doctors - Retrieve all doctors', async () => {
      const res = await fetch(`${baseUrl}/doctors`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.length >= 4);
    });

    await t.test('GET /doctors?specialization=Cardiology - Filter doctors', async () => {
      const res = await fetch(`${baseUrl}/doctors?specialization=Cardiology`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.data.length >= 1);
      assert.ok(data.data.every((d) => d.specialization.toLowerCase().includes('cardio')));
    });

    await t.test('GET /doctors/1 - Retrieve doctor by id', async () => {
      const res = await fetch(`${baseUrl}/doctors/1`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.id, 1);
      assert.strictEqual(typeof data.data.name, 'string');
    });

    await t.test('GET /doctors/9999 - Return 404 for non-existent doctor', async () => {
      const res = await fetch(`${baseUrl}/doctors/9999`);
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    await t.test('POST /doctors - Create new doctor', async () => {
      const res = await fetch(`${baseUrl}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Dr. Gregory House',
          specialization: 'Diagnostic Medicine'
        })
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.name, 'Dr. Gregory House');
      createdDoctorId = data.data.id;
    });

    await t.test('POST /doctors - Validation failure for empty fields (400)', async () => {
      const res = await fetch(`${baseUrl}/doctors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '   ',
          specialization: ''
        })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.errors.length > 0);
    });

    await t.test('PUT /doctors/:id - Update doctor', async () => {
      const res = await fetch(`${baseUrl}/doctors/${createdDoctorId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          specialization: 'Infectious Disease & Diagnostics'
        })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.specialization, 'Infectious Disease & Diagnostics');
    });

    await t.test('DELETE /doctors/1 - Refuse deletion of doctor with active bookings (400)', async () => {
      const res = await fetch(`${baseUrl}/doctors/1`, {
        method: 'DELETE'
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('associated booking'));
    });

    // 3. ROOMS ENDPOINTS & SEARCH
    await t.test('GET /rooms - Retrieve all active rooms', async () => {
      const res = await fetch(`${baseUrl}/rooms`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.every((r) => r.is_deleted === 0));
    });

    await t.test('GET /rooms?floor=2 - Search rooms by floor', async () => {
      const res = await fetch(`${baseUrl}/rooms?floor=2`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(data.data.length >= 1);
      assert.ok(data.data.every((r) => r.floor === 2 && r.is_deleted === 0));
    });

    await t.test('GET /rooms?floor=invalid - Return 400 for bad floor query param', async () => {
      const res = await fetch(`${baseUrl}/rooms?floor=ground`);
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    await t.test('POST /rooms - Create new room', async () => {
      const res = await fetch(`${baseUrl}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'VIP Clinic 401',
          floor: 4
        })
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.name, 'VIP Clinic 401');
      assert.strictEqual(data.data.floor, 4);
      assert.strictEqual(data.data.is_deleted, 0);
      createdRoomId = data.data.id;
    });

    await t.test('POST /rooms - Validation failure for missing floor (400)', async () => {
      const res = await fetch(`${baseUrl}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Incomplete Room'
        })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    await t.test('PUT /rooms/:id - Update room', async () => {
      const res = await fetch(`${baseUrl}/rooms/${createdRoomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Executive VIP Suite 401'
        })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.name, 'Executive VIP Suite 401');
    });

    // 4. BOOKINGS ENDPOINTS & JOIN DETAILS
    await t.test('GET /bookings - Retrieve all bookings', async () => {
      const res = await fetch(`${baseUrl}/bookings`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.length >= 4);
    });

    await t.test('GET /bookings/details - SQL JOIN combining doctors, rooms, bookings', async () => {
      const res = await fetch(`${baseUrl}/bookings/details`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.ok(Array.isArray(data.data));
      assert.ok(data.data.length >= 4);

      // Verify JOIN fields exist
      const sample = data.data[0];
      assert.ok('booking_id' in sample);
      assert.ok('booking_date' in sample);
      assert.ok('booking_time' in sample);
      assert.ok('doctor_name' in sample);
      assert.ok('doctor_specialization' in sample);
      assert.ok('room_name' in sample);
      assert.ok('room_floor' in sample);
    });

    await t.test('POST /bookings - Create new valid booking', async () => {
      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: createdDoctorId,
          room_id: createdRoomId,
          booking_date: '2026-12-01',
          booking_time: '15:00'
        })
      });
      assert.strictEqual(res.status, 201);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.doctor_id, createdDoctorId);
      assert.strictEqual(data.data.room_id, createdRoomId);
      createdBookingId = data.data.id;
    });

    await t.test('POST /bookings - Conflict detection for same room, date, and time (409)', async () => {
      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: 1, // Different doctor
          room_id: createdRoomId, // Same room
          booking_date: '2026-12-01',
          booking_time: '15:00'
        })
      });
      assert.strictEqual(res.status, 409);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Booking conflict'));
    });

    await t.test('POST /bookings - Conflict detection for same doctor at same date and time (409)', async () => {
      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: createdDoctorId, // Same doctor
          room_id: 1, // Different room
          booking_date: '2026-12-01',
          booking_time: '15:00'
        })
      });
      assert.strictEqual(res.status, 409);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Booking conflict'));
    });

    await t.test('POST /bookings - Validation failure on invalid date format (400)', async () => {
      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: createdDoctorId,
          room_id: createdRoomId,
          booking_date: '2026-02-31', // Invalid day
          booking_time: '15:00'
        })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    await t.test('POST /bookings - Validation failure on invalid time format (400)', async () => {
      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: createdDoctorId,
          room_id: createdRoomId,
          booking_date: '2026-12-05',
          booking_time: '25:99' // Invalid time
        })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
    });

    await t.test('POST /bookings - 404 for non-existent doctor', async () => {
      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: 99999,
          room_id: createdRoomId,
          booking_date: '2026-12-05',
          booking_time: '11:00'
        })
      });
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('Doctor with id 99999 not found'));
    });

    await t.test('POST /bookings - 400 when attempting to book a soft-deleted room', async () => {
      // Create a room and soft delete it
      const tempRoomRes = await fetch(`${baseUrl}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Temp Room for Delete Test', floor: 1 })
      });
      const tempRoom = (await tempRoomRes.json()).data;

      // Soft delete it
      await fetch(`${baseUrl}/rooms/${tempRoom.id}`, { method: 'DELETE' });

      // Attempt to book it
      const res = await fetch(`${baseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctor_id: 1,
          room_id: tempRoom.id,
          booking_date: '2026-12-10',
          booking_time: '09:00'
        })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.success, false);
      assert.ok(data.message.includes('deactivated/deleted'));
    });

    await t.test('PUT /bookings/:id - Update booking time', async () => {
      const res = await fetch(`${baseUrl}/bookings/${createdBookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_time: '16:00'
        })
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
      assert.strictEqual(data.data.booking_time, '16:00');
    });

    await t.test('DELETE /bookings/:id - Delete booking', async () => {
      const res = await fetch(`${baseUrl}/bookings/${createdBookingId}`, {
        method: 'DELETE'
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);

      // Verify deletion
      const getRes = await fetch(`${baseUrl}/bookings/${createdBookingId}`);
      assert.strictEqual(getRes.status, 404);
    });

    await t.test('DELETE /doctors/:id - Clean up doctor without bookings', async () => {
      const res = await fetch(`${baseUrl}/doctors/${createdDoctorId}`, {
        method: 'DELETE'
      });
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.success, true);
    });
  } finally {
    server.close();
  }
});
