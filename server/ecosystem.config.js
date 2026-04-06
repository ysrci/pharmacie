// server/ecosystem.config.js
module.exports = {
    apps: [{
        name: 'pharmacy-api',
        script: 'server.js',
        env: {
            NODE_ENV: 'production',
            PORT: 5000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 5000
        },
        // إعادة التشغيل التلقائي إذا توقف
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        // سجلات الأخطاء
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_file: './logs/pm2-combined.log',
        time: true
    }]
};
