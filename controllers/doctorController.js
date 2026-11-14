const db = require('../config/database');

/**
 * Doctor Controller for ClinicQ Health Centre
 */

// GET /doctors (supports optional ?specialization= query param)
function getAllDoctors(req, res, next) {
  try {
    const { specialization } = req.query;
    let doctors;

    if (specialization && typeof specialization === 'string' && specialization.trim().length > 0) {
      const stmt = db.prepare(`
        SELECT id, name, specialization, created_at
        FROM doctors
        WHERE LOWER(specialization) LIKE LOWER(?)
        ORDER BY id ASC
      `);
      doctors = stmt.all(`%${specialization.trim()}%`);
    } else {
      const stmt = db.prepare(`
        SELECT id, name, specialization, created_at
        FROM doctors
        ORDER BY id ASC
      `);
      doctors = stmt.all();
    }

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
}

// GET /doctors/:id
function getDoctorById(req, res, next) {
  try {
    const doctorId = req.params.id;
    const stmt = db.prepare(`
      SELECT id, name, specialization, created_at
      FROM doctors
      WHERE id = ?
    `);
    const doctor = stmt.get(doctorId);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: `Doctor with id ${doctorId} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    next(error);
  }
}

// POST /doctors
function createDoctor(req, res, next) {
  try {
    const { name, specialization } = req.body;

    const stmt = db.prepare(`
      INSERT INTO doctors (name, specialization)
      VALUES (?, ?)
    `);

    const result = stmt.run(name, specialization);
    const newDoctor = db.prepare('SELECT id, name, specialization, created_at FROM doctors WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: newDoctor
    });
  } catch (error) {
    next(error);
  }
}

// PUT /doctors/:id
function updateDoctor(req, res, next) {
  try {
    const doctorId = req.params.id;
    const { name, specialization } = req.body;

    // Check if doctor exists
    const existing = db.prepare('SELECT * FROM doctors WHERE id = ?').get(doctorId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Doctor with id ${doctorId} not found`
      });
    }

    const updatedName = name !== undefined ? name : existing.name;
    const updatedSpecialization = specialization !== undefined ? specialization : existing.specialization;

    const stmt = db.prepare(`
      UPDATE doctors
      SET name = ?, specialization = ?
      WHERE id = ?
    `);

    stmt.run(updatedName, updatedSpecialization, doctorId);

    const updatedDoctor = db.prepare('SELECT id, name, specialization, created_at FROM doctors WHERE id = ?').get(doctorId);

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: updatedDoctor
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /doctors/:id
function deleteDoctor(req, res, next) {
  try {
    const doctorId = req.params.id;

    // Check if doctor exists
    const existing = db.prepare('SELECT * FROM doctors WHERE id = ?').get(doctorId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Doctor with id ${doctorId} not found`
      });
    }

    // Check for associated bookings
    const bookingsCheck = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE doctor_id = ?').get(doctorId);
    if (bookingsCheck.count > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete doctor with id ${doctorId} because ${bookingsCheck.count} associated booking(s) exist. Please delete or reassign bookings first.`
      });
    }

    const stmt = db.prepare('DELETE FROM doctors WHERE id = ?');
    stmt.run(doctorId);

    res.status(200).json({
      success: true,
      message: `Doctor with id ${doctorId} deleted successfully`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
};
