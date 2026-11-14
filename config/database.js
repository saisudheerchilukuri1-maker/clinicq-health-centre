const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure database directory exists
const dbDir = path.resolve(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database file path (configurable via DB_PATH env var)
const defaultDbPath = path.join(dbDir, 'clinicq.db');
const dbPath = process.env.DB_PATH || defaultDbPath;

// Initialize SQLite connection
const db = new Database(dbPath, {
  // verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Enable SQLite foreign keys constraint enforcement
db.pragma('foreign_keys = ON');

// Enable Write-Ahead Logging for better concurrent read/write performance
db.pragma('journal_mode = WAL');

module.exports = db;
