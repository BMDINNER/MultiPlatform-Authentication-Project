import app from './server.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});

const connectWithRetry = async (retries = 5, delay = 1500) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Database connection attempt ${i + 1}/${retries}...`);
      await prisma.$connect();
      console.log('Database connected successfully!');
      return;
    } catch (error) {
      console.log(`Database connection failed (attempt ${i + 1})`);
      if (i === retries - 1) {
        console.error('All database connection attempts failed.');
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

async function startServer() {
  try {
    console.log('=== AUTH SERVICE STARTING ===');
    console.log('PORT:', process.env.PORT || 3001);
    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    await connectWithRetry();

    console.log('Auth service is ready');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();