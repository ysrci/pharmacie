/**
 * Clean PostgreSQL database module.
 * Exports the pg Pool directly — no SQLite, no dual-db abstraction.
 */
const pool = require('../db/pool');

module.exports = { pool };
