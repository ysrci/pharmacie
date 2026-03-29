const { initDB } = require('./src/config/db');
const db = initDB();

try {
    const users = db.prepare('SELECT name, email, role FROM users').all();
    console.log('--- Current Users in Database ---');
    users.forEach(user => {
        console.log(`Name: ${user.name}, Email: ${user.email}, Role: ${user.role}`);
    });
    console.log('---------------------------------');
} catch (err) {
    console.error('Error reading users:', err.message);
} finally {
    db.close();
}
