import app from './server.js';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const PORT = process.env.PORT || 3001;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function startServer() {
  let retries = 10;
  let delay = 3000;

  console.log('Starting auth service...');

  while (retries > 0) {
    try {
      console.log(`Attempting database connection... (${retries} attempts left)`);
      await prisma.$connect();
      console.log('Database connected successfully');
      break;
    } catch (error) {
      retries--;
      if (retries === 0) {
        console.error('Failed to connect to database after all retries:', error);
        process.exit(1);
      }
      console.log(`Database connection failed, retrying in ${delay}ms...`);
      await sleep(delay);
      delay *= 1.5;
    }
  }

  app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
    console.log(`Health check available at /health`);
    console.log(`Ping endpoint available at /ping`);
  });
}

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing database connection...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();