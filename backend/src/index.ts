import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { appConfig } from './config/jwt';
import authRoutes from './routes/auth';
import cvRoutes from './routes/cv';

const app = express();

// Middleware
app.use(cors({
  origin: appConfig.frontendUrl,
  credentials: true,
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cv', cvRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Create uploads directory if it doesn't exist
const createUploadsDir = async () => {
  const uploadsDir = path.join(__dirname, '../uploads');
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log('📁 Uploads directory ready');
  } catch (error) {
    console.error('❌ Error creating uploads directory:', error);
  }
};

// Start server
const startServer = async () => {
  await createUploadsDir();
  
  app.listen(appConfig.port, () => {
    console.log(`🚀 Server running on http://localhost:${appConfig.port}`);
    console.log(`📝 Environment: ${appConfig.nodeEnv}`);
    console.log(`🌐 Frontend URL: ${appConfig.frontendUrl}`);
  });
};

startServer();

export default app;
