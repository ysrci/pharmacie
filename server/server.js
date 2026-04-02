require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const pool = require('./src/db/pool');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── SECURITY & MIDDLEWARE ─────────────────────────────────────
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// ─── ROUTES ───────────────────────────────────────────────────
app.use('/api', routes);

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', db: 'postgresql', timestamp: new Date().toISOString() });
    } catch (err) {
        res.status(503).json({ status: 'error', message: err.message });
    }
});

// ─── GLOBAL ERROR HANDLER ─────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('[Error]', err.stack);
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
    });
});

// ─── START ────────────────────────────────────────────────────
async function start() {
    try {
        await pool.query('SELECT 1');
        console.log('✅ PostgreSQL connected');
        app.listen(PORT, () => {
            console.log(`🚀 Saydaliya API running on http://localhost:${PORT}`);
            console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (err) {
        console.error('❌ Failed to connect to PostgreSQL:', err.message);
        process.exit(1);
    }
}

start();
