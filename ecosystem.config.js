module.exports = {
    apps: [{
        name: 'ascii-art-generator',
        script: 'server.js',
        instances: 1,
        exec_mode: 'fork',
        watch: false,
        max_memory_restart: '500M',
        env: {
            NODE_ENV: 'development',
            PORT: 3000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000,
            RATE_LIMIT_MAX_REQUESTS: 100,
            RATE_LIMIT_WINDOW_MS: 900000
        },
        error_file: 'logs/error.log',
        out_file: 'logs/out.log',
        log_date_format: 'YYYY-MM-DD HH:mm:ss',
        merge_logs: true,
        autorestart: true,
        max_restarts: 10,
        min_uptime: '10s',
        restart_delay: 1000
    }]
};
