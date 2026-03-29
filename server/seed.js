const { initDB } = require('./db');
const bcrypt = require('bcryptjs');

const db = initDB();

// Clear existing data
db.exec('DELETE FROM alerts; DELETE FROM medications; DELETE FROM pharmacies; DELETE FROM users;');

const hashPassword = (pw) => bcrypt.hashSync(pw, 10);

// ─── Create pharmacy users ───────────────────────────────────
const insertUser = db.prepare('INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)');
const insertPharmacy = db.prepare('INSERT INTO pharmacies (user_id, name, address, lat, lng, phone, open_hours) VALUES (?, ?, ?, ?, ?, ?, ?)');
const insertMed = db.prepare('INSERT INTO medications (pharmacy_id, name, dosage, cost_price, price, quantity, min_stock_level, category, description, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
const insertSale = db.prepare('INSERT INTO sales (pharmacy_id, medication_id, quantity, unit_price, total_price, profit, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
const insertProfitSetting = db.prepare('INSERT INTO profit_settings (pharmacy_id, default_margin_percentage) VALUES (?, ?)');

const pharmaciesData = [
    { name: 'صيدلية الأمل (Casablanca)', address: 'شارع الزرقطوني، الدار البيضاء', lat: 33.5898, lng: -7.6038, phone: '0522123456', hours: '08:00-22:00' },
    { name: 'صيدلية النور (Rabat)', address: 'شارع محمد الخامس، الرباط', lat: 34.0209, lng: -6.8416, phone: '0537234567', hours: '08:00-23:00' },
    { name: 'صيدلية الشفاء (Marrakech)', address: 'جيليز، مراكش', lat: 31.6295, lng: -7.9811, phone: '0524345678', hours: '07:30-21:00' },
    { name: 'صيدلية السلام (Fes)', address: 'شارع الحسن الثاني، فاس', lat: 34.0331, lng: -5.0003, phone: '0535456789', hours: '08:00-22:00' },
    { name: 'صيدلية الرحمة (Tangier)', address: 'بوليفار، طنجة', lat: 35.7595, lng: -5.8330, phone: '0539567890', hours: '09:00-23:00' },
    { name: 'صيدلية البركة (Agadir)', address: 'حي تالبرجت، أكادير', lat: 30.4278, lng: -9.5981, phone: '0528678901', hours: '08:00-21:30' },
    { name: 'صيدلية الياسمين (Meknes)', address: 'حمرية، مكناس', lat: 33.8938, lng: -5.5484, phone: '0535789012', hours: '07:00-22:00' },
    { name: 'صيدلية الحكمة (Oujda)', address: 'شارع محمد الخامس، وجدة', lat: 34.6814, lng: -1.9086, phone: '0536890123', hours: '08:30-22:30' },
];

const medications = [
    // Common medications
    { name: 'باراسيتامول', dosage: '500mg', price: 15, category: 'otc', desc: 'مسكن للآلام وخافض للحرارة' },
    { name: 'إيبوبروفين', dosage: '400mg', price: 25, category: 'otc', desc: 'مضاد للالتهابات ومسكن للآلام' },
    { name: 'أموكسيسيلين', dosage: '500mg', price: 45, category: 'prescription', desc: 'مضاد حيوي واسع الطيف' },
    { name: 'أوميبرازول', dosage: '20mg', price: 35, category: 'prescription', desc: 'مثبط مضخة البروتون لعلاج الحموضة' },
    { name: 'ميتفورمين', dosage: '850mg', price: 30, category: 'prescription', desc: 'علاج السكري من النوع الثاني' },
    { name: 'أملوديبين', dosage: '5mg', price: 40, category: 'prescription', desc: 'علاج ارتفاع ضغط الدم' },
    { name: 'لوراتادين', dosage: '10mg', price: 20, category: 'otc', desc: 'مضاد للحساسية' },
    { name: 'فيتامين C', dosage: '1000mg', price: 35, category: 'supplement', desc: 'مكمل غذائي لتقوية المناعة' },
    { name: 'فيتامين D', dosage: '1000IU', price: 40, category: 'supplement', desc: 'مكمل لتقوية العظام' },
    { name: 'أوميغا 3', dosage: '1000mg', price: 60, category: 'supplement', desc: 'مكمل لصحة القلب والدماغ' },
    { name: 'الزنك', dosage: '50mg', price: 25, category: 'supplement', desc: 'مكمل لتقوية المناعة' },
    { name: 'سيتريزين', dosage: '10mg', price: 18, category: 'otc', desc: 'مضاد للحساسية والرشح' },
    { name: 'ديكلوفيناك', dosage: '50mg', price: 22, category: 'prescription', desc: 'مضاد للالتهاب غير ستيرويدي' },
    { name: 'أزيثروميسين', dosage: '250mg', price: 55, category: 'prescription', desc: 'مضاد حيوي' },
    { name: 'المغنيسيوم', dosage: '400mg', price: 45, category: 'supplement', desc: 'مكمل لصحة الأعصاب والعضلات' },
    { name: 'الحديد', dosage: '325mg', price: 25, category: 'supplement', desc: 'مكمل لعلاج فقر الدم' },
    { name: 'دومبيريدون', dosage: '10mg', price: 20, category: 'prescription', desc: 'علاج الغثيان والقيء' },
    { name: 'سالبوتامول', dosage: '100mcg', price: 70, category: 'prescription', desc: 'بخاخ موسع للشعب الهوائية' },
    { name: 'بانتوبرازول', dosage: '40mg', price: 45, category: 'prescription', desc: 'علاج قرحة المعدة' },
    { name: 'فيتامين B12', dosage: '1000mcg', price: 35, category: 'supplement', desc: 'مكمل لصحة الأعصاب' },
];

const seedTransaction = db.transaction(() => {
    const pharmacyIds = [];

    for (const p of pharmaciesData) {
        const email = p.name.replace(/\s/g, '').replace(/\(.*\)/, '') + '@saydaliya.ma';
        const userResult = insertUser.run(p.name, email, hashPassword('password123'), 'pharmacy', p.phone);
        const pharmacyResult = insertPharmacy.run(userResult.lastInsertRowid, p.name, p.address, p.lat, p.lng, p.phone, p.hours);
        const pid = pharmacyResult.lastInsertRowid;
        pharmacyIds.push(pid);

        // Add default profit settings
        insertProfitSetting.run(pid, 25);
    }

    // Distribute medications across pharmacies
    for (const pharmacyId of pharmacyIds) {
        const shuffled = [...medications].sort(() => Math.random() - 0.5);
        const count = 10 + Math.floor(Math.random() * 10);
        const selected = shuffled.slice(0, count);

        for (const med of selected) {
            const quantity = Math.floor(Math.random() * 100);
            const price = med.price + (Math.random() * 10 - 5);
            const costPrice = price * 0.75; // 25% margin
            const minStock = 5 + Math.floor(Math.random() * 10);

            // Random expiry date within next 2 years
            const expiry = new Date();
            expiry.setMonth(expiry.getMonth() + Math.floor(Math.random() * 24));

            const medResult = insertMed.run(
                pharmacyId,
                med.name,
                med.dosage,
                Math.round(costPrice),
                Math.round(price),
                quantity,
                minStock,
                med.category,
                med.desc,
                expiry.toISOString().split('T')[0]
            );

            // Add some random sales for the last 30 days
            if (quantity > 20) {
                for (let i = 0; i < 5; i++) {
                    const saleQty = 1 + Math.floor(Math.random() * 3);
                    const salePrice = Math.round(price) * saleQty;
                    const saleCost = Math.round(costPrice) * saleQty;
                    const profit = salePrice - saleCost;

                    const saleDate = new Date();
                    saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30));

                    insertSale.run(
                        pharmacyId,
                        medResult.lastInsertRowid,
                        saleQty,
                        Math.round(price),
                        salePrice,
                        profit,
                        saleDate.toISOString()
                    );
                }
            }
        }
    }

    // Create a test regular user
    insertUser.run('مستخدم تجريبي', 'user@saydaliya.ma', hashPassword('password123'), 'user', '0666000000');
});

seedTransaction();

console.log('✅ Database seeded successfully!');
console.log(`   - ${pharmaciesData.length} pharmacies created`);
console.log('   - Medications distributed across pharmacies');
console.log('   - Test user created: user@saydaliya.dz / password123');
console.log('   - Pharmacy login example: صيدليةالشفاء@saydaliya.dz / password123');

db.close();
