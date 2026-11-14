const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { validateIdParam, validateDoctor } = require('../middleware/validation');

// GET /doctors - Get all doctors (supports ?specialization= query)
router.get('/', doctorController.getAllDoctors);

// GET /doctors/:id - Get one doctor
router.get('/:id', validateIdParam('id'), doctorController.getDoctorById);

// POST /doctors - Add a doctor
router.post('/', validateDoctor(false), doctorController.createDoctor);

// PUT /doctors/:id - Update a doctor
router.put('/:id', validateIdParam('id'), validateDoctor(true), doctorController.updateDoctor);

// DELETE /doctors/:id - Delete a doctor
router.delete('/:id', validateIdParam('id'), doctorController.deleteDoctor);

module.exports = router;
