const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || './data/crm.db';
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Enable Write-Ahead Logging for better concurrency
db.pragma('journal_mode = WAL');

module.exports = db;
