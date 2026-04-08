module.exports = {
    apps: [
        // ==========================================
        // 1. MÔI TRƯỜNG DEV
        // ==========================================
        {
            name: 'mycourse-web-dev',
            cwd: '/var/www/fe-mycourse',    // Bắt buộc tách thư mục riêng
            script: 'npm',                      // Chạy bằng lệnh npm
            args: 'run start',                  // Chạy script "start" trong package.json
            instances: 1,
            autorestart: true,
            max_memory_restart: '1536M',
            env: {
                // STAGE: 'dev',
                // PORT: 3000,                     // Cổng chạy Dev
            },
            env_file: '/var/www/fe-mycourse/.env.local',
        },
        
        // ==========================================
        // 2. MÔI TRƯỜNG STAGING
        // ==========================================
        {
            name: 'mycourse-web-staging',
            cwd: '/var/www/fe-mycourse-staging', // Bắt buộc tách thư mục riêng
            script: 'npm',
            args: 'run start',
            instances: 1,
            autorestart: true,
            max_memory_restart: '1536M',
            env: {
                STAGE: 'staging',
                PORT: 3001,                      // Cổng chạy Staging
            },
            env_file: '/var/www/fe-mycourse-staging/.env.staging',
        },
        
        // ==========================================
        // 3. MÔI TRƯỜNG PRODUCTION
        // ==========================================
        {
            name: 'mycourse-web-prod',
            cwd: '/var/www/fe-mycourse-prod',    // Bắt buộc tách thư mục riêng
            script: 'npm',
            args: 'run start',
            instances: 1,
            autorestart: true,
            max_memory_restart: '1536M',
            env: {
                STAGE: 'prod',
                PORT: 3002,                      // Cổng chạy Prod (Mặc định Next.js)
            },
            env_file: '/var/www/fe-mycourse-prod/.env.prod',
        }
    ],
};