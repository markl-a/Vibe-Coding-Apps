import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import leaveRoutes from './routes/leave.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000']),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/leaves', leaveRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`🏖️  Leave Management Server running on http://localhost:${PORT}`);
});

export default app;
