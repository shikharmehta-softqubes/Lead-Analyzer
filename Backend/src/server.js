import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';
import { schedulePendingLeadFollowUps } from './services/followUpService.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`CRM backend running on port ${PORT}`);
  });

  schedulePendingLeadFollowUps();
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
