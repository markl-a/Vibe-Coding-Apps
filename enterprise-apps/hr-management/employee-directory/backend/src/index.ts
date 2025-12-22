import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createLogger } from '@vibe/shared-utils';
import employeeRoutes from './routes/employee.routes';
import departmentRoutes from './routes/department.routes';
import aiRoutes from './routes/ai.routes';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const logger = createLogger('employee-directory');
const app: Application = express();
const PORT = process.env.PORT || 3000;

// 中間件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 靜態文件
app.use('/uploads', express.static('uploads'));

// 路由
app.use('/api/employees', employeeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/ai', aiRoutes);

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 錯誤處理
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info('Employee Directory Server running', {
    port: PORT,
    url: `http://localhost:${PORT}`
  });
});

export default app;
