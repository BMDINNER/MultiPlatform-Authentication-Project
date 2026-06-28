import app from './server.js';
import {  PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const port = process.env.PORT || 3001;

async function startServer() {
  try {

    await prisma.$connect();
    console.log('Connected to database.');

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`)
    })

  } catch(error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
}


startServer();