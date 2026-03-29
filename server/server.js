require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initDB } = require('./src/config/db');
const routes = require('./src/routes');

// Initialize Database
initDB();

const app = express();
const PORT = process.env.PORT || 3001;

// ─── SECURITY & MIDDLEWARE ────────────────────────────────────
app.use(helmet()); // Security headers
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api/', limiter);

// ─── ROUTES ──────────────────────────────────────────────────
app.use('/api', routes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
    });
});

// ─── START SERVER ─────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Saydaliya SaaS API running on http://localhost:${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
});
