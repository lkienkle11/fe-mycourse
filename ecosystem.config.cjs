const SHARED_DEPLOY_PATH = process.env.DEPLOY_PATH;
const DEPLOY_PATH_DEV = process.env.DEPLOY_PATH_DEV || SHARED_DEPLOY_PATH || '/var/www/fe-mycourse';
const DEPLOY_PATH_STG = process.env.DEPLOY_PATH_STG || SHARED_DEPLOY_PATH || '/var/www/fe-mycourse-staging';
const DEPLOY_PATH_MAIN = process.env.DEPLOY_PATH_MAIN || SHARED_DEPLOY_PATH || '/var/www/fe-mycourse-prod';

const DEPLOY_ENV_FILE_DEV = process.env.DEPLOY_ENV_FILE_DEV || `${DEPLOY_PATH_DEV}/.env.local`;
const DEPLOY_ENV_FILE_STG = process.env.DEPLOY_ENV_FILE_STG || `${DEPLOY_PATH_STG}/.env.staging`;
const DEPLOY_ENV_FILE_MAIN = process.env.DEPLOY_ENV_FILE_MAIN || `${DEPLOY_PATH_MAIN}/.env.prod`;

module.exports = {
    apps: [
        // ==========================================
        // 1. MÔI TRƯỜNG DEV
        // ==========================================
        {
            name: 'mycourse-web-dev',
            cwd: DEPLOY_PATH_DEV,    // Bắt buộc tách thư mục riêng
            script: 'npm',                      // Chạy bằng lệnh npm
            args: 'run start',                  // Chạy script "start" trong package.json
            instances: 1,
            autorestart: true,
            max_memory_restart: '1536M',
            env: {
                // STAGE: 'dev',
                // PORT: 3000,                     // Cổng chạy Dev
            },
            env_file: DEPLOY_ENV_FILE_DEV,
        },
        
        // ==========================================
        // 2. MÔI TRƯỜNG STAGING
        // ==========================================
        {
            name: 'mycourse-web-staging',
            cwd: DEPLOY_PATH_STG, // Bắt buộc tách thư mục riêng
            script: 'npm',
            args: 'run start',
            instances: 1,
            autorestart: true,
            max_memory_restart: '1536M',
            env: {
                STAGE: 'staging',
                PORT: 3001,                      // Cổng chạy Staging
            },
            env_file: DEPLOY_ENV_FILE_STG,
        },
        
        // ==========================================
        // 3. MÔI TRƯỜNG PRODUCTION
        // ==========================================
        {
            name: 'mycourse-web-prod',
            cwd: DEPLOY_PATH_MAIN,    // Bắt buộc tách thư mục riêng
            script: 'npm',
            args: 'run start',
            instances: 1,
            autorestart: true,
            max_memory_restart: '1536M',
            env: {
                STAGE: 'prod',
                PORT: 3002,                      // Cổng chạy Prod (Mặc định Next.js)
            },
            env_file: DEPLOY_ENV_FILE_MAIN,
        }
    ],
};