/**
 * Seed data for ClinicQ Health Centre
 * Provides initial sample records for doctors, rooms, and bookings
 */

function seedDatabase(db) {
  const doctorCount = db.prepare('SELECT COUNT(*) as count FROM doctors').get().count;
  const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
  const bookingCount = db.prepare('SELECT COUNT(*) as count FROM bookings').get().count;

  // Insert seed doctors if table is empty
  if (doctorCount === 0) {
    const insertDoctor = db.prepare(`
      INSERT INTO doctors (id, name, specialization)
      VALUES (?, ?, ?)
    `);

    const doctors = [
      [1, 'Dr. Sarah Jenkins', 'Cardiology'],
      [2, 'Dr. Marcus Wong', 'Neurology'],
      [3, 'Dr. Elena Rostova', 'Pediatrics'],
      [4, 'Dr. Priya Sharma', 'General Medicine'],
      [5, 'Dr. Alexander Hayes', 'Orthopedics']
    ];

    const seedDoctorsTx = db.transaction((docs) => {
      for (const doc of docs) {
        insertDoctor.run(...doc);
      }
    });

    seedDoctorsTx(doctors);
  }

  // Insert seed rooms if table is empty
  // Room 3 is explicitly seeded so that DELETE /rooms/3 test works immediately!
  if (roomCount === 0) {
    const insertRoom = db.prepare(`
      INSERT INTO rooms (id, name, floor, is_deleted)
      VALUES (?, ?, ?, ?)
    `);

    const rooms = [
      [1, 'Consultation Suite 101', 1, 0],
      [2, 'Consultation Suite 102', 1, 0],
      [3, 'Examination Room 201', 2, 0],
      [4, 'Diagnostic Radiology 202', 2, 0],
      [5, 'Cardiac Care Unit 301', 3, 0],
      [6, 'Pediatric Wing 302', 3, 0]
    ];

    const seedRoomsTx = db.transaction((rms) => {
      for (const room of rms) {
        insertRoom.run(...room);
      }
    });

    seedRoomsTx(rooms);
  }

  // Insert seed bookings if table is empty
  if (bookingCount === 0) {
    const insertBooking = db.prepare(`
      INSERT INTO bookings (id, doctor_id, room_id, booking_date, booking_time)
      VALUES (?, ?, ?, ?, ?)
    `);

    const bookings = [
      [1, 1, 1, '2026-11-20', '09:00'],
      [2, 2, 2, '2026-11-20', '10:30'],
      [3, 3, 3, '2026-11-21', '14:00'],
      [4, 4, 4, '2026-11-22', '11:15']
    ];

    const seedBookingsTx = db.transaction((bks) => {
      for (const booking of bks) {
        insertBooking.run(...booking);
      }
    });

    seedBookingsTx(bookings);
  }
}

module.exports = { seedDatabase };
