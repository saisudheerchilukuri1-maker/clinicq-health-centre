const db = require('../config/database');

/**
 * Booking Controller for ClinicQ Health Centre
 * Implements CRUD, conflict detection (409), relational validation, and SQL JOIN details
 */

// GET /bookings
function getAllBookings(req, res, next) {
  try {
    const stmt = db.prepare(`
      SELECT id, doctor_id, room_id, booking_date, booking_time, created_at
      FROM bookings
      ORDER BY booking_date ASC, booking_time ASC, id ASC
    `);
    const bookings = stmt.all();

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings
    });
  } catch (error) {
    next(error);
  }
}

// GET /bookings/details (JOIN query combining Bookings, Doctors, and Rooms)
function getBookingDetails(req, res, next) {
  try {
    const stmt = db.prepare(`
      SELECT 
        b.id AS booking_id,
        b.booking_date,
        b.booking_time,
        b.created_at AS booking_created_at,
        d.id AS doctor_id,
        d.name AS doctor_name,
        d.specialization AS doctor_specialization,
        r.id AS room_id,
        r.name AS room_name,
        r.floor AS room_floor,
        r.is_deleted AS room_is_deleted
      FROM bookings b
      INNER JOIN doctors d ON b.doctor_id = d.id
      INNER JOIN rooms r ON b.room_id = r.id
      ORDER BY b.booking_date ASC, b.booking_time ASC, b.id ASC
    `);
    const details = stmt.all();

    res.status(200).json({
      success: true,
      count: details.length,
      data: details
    });
  } catch (error) {
    next(error);
  }
}

// GET /bookings/:id
function getBookingById(req, res, next) {
  try {
    const bookingId = req.params.id;
    const stmt = db.prepare(`
      SELECT id, doctor_id, room_id, booking_date, booking_time, created_at
      FROM bookings
      WHERE id = ?
    `);
    const booking = stmt.get(bookingId);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: `Booking with id ${bookingId} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
}

// POST /bookings
function createBooking(req, res, next) {
  try {
    const { doctor_id, room_id, booking_date, booking_time } = req.body;

    // 1. Verify Doctor exists
    const doctor = db.prepare('SELECT id, name FROM doctors WHERE id = ?').get(doctor_id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor with id ${doctor_id} not found`
      });
    }

    // 2. Verify Room exists
    const room = db.prepare('SELECT id, name, is_deleted FROM rooms WHERE id = ?').get(room_id);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room with id ${room_id} not found`
      });
    }

    // 3. Verify Room is not soft-deleted
    if (room.is_deleted === 1) {
      return res.status(400).json({
        success: false,
        message: `Cannot book room '${room.name}' (id ${room_id}) because it has been deactivated/deleted`
      });
    }

    // 4. Check for room booking conflict (same room at same date & time)
    const roomConflict = db.prepare(`
      SELECT id FROM bookings
      WHERE room_id = ? AND booking_date = ? AND booking_time = ?
    `).get(room_id, booking_date, booking_time);

    if (roomConflict) {
      return res.status(409).json({
        success: false,
        message: `Booking conflict: Room '${room.name}' (id ${room_id}) is already booked for date ${booking_date} at ${booking_time}`
      });
    }

    // 5. Check for doctor booking conflict (same doctor at same date & time)
    const doctorConflict = db.prepare(`
      SELECT id FROM bookings
      WHERE doctor_id = ? AND booking_date = ? AND booking_time = ?
    `).get(doctor_id, booking_date, booking_time);

    if (doctorConflict) {
      return res.status(409).json({
        success: false,
        message: `Booking conflict: Doctor '${doctor.name}' (id ${doctor_id}) is already scheduled for date ${booking_date} at ${booking_time}`
      });
    }

    // 6. Insert new booking
    const stmt = db.prepare(`
      INSERT INTO bookings (doctor_id, room_id, booking_date, booking_time)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(doctor_id, room_id, booking_date, booking_time);
    const newBooking = db.prepare('SELECT id, doctor_id, room_id, booking_date, booking_time, created_at FROM bookings WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: newBooking
    });
  } catch (error) {
    next(error);
  }
}

// PUT /bookings/:id
function updateBooking(req, res, next) {
  try {
    const bookingId = req.params.id;
    const { doctor_id, room_id, booking_date, booking_time } = req.body;

    const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Booking with id ${bookingId} not found`
      });
    }

    const targetDoctorId = doctor_id !== undefined ? doctor_id : existing.doctor_id;
    const targetRoomId = room_id !== undefined ? room_id : existing.room_id;
    const targetDate = booking_date !== undefined ? booking_date : existing.booking_date;
    const targetTime = booking_time !== undefined ? booking_time : existing.booking_time;

    // Verify Doctor if changed or checking
    const doctor = db.prepare('SELECT id, name FROM doctors WHERE id = ?').get(targetDoctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor with id ${targetDoctorId} not found`
      });
    }

    // Verify Room if changed or checking
    const room = db.prepare('SELECT id, name, is_deleted FROM rooms WHERE id = ?').get(targetRoomId);
    if (!room) {
      return res.status(404).json({
        success: false,
        message: `Room with id ${targetRoomId} not found`
      });
    }

    if (room.is_deleted === 1) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign booking to room '${room.name}' (id ${targetRoomId}) because it is deactivated/deleted`
      });
    }

    // Check room conflict excluding current booking
    const roomConflict = db.prepare(`
      SELECT id FROM bookings
      WHERE room_id = ? AND booking_date = ? AND booking_time = ? AND id != ?
    `).get(targetRoomId, targetDate, targetTime, bookingId);

    if (roomConflict) {
      return res.status(409).json({
        success: false,
        message: `Booking conflict: Room '${room.name}' (id ${targetRoomId}) is already booked for date ${targetDate} at ${targetTime}`
      });
    }

    // Check doctor conflict excluding current booking
    const doctorConflict = db.prepare(`
      SELECT id FROM bookings
      WHERE doctor_id = ? AND booking_date = ? AND booking_time = ? AND id != ?
    `).get(targetDoctorId, targetDate, targetTime, bookingId);

    if (doctorConflict) {
      return res.status(409).json({
        success: false,
        message: `Booking conflict: Doctor '${doctor.name}' (id ${targetDoctorId}) is already scheduled for date ${targetDate} at ${targetTime}`
      });
    }

    const stmt = db.prepare(`
      UPDATE bookings
      SET doctor_id = ?, room_id = ?, booking_date = ?, booking_time = ?
      WHERE id = ?
    `);

    stmt.run(targetDoctorId, targetRoomId, targetDate, targetTime, bookingId);

    const updatedBooking = db.prepare('SELECT id, doctor_id, room_id, booking_date, booking_time, created_at FROM bookings WHERE id = ?').get(bookingId);

    res.status(200).json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /bookings/:id
function deleteBooking(req, res, next) {
  try {
    const bookingId = req.params.id;

    const existing = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Booking with id ${bookingId} not found`
      });
    }

    const stmt = db.prepare('DELETE FROM bookings WHERE id = ?');
    stmt.run(bookingId);

    res.status(200).json({
      success: true,
      message: `Booking with id ${bookingId} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllBookings,
  getBookingDetails,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking
};
