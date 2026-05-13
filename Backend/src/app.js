import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import leadRoutes from './routes/leadRoutes.js';
import communicationRoutes from './routes/communicationRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import hotelOfferRoutes from './routes/hotelOfferRoutes.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

const app = express();

app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'crm-backend' });
});

app.use('/api/leads', leadRoutes);
app.use('/api/communication', communicationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hotel-offers', hotelOfferRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
