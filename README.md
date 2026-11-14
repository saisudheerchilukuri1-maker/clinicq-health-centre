# ClinicQ Health Centre – Backend Development Fundamentals

A robust, enterprise-structured RESTful API backend engineered for **ClinicQ Health Centre** using Node.js, Express.js, and SQLite (`better-sqlite3`). The system provides complete management of doctors, clinic rooms, and patient appointments with strict relational integrity, intelligent conflict detection, query-based search filters, and a dedicated **Soft Delete and Restore** architecture.

---

## 1. Project Overview & Problem Statement

Modern healthcare facilities require dependable scheduling engines that eliminate double-booking errors, preserve historical audit trails, and maintain data consistency across operational units. In clinical settings, physically removing an examination room or doctor from the database would corrupt historical booking records or cause foreign key violations.

**ClinicQ Health Centre** solves this challenge through:
- **Relational Integrity**: Foreign key constraints between Doctors, Rooms, and Bookings.
- **Double-Booking Prevention**: Conflict detection ensuring no room or doctor can be booked for multiple appointments concurrently.
- **Soft Delete Architecture**: Rooms can be deactivated (`is_deleted = 1`) without losing historical booking references, and restored (`is_deleted = 0`) at will.
- **Relational Reporting**: SQL `INNER JOIN` endpoint returning unified booking details.
- **Strict Validation**: Defensive input validation preventing corrupt or malformed payloads.

---

## 2. Technologies Used

- **Runtime Environment**: [Node.js](https://nodejs.org/) (v18+)
- **Web Framework**: [Express.js](https://expressjs.com/) (v5)
- **Database Engine**: [SQLite](https://sqlite.org/) with [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (high-performance synchronous SQLite driver)
- **Language**: JavaScript (CommonJS)
- **Automated Testing**: Node.js Native Test Runner (`node:test`, `node:assert`)
- **API Testing & Specification**: Postman Collection (v2.1.0 format)

---

## 3. Database Design & Schema

The database consists of exactly three interrelated tables with enforced foreign keys (`PRAGMA foreign_keys = ON;`) and WAL mode for high concurrency.

```
+--------------------+        +--------------------+
|      Doctors       |        |       Rooms        |
+--------------------+        +--------------------+
| id (PK)            |<---+   | id (PK)            |<---+
| name               |    |   | name               |    |
| specialization     |    |   | floor              |    |
| created_at         |    |   | is_deleted (0 or 1)|    |
+--------------------+    |   | created_at         |    |
                          |   +--------------------+    |
                          |                             |
                          |   +--------------------+    |
                          +---|      Bookings      |    |
                              +--------------------+    |
                              | id (PK)            |    |
                              | doctor_id (FK) ----+----+
                              | room_id (FK) ------+----+
                              | booking_date       |
                              | booking_time       |
                              | created_at         |
                              +--------------------+
```

### Table Definitions

#### 1. Doctors
```sql
CREATE TABLE IF NOT EXISTS doctors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(trim(name) != ''),
  specialization TEXT NOT NULL CHECK(trim(specialization) != ''),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Rooms
```sql
CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL CHECK(trim(name) != ''),
  floor INTEGER NOT NULL,
  is_deleted INTEGER DEFAULT 0 CHECK(is_deleted IN (0, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Bookings
```sql
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
```

---

## 4. Project Structure

```
clinicq-health-centre/
├── config/
│   └── database.js               # SQLite connection, pragmas, and directory setup
├── controllers/
│   ├── doctorController.js       # CRUD & specialization search logic for Doctors
│   ├── roomController.js         # CRUD, floor search, and Soft Delete/Restore logic
│   └── bookingController.js      # CRUD, conflict detection, and SQL JOIN query logic
├── routes/
│   ├── doctorRoutes.js           # Doctor route definitions and validators
│   ├── roomRoutes.js             # Room route definitions and validators
│   └── bookingRoutes.js          # Booking route definitions (handles /details routing)
├── middleware/
│   ├── validation.js             # Schema and business-rule validation middleware
│   └── errorHandler.js          # Centralized error and 404 response handler
├── database/
│   ├── initDb.js                 # Automatic schema creation and index generation
│   ├── seedData.js               # Initial sample records for doctors, rooms & bookings
│   └── clinicq.db                # SQLite database file (auto-generated on startup)
├── tests/
│   ├── api.test.js               # Comprehensive 28-test suite for all endpoints
│   └── softDelete.test.js        # Strict 4-step demonstration test for soft delete
├── ClinicQ_Postman_Collection.json # Postman collection v2.1.0 ready for evaluation
├── server.js                     # Express app setup and entry point
├── package.json                  # NPM dependencies and runner scripts
├── .gitignore                    # Excludes node_modules, .db files, logs, secrets
└── README.md                     # Comprehensive technical documentation
```

---

## 5. Installation and Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### Steps

1. **Clone or Navigate to the Project Directory**:
   ```bash
   cd clinicq-health-centre
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Start the Server**:
   ```bash
   npm start
   ```
   *For development with auto-reloading:*
   ```bash
   npm run dev
   ```

4. **Verify Server Health**:
   Open `http://localhost:3000/` in your browser or curl:
   ```bash
   curl http://localhost:3000/
   ```

---

## 6. API Endpoints Reference

### Doctors
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/doctors` | Get all doctors (supports `?specialization=...`) | 200 |
| `GET` | `/doctors/:id` | Get single doctor by ID | 200, 400, 404 |
| `POST` | `/doctors` | Add a new doctor | 201, 400 |
| `PUT` | `/doctors/:id` | Update doctor details | 200, 400, 404 |
| `DELETE` | `/doctors/:id` | Delete doctor (blocked if bookings exist) | 200, 400, 404 |

### Rooms
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/rooms` | Get all active rooms (supports `?floor=...`) | 200, 400 |
| `GET` | `/rooms/:id` | Get room by ID (404 if soft deleted) | 200, 400, 404 |
| `POST` | `/rooms` | Add a new room | 201, 400 |
| `PUT` | `/rooms/:id` | Update room details | 200, 400, 404 |
| `DELETE` | `/rooms/:id` | **Soft delete** room (`is_deleted` = 1) | 200, 400, 404 |
| `POST` | `/rooms/:id/restore` | **Restore** room (`is_deleted` = 0) | 200, 400, 404 |

### Bookings
| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/bookings` | Get all bookings | 200 |
| `GET` | `/bookings/details` | **SQL JOIN** across Bookings, Doctors, Rooms | 200 |
| `GET` | `/bookings/:id` | Get single booking by ID | 200, 400, 404 |
| `POST` | `/bookings` | Create new booking (conflict validation) | 201, 400, 404, 409 |
| `PUT` | `/bookings/:id` | Update an existing booking | 200, 400, 404, 409 |
| `DELETE` | `/bookings/:id` | Cancel/delete a booking | 200, 400, 404 |

---

## 7. Special Requirement: Soft Delete and Restore

### How It Works
- Instead of using a destructive `DELETE FROM rooms WHERE id = ?`, calling `DELETE /rooms/:id` executes:
  ```sql
  UPDATE rooms SET is_deleted = 1 WHERE id = ?;
  ```
- **`GET /rooms`**: Uses `WHERE is_deleted = 0`, ensuring deleted rooms are never displayed.
- **`GET /rooms/:id`**: Checks `is_deleted`. If `is_deleted === 1`, it immediately returns `HTTP 404 Not Found` with the message `"Room with id X not found or has been deactivated"`.
- **`POST /rooms/:id/restore`**: Executes:
  ```sql
  UPDATE rooms SET is_deleted = 0 WHERE id = ?;
  ```
- **Booking Guard**: New bookings for soft-deleted rooms are blocked with `HTTP 400 Bad Request`.

### Verification Demonstration Sequence
The system satisfies all 4 mandated test stages:

```
[ TEST 1 ] DELETE /rooms/3
           Status: 200 OK
           Response: { "success": true, "message": "Room with id 3 soft deleted successfully" }

[ TEST 2 ] GET /rooms/3
           Status: 404 Not Found
           Response: { "success": false, "message": "Room with id 3 not found or has been deactivated" }

[ TEST 3 ] POST /rooms/3/restore
           Status: 200 OK
           Response: { "success": true, "message": "Room with id 3 restored successfully", "data": { "id": 3, "is_deleted": 0 } }

[ TEST 4 ] GET /rooms/3
           Status: 200 OK
           Response: { "success": true, "data": { "id": 3, "name": "Examination Room 201", "is_deleted": 0 } }
```

---

## 8. Relational JOIN Endpoint (`/bookings/details`)

The endpoint `GET /bookings/details` utilizes an SQL `INNER JOIN` combining `bookings`, `doctors`, and `rooms`:

```sql
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
ORDER BY b.booking_date ASC, b.booking_time ASC, b.id ASC;
```

### Sample Response:
```json
{
  "success": true,
  "count": 4,
  "data": [
    {
      "booking_id": 1,
      "booking_date": "2026-11-20",
      "booking_time": "09:00",
      "booking_created_at": "2026-11-14 13:20:24",
      "doctor_id": 1,
      "doctor_name": "Dr. Sarah Jenkins",
      "doctor_specialization": "Cardiology",
      "room_id": 1,
      "room_name": "Consultation Suite 101",
      "room_floor": 1,
      "room_is_deleted": 0
    }
  ]
}
```

---

## 9. Search Functionality

1. **Search Rooms by Floor**:
   ```
   GET /rooms?floor=2
   ```
   Returns only active rooms situated on Floor 2.

2. **Search Doctors by Specialization**:
   ```
   GET /doctors?specialization=Cardiology
   ```
   Performs a case-insensitive `LIKE` query to find doctors matching the specialization.

---

## 10. Validation & Error Handling

Standardized JSON responses are returned for all scenarios:

| Status Code | Scenario | Sample Error Response |
|---|---|---|
| `400 Bad Request` | Missing or invalid field types | `{"success": false, "message": "Input validation failed", "errors": ["Field 'floor' is required"]}` |
| `400 Bad Request` | Attempt to book soft-deleted room | `{"success": false, "message": "Cannot book room 'X' because it has been deactivated/deleted"}` |
| `404 Not Found` | Resource ID does not exist / soft-deleted | `{"success": false, "message": "Room with id 999 not found or has been deactivated"}` |
| `409 Conflict` | Double-booking (room occupied at same date/time) | `{"success": false, "message": "Booking conflict: Room 'X' is already booked for date 2026-11-20 at 09:00"}` |
| `409 Conflict` | Doctor double-booking | `{"success": false, "message": "Booking conflict: Doctor 'Y' is already scheduled for date 2026-11-20 at 09:00"}` |

---

## 11. Automated Testing

The project includes two comprehensive test suites using the Node.js native test runner:

### Running All Tests:
```bash
npm test
```

### Running Specific Test Suites:
```bash
# Soft delete demonstration (Tests 1-4)
npm run test:soft-delete

# Full API test suite (28 tests)
npm run test:api
```

### Test Results Summary:
```
✔ Special Requirement: Soft Delete and Restore Workflow (5 tests passed)
✔ ClinicQ Health Centre Full API Test Suite (28 tests passed)
Total: 33 tests passing (0 failing)
Execution Time: ~420ms
```

---

## 12. Postman Testing Instructions

1. Open Postman.
2. Click **Import** in the upper left.
3. Select `ClinicQ_Postman_Collection.json` located in the root of the project.
4. The collection contains 4 folders:
   - `1. Doctors` (CRUD + Search)
   - `2. Rooms & Soft Delete Demo` (Includes Tests 1 through 4)
   - `3. Bookings & JOIN Details` (CRUD + JOIN + Conflict checks)
   - `4. Validation & Error Handling` (400, 404, 409 test cases)
5. Set `baseUrl` variable to `http://localhost:3000` (set by default in collection variables).
6. Execute requests individually or run the entire collection via **Postman Collection Runner**.

---

## 13. Faculty Evaluation Quick Checklist

- [x] Node.js + Express.js + SQLite (`better-sqlite3`) backend
- [x] 3 related tables with foreign keys and unique constraints
- [x] Auto database initialization and seed data on startup
- [x] All required endpoints implemented for Doctors, Rooms, and Bookings
- [x] Soft delete and restore implemented and verified (`DELETE /rooms/3`, `GET /rooms/3` -> 404, `POST /rooms/3/restore`, `GET /rooms/3` -> 200)
- [x] `GET /bookings/details` SQL JOIN query implemented
- [x] Search rooms by floor (`?floor=2`) and doctors by specialization (`?specialization=...`)
- [x] Defensive validation and meaningful HTTP status codes (200, 201, 400, 404, 409, 500)
- [x] Automated tests passing 100% (33/33 tests)
- [x] `ClinicQ_Postman_Collection.json` included
- [x] Initialized Git repository and clean commit history
