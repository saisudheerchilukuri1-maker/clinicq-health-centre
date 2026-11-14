const db = require('../config/database');

/**
 * Room Controller for ClinicQ Health Centre
 * Implements full CRUD, floor-based search, and soft delete / restore functionality
 */

// GET /rooms (supports optional ?floor= query param; returns ONLY active rooms)
function getAllRooms(req, res, next) {
  try {
    const { floor } = req.query;
    let rooms;

    if (floor !== undefined) {
      const stmt = db.prepare(`
        SELECT id, name, floor, is_deleted, created_at
        FROM rooms
        WHERE is_deleted = 0 AND floor = ?
        ORDER BY id ASC
      `);
      rooms = stmt.all(floor);
    } else {
      const stmt = db.prepare(`
        SELECT id, name, floor, is_deleted, created_at
        FROM rooms
        WHERE is_deleted = 0
        ORDER BY id ASC
      `);
      rooms = stmt.all();
    }

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    next(error);
  }
}

// GET /rooms/:id (returns 404 if soft deleted or not found)
function getRoomById(req, res, next) {
  try {
    const roomId = req.params.id;
    const stmt = db.prepare(`
      SELECT id, name, floor, is_deleted, created_at
      FROM rooms
      WHERE id = ?
    `);
    const room = stmt.get(roomId);

    // If room does not exist OR is soft deleted (is_deleted === 1), return 404
    if (!room || room.is_deleted === 1) {
      return res.status(404).json({
        success: false,
        message: `Room with id ${roomId} not found or has been deactivated`
      });
    }

    res.status(200).json({
      success: true,
      data: room
    });
  } catch (error) {
    next(error);
  }
}

// POST /rooms
function createRoom(req, res, next) {
  try {
    const { name, floor } = req.body;

    const stmt = db.prepare(`
      INSERT INTO rooms (name, floor, is_deleted)
      VALUES (?, ?, 0)
    `);

    const result = stmt.run(name, floor);
    const newRoom = db.prepare('SELECT id, name, floor, is_deleted, created_at FROM rooms WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: newRoom
    });
  } catch (error) {
    next(error);
  }
}

// PUT /rooms/:id
function updateRoom(req, res, next) {
  try {
    const roomId = req.params.id;
    const { name, floor } = req.body;

    const existing = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!existing || existing.is_deleted === 1) {
      return res.status(404).json({
        success: false,
        message: `Room with id ${roomId} not found or has been deactivated`
      });
    }

    const updatedName = name !== undefined ? name : existing.name;
    const updatedFloor = floor !== undefined ? floor : existing.floor;

    const stmt = db.prepare(`
      UPDATE rooms
      SET name = ?, floor = ?
      WHERE id = ?
    `);

    stmt.run(updatedName, updatedFloor, roomId);

    const updatedRoom = db.prepare('SELECT id, name, floor, is_deleted, created_at FROM rooms WHERE id = ?').get(roomId);

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: updatedRoom
    });
  } catch (error) {
    next(error);
  }
}

// DELETE /rooms/:id (SOFT DELETE: changes is_deleted from 0 to 1)
function deleteRoom(req, res, next) {
  try {
    const roomId = req.params.id;

    const existing = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Room with id ${roomId} not found`
      });
    }

    const stmt = db.prepare(`
      UPDATE rooms
      SET is_deleted = 1
      WHERE id = ?
    `);

    stmt.run(roomId);

    res.status(200).json({
      success: true,
      message: `Room with id ${roomId} soft deleted successfully`
    });
  } catch (error) {
    next(error);
  }
}

// POST /rooms/:id/restore (RESTORE: changes is_deleted from 1 to 0)
function restoreRoom(req, res, next) {
  try {
    const roomId = req.params.id;

    const existing = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Room with id ${roomId} not found`
      });
    }

    const stmt = db.prepare(`
      UPDATE rooms
      SET is_deleted = 0
      WHERE id = ?
    `);

    stmt.run(roomId);

    const restoredRoom = db.prepare('SELECT id, name, floor, is_deleted, created_at FROM rooms WHERE id = ?').get(roomId);

    res.status(200).json({
      success: true,
      message: `Room with id ${roomId} restored successfully`,
      data: restoredRoom
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  restoreRoom
};
