import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import payrollRoutes from './routes/payroll.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.use('/api/payroll', payrollRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`💰 Payroll Calculator Server running on http://localhost:${PORT}`);
});

export default app;
