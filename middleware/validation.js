/**
 * Validation Middleware for ClinicQ Health Centre
 */

/**
 * Validates that an ID in route parameters is a positive integer
 */
function validateIdParam(paramName = 'id') {
  return (req, res, next) => {
    const rawVal = req.params[paramName];
    const parsed = Number(rawVal);

    if (!Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== String(rawVal).trim()) {
      return res.status(400).json({
        success: false,
        message: `Invalid identifier '${rawVal}'. Parameter :${paramName} must be a positive integer.`
      });
    }

    req.params[paramName] = parsed;
    next();
  };
}

/**
 * Validates Doctor request body for POST (create) and PUT (update)
 */
function validateDoctor(isUpdate = false) {
  return (req, res, next) => {
    const { name, specialization } = req.body || {};
    const errors = [];

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Request body must be a valid JSON object'
      });
    }

    if (isUpdate) {
      if (name === undefined && specialization === undefined) {
        return res.status(400).json({
          success: false,
          message: 'At least one field (name or specialization) must be provided for update'
        });
      }
    } else {
      if (name === undefined || name === null) {
        errors.push("Field 'name' is required");
      }
      if (specialization === undefined || specialization === null) {
        errors.push("Field 'specialization' is required");
      }
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.push("Field 'name' must be a non-empty string");
      } else if (name.trim().length < 2) {
        errors.push("Field 'name' must be at least 2 characters long");
      }
    }

    if (specialization !== undefined) {
      if (typeof specialization !== 'string' || specialization.trim().length === 0) {
        errors.push("Field 'specialization' must be a non-empty string");
      } else if (specialization.trim().length < 2) {
        errors.push("Field 'specialization' must be at least 2 characters long");
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Input validation failed',
        errors
      });
    }

    // Clean trimmed fields
    if (name !== undefined) req.body.name = name.trim();
    if (specialization !== undefined) req.body.specialization = specialization.trim();

    next();
  };
}

/**
 * Validates Room request body for POST (create) and PUT (update)
 */
function validateRoom(isUpdate = false) {
  return (req, res, next) => {
    const { name, floor } = req.body || {};
    const errors = [];

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Request body must be a valid JSON object'
      });
    }

    if (isUpdate) {
      if (name === undefined && floor === undefined) {
        return res.status(400).json({
          success: false,
          message: 'At least one field (name or floor) must be provided for update'
        });
      }
    } else {
      if (name === undefined || name === null) {
        errors.push("Field 'name' is required");
      }
      if (floor === undefined || floor === null) {
        errors.push("Field 'floor' is required");
      }
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.push("Field 'name' must be a non-empty string");
      } else if (name.trim().length < 2) {
        errors.push("Field 'name' must be at least 2 characters long");
      }
    }

    if (floor !== undefined) {
      const parsedFloor = Number(floor);
      if (!Number.isInteger(parsedFloor) || isNaN(parsedFloor)) {
        errors.push("Field 'floor' must be a valid integer");
      } else if (parsedFloor < -5 || parsedFloor > 100) {
        errors.push("Field 'floor' must be between -5 and 100");
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Input validation failed',
        errors
      });
    }

    if (name !== undefined) req.body.name = name.trim();
    if (floor !== undefined) req.body.floor = Number(floor);

    next();
  };
}

/**
 * Validates query parameters for GET /rooms (e.g., ?floor=2)
 */
function validateRoomQuery(req, res, next) {
  if (req.query.floor !== undefined) {
    const parsedFloor = Number(req.query.floor);
    if (!Number.isInteger(parsedFloor) || isNaN(parsedFloor)) {
      return res.status(400).json({
        success: false,
        message: "Query parameter 'floor' must be a valid integer"
      });
    }
    req.query.floor = parsedFloor;
  }
  next();
}

/**
 * Validates calendar date string YYYY-MM-DD
 */
function isValidDateString(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return false;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  const dateObj = new Date(year, month - 1, day);
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  );
}

/**
 * Validates time string HH:MM (24-hour format)
 */
function isValidTimeString(timeStr) {
  if (typeof timeStr !== 'string') return false;
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(timeStr);
}

/**
 * Validates Booking request body for POST (create) and PUT (update)
 */
function validateBooking(isUpdate = false) {
  return (req, res, next) => {
    const { doctor_id, room_id, booking_date, booking_time } = req.body || {};
    const errors = [];

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Request body must be a valid JSON object'
      });
    }

    if (isUpdate) {
      if (
        doctor_id === undefined &&
        room_id === undefined &&
        booking_date === undefined &&
        booking_time === undefined
      ) {
        return res.status(400).json({
          success: false,
          message:
            'At least one field (doctor_id, room_id, booking_date, or booking_time) must be provided for update'
        });
      }
    } else {
      if (doctor_id === undefined || doctor_id === null) {
        errors.push("Field 'doctor_id' is required");
      }
      if (room_id === undefined || room_id === null) {
        errors.push("Field 'room_id' is required");
      }
      if (booking_date === undefined || booking_date === null) {
        errors.push("Field 'booking_date' is required");
      }
      if (booking_time === undefined || booking_time === null) {
        errors.push("Field 'booking_time' is required");
      }
    }

    if (doctor_id !== undefined) {
      const parsedDocId = Number(doctor_id);
      if (!Number.isInteger(parsedDocId) || parsedDocId <= 0) {
        errors.push("Field 'doctor_id' must be a positive integer");
      } else {
        req.body.doctor_id = parsedDocId;
      }
    }

    if (room_id !== undefined) {
      const parsedRoomId = Number(room_id);
      if (!Number.isInteger(parsedRoomId) || parsedRoomId <= 0) {
        errors.push("Field 'room_id' must be a positive integer");
      } else {
        req.body.room_id = parsedRoomId;
      }
    }

    if (booking_date !== undefined) {
      if (!isValidDateString(booking_date)) {
        errors.push("Field 'booking_date' must be a valid date in YYYY-MM-DD format (e.g. 2026-11-20)");
      } else {
        req.body.booking_date = booking_date.trim();
      }
    }

    if (booking_time !== undefined) {
      if (!isValidTimeString(booking_time)) {
        errors.push("Field 'booking_time' must be a valid 24-hour time in HH:MM format (e.g. 14:30)");
      } else {
        req.body.booking_time = booking_time.trim();
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Input validation failed',
        errors
      });
    }

    next();
  };
}

module.exports = {
  validateIdParam,
  validateDoctor,
  validateRoom,
  validateRoomQuery,
  validateBooking
};
