const { Pool } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'saydaliya.db');
const PG_URL = process.env.DATABASE_URL;

let dbInstance = null;
let pgPool = null;

function initDB() {
  if (PG_URL) {
    console.log('🐘 Using PostgreSQL Database');
    pgPool = new Pool({ connectionString: PG_URL });
    return pgPool;
  } else {
    console.log('📦 Using SQLite Database');
    if (dbInstance) return dbInstance;
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    // (Table creation logic omitted for brevity or handled by migration script)
    return dbInstance;
  }
}

/**
 * Unified query helper for both SQLites (sync) and PostgreSQL (async)
 * Note: Always await this function.
 */
async function query(text, params = []) {
  if (PG_URL) {
    if (!pgPool) initDB();
    // Convert ? to $1, $2 for Postgres
    let i = 1;
    const pgText = text.replace(/\?/g, () => `$${i++}`);
    const res = await pgPool.query(pgText, params);
    return {
      rows: res.rows,
      lastInsertId: res.rows[0]?.id || null,
      changes: res.rowCount
    };
  } else {
    if (!dbInstance) initDB();
    const stmt = dbInstance.prepare(text);
    const isSelect = text.trim().toLowerCase().startsWith('select');

    if (isSelect) {
      const rows = stmt.all(...params);
      return { rows };
    } else {
      const info = stmt.run(...params);
      return {
        lastInsertId: info.lastInsertRowid,
        changes: info.changes
      };
    }
  }
}

module.exports = {
  initDB,
  getDB: () => pgPool || dbInstance || initDB(),
  query,
  isPostgres: () => !!PG_URL
};
