const { initDB } = require('./db');
const bcrypt = require('bcryptjs');

const db = initDB();

const email = 'yassir@gmail.com';
const password = 'yassiryassir';
const name = 'صيدلية ياسين (Yassir)';
const hash = bcrypt.hashSync(password, 10);

try {
    const userResult = db.prepare('INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)').run(
        name, email, hash, 'pharmacy', '0600000000'
    );

    db.prepare('INSERT INTO pharmacies (user_id, name, address, lat, lng, phone, open_hours) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        userResult.lastInsertRowid,
        name,
        'شارع تجريبي، الدار البيضاء',
        33.5731,
        -7.5898,
        '0522000000',
        '08:00-22:00'
    );

    console.log('✅ Account created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
} catch (err) {
    if (err.message.includes('UNIQUE constraint failed')) {
        console.log('❌ Account already exists.');
    } else {
        console.error(err);
    }
}

db.close();
