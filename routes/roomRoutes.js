const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { validateIdParam, validateRoom, validateRoomQuery } = require('../middleware/validation');

// GET /rooms - Get all active rooms (supports ?floor= query)
router.get('/', validateRoomQuery, roomController.getAllRooms);

// GET /rooms/:id - Get one room (returns 404 if soft deleted)
router.get('/:id', validateIdParam('id'), roomController.getRoomById);

// POST /rooms - Add a room
router.post('/', validateRoom(false), roomController.createRoom);

// PUT /rooms/:id - Update a room
router.put('/:id', validateIdParam('id'), validateRoom(true), roomController.updateRoom);

// DELETE /rooms/:id - Soft delete a room (is_deleted -> 1)
router.delete('/:id', validateIdParam('id'), roomController.deleteRoom);

// POST /rooms/:id/restore - Restore a deleted room (is_deleted -> 0)
router.post('/:id/restore', validateIdParam('id'), roomController.restoreRoom);

module.exports = router;
