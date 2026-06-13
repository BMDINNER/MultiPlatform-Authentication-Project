import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const validateProjectApiKey = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
  const projectId = req.body.projectId || req.query.projectId;
  const apiKey = req.headers['x-api-key'] as string;

  if (!projectId || !apiKey) {
    return res.status(401).json({ message: 'Project ID and API key required' });
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId as string }
    });

    if (!project || project.apiKey !== apiKey) {
      return res.status(401).json({ message: 'Invalid API key for project' });
    }
    
    next();
  } catch (error) {
    console.error('Project validation error:', error);
    return res.status(500).json({ message: 'Error validating project' });
  }
};