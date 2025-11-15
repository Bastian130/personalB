import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
  expiresIn: (process.env.JWT_EXPIRES_IN || '24h') as string,
};

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  WARNING: JWT_SECRET not set in environment variables. Using default (insecure).');
}

export const appConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
