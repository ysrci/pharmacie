// server/generate-secret.js
// تشغيل: node generate-secret.js

const crypto = require('crypto');

// توليد مفتاح عشوائي بطول 64 بايت (128 حرف في hex)
const secret = crypto.randomBytes(64).toString('hex');

console.log('\n🔐 Your secure JWT_SECRET:\n');
console.log('='.repeat(80));
console.log(secret);
console.log('='.repeat(80));
console.log('\n📝 Copy this key and paste it into your .env file:\n');
console.log(`JWT_SECRET=${secret}\n`);
console.log('⚠️  Keep this key secret! Do not share it or commit it to GitHub.\n');
