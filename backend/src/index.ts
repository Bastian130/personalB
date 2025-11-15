import express from 'express';
import cors from 'cors';
import { appConfig } from './config/jwt';
import authRoutes from './routes/auth';

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

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(appConfig.port, () => {
  console.log(`🚀 Server running on http://localhost:${appConfig.port}`);
  console.log(`📝 Environment: ${appConfig.nodeEnv}`);
  console.log(`🌐 Frontend URL: ${appConfig.frontendUrl}`);
});

export default app;
