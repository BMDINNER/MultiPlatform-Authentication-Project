import app from './server.js';
import { PrismaClient } from '@prisma/client';
import { enableRateLimiting } from './routes/auth-routes.js';

export const prisma = new PrismaClient();

const PORT = parseInt(process.env.PORT || '3001', 10);

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const connectDatabase = async (retries: number = 10, delay: number = 3000): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Database connection attempt ${attempt}/${retries}...`);
      await prisma.$connect();
      console.log('Database connected successfully');
      return true;
    } catch (error: any) {
      console.error(`Database connection failed (attempt ${attempt}):`, error.message);
      if (attempt === retries) {
        console.error('All database connection attempts failed');
        return false;
      }
      console.log(`Retrying in ${delay}ms...`);
      await sleep(delay);
      delay *= 1.5;
    }
  }
  return false;
};

async function startServer() {
  console.log('Starting auth service...');

  const dbConnected = await connectDatabase();
  if (!dbConnected) {
    console.error('Failed to connect to database on startup');
    process.exit(1);
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth service running on port ${PORT}`);
    console.log(`Health check available at /health`);
    console.log(`Ping endpoint available at /ping`);
  });

  console.log('Waiting for service to be fully ready...');
  await sleep(5000);

  enableRateLimiting();
  console.log('Service is ready and rate limiting is active');

  const gracefulShutdown = async (signal: string) => {
    console.log(`${signal} received, starting graceful shutdown...`);
    
    server.close(async () => {
      console.log('HTTP server closed');
      try {
        await prisma.$disconnect();
        console.log('Database disconnected');
      } catch (error) {
        console.error('Error disconnecting database:', error);
      }
      console.log('Graceful shutdown complete');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    await gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', async (reason) => {
    console.error('Unhandled rejection:', reason);
    await gracefulShutdown('unhandledRejection');
  });
}

startServer();