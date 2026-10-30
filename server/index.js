import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PORT } from './config.js';
import authRouter from './routes/auth.js';
import attendanceRouter from './routes/attendance.js';
import employeesRouter from './routes/employees.js';
import leavesRouter from './routes/leaves.js';
import reportsRouter from './routes/reports.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets
const publicPath = path.resolve(__dirname, '..', 'public');
app.use(express.static(publicPath));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/leaves', leavesRouter);
app.use('/api/reports', reportsRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Employee Management & 8h Attendance System'
  });
});

// Fallback to index.html for SPA client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Start listening
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Employee Management Server running on port ${PORT}`);
  console.log(`🌐 Local Web & Mobile PWA URL: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
