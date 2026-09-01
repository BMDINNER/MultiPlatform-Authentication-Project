import app from './server.js';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  // @ts-ignore 
  adapter,
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  let retries = 10;
  let delay = 2000;

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
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; 
    }
  }

  app.listen(PORT, () => {
    console.log(`Auth service running on port ${PORT}`);
  });
}

startServer();