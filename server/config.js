export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'emp_mgmt_secret_key_2026_secure';
export const REQUIRED_WORK_HOURS = 8; // Standard 8-hour requirement
export const REQUIRED_WORK_SECONDS = REQUIRED_WORK_HOURS * 3600; // 28,800 seconds
export const DB_FILE_PATH = './server/data/database.json';
