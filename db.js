const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'stampsnap.db');

let db = null;

async function getDb() {
  if (db) return db;
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  db.run('PRAGMA foreign_keys = ON');
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    trial_start TEXT DEFAULT (datetime('now')),
    trial_end TEXT DEFAULT (datetime('now', '+3 days')),
    subscription_status TEXT DEFAULT 'trial',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    scans_used INTEGER DEFAULT 0,
    scans_limit INTEGER DEFAULT 5
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS stamps (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    image_path TEXT,
    name TEXT NOT NULL,
    country TEXT,
    year TEXT,
    estimated_value REAL,
    rarity_score REAL,
    condition TEXT,
    catalog_number TEXT,
    perforation TEXT,
    watermark TEXT,
    color TEXT,
    denomination TEXT,
    description TEXT,
    confidence REAL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS scan_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    stamp_id TEXT,
    status TEXT DEFAULT 'completed',
    confidence REAL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (stamp_id) REFERENCES stamps(id)
  )`);
  saveDb();
  return db;
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function query(sql, params = []) {
  const stmt = db.prepare(sql);
  if (sql.trim().toUpperCase().startsWith('SELECT') || sql.trim().toUpperCase().startsWith('WITH')) {
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  } else {
    stmt.bind(params);
    stmt.step();
    const result = {
      changes: db.getRowsModified(),
      lastInsertRowid: stmt.getAsObject()
    };
    stmt.free();
    saveDb();
    return result;
  }
}

function get(sql, params = []) {
  const rows = query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

function run(sql, params = []) {
  return query(sql, params);
}

module.exports = { getDb, query, get, run, saveDb };
