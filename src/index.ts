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

const PORT = process.env.PORT || 3001;

const connectWithRetry = async (retries = 5, delay = 1500) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Database connection attempt ${i + 1}/${retries}...`);
      await prisma.$connect();
      console.log('Database connected successfully!');
      return;
    } catch (error) {
      console.log(`Database connection failed (attempt ${i + 1})`);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

async function startServer() {
  try {
    await connectWithRetry();

    app.listen(PORT, () => {
      console.log(`Auth service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();