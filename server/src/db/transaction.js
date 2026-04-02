const pool = require('./pool');

/**
 * Executes a callback within a PostgreSQL transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK.
 * 
 * @param {function} callback - async (client) => { ... }
 * @returns {Promise<any>} - result of the callback
 * 
 * @example
 * const result = await withTransaction(async (client) => {
 *   const r = await client.query('INSERT INTO ...', [...]);
 *   await client.query('UPDATE ...', [...]);
 *   return r.rows[0];
 * });
 */
async function withTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

module.exports = { withTransaction };
