const db = require('../config/database');
const { seedDatabase } = require('./seedData');

function initializeDatabase() {
  // Ensure foreign keys are enabled
  db.pragma('foreign_keys = ON');

  // Create Doctors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK(trim(name) != ''),
      specialization TEXT NOT NULL CHECK(trim(specialization) != ''),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Rooms table (supports soft delete via is_deleted column default 0)
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK(trim(name) != ''),
      floor INTEGER NOT NULL,
      is_deleted INTEGER DEFAULT 0 CHECK(is_deleted IN (0, 1)),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create Bookings table with doctor_id and room_id foreign keys and uniqueness constraint
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doctor_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      booking_date TEXT NOT NULL CHECK(booking_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
      booking_time TEXT NOT NULL CHECK(booking_time GLOB '[0-9][0-9]:[0-9][0-9]'),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE RESTRICT,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE RESTRICT,
      UNIQUE (room_id, booking_date, booking_time)
    );
  `);

  // Create performance indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_rooms_is_deleted ON rooms(is_deleted);
    CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor);
    CREATE INDEX IF NOT EXISTS idx_bookings_doctor_time ON bookings(doctor_id, booking_date, booking_time);
    CREATE INDEX IF NOT EXISTS idx_bookings_room_time ON bookings(room_id, booking_date, booking_time);
  `);

  // Seed sample records if necessary
  seedDatabase(db);
}

module.exports = { initializeDatabase };
