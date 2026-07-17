import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { RegisterRequest, LoginRequest, AuthResponse, User, Project } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class AuthService {
  async register(data: RegisterRequest, apiKey?: string): Promise<AuthResponse> {
    if (!data.projectId) {
      throw new Error('Project ID is required');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const project = await prisma.project.findUnique({
      where: { id: data.projectId }
    });

    if (!project) {
      throw new Error('Project not found. Please contact administrator.');
    }

    if (apiKey && project.apiKey !== apiKey) {
      throw new Error('Invalid API key for project');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        provider: 'local'
      }
    });

    const projectUser = await prisma.projectUser.create({
      data: {
        projectId: project.id,
        userId: user.id,
        role: 'user'
      },
      include: {
        project: true
      }
    });

    const { token, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      projectId: data.projectId
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    const { password: _, refreshToken: __, resetToken: ___, resetTokenExpiry: ____, ...userWithoutSensitive } = user;

    return {
      token,
      refreshToken,
      user: userWithoutSensitive,
      project: {
        id: projectUser.project.id,
        name: projectUser.project.name,
        role: projectUser.role
      }
    };
  }

  async login(credentials: LoginRequest, apiKey?: string): Promise<AuthResponse> {
    if (!credentials.projectId) {
      throw new Error('Project ID is required');
    }

    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    });

    if (!user || !user.password) {
      throw new Error('Invalid email or password');
    }

    const isValid = await comparePassword(credentials.password, user.password);

    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const project = await prisma.project.findUnique({
      where: { id: credentials.projectId }
    });

    if (!project) {
      throw new Error('Project not found');
    }

    if (apiKey && project.apiKey !== apiKey) {
      throw new Error('Invalid API key for project');
    }

    let projectUser = await prisma.projectUser.findFirst({
      where: {
        projectId: project.id,
        userId: user.id
      },
      include: {
        project: true
      }
    });

    if (!projectUser) {
      projectUser = await prisma.projectUser.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: 'user'
        },
        include: {
          project: true
        }
      });
    }

    const { token, refreshToken } = generateTokens({
      userId: user.id,
      email: user.email,
      projectId: credentials.projectId
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    const { password: _, refreshToken: __, resetToken: ___, resetTokenExpiry: ____, ...userWithoutSensitive } = user;

    return {
      token,
      refreshToken,
      user: userWithoutSensitive,
      project: {
        id: projectUser.project.id,
        name: projectUser.project.name,
        role: projectUser.role
      }
    };
  }

  async refreshToken(token: string): Promise<{ token: string }> {
    try {
      const payload = verifyRefreshToken(token);

      const user = await prisma.user.findUnique({
        where: { id: payload.userId }
      });

      if (!user || user.refreshToken !== token) {
        throw new Error('Invalid refresh token');
      }

      const { token: newToken } = generateTokens({
        userId: user.id,
        email: user.email
      });

      return { token: newToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId, refreshToken },
      data: { refreshToken: null }
    });
  }

  async verifyToken(userId: string, projectId?: string): Promise<Omit<User, 'password' | 'refreshToken' | 'resetToken' | 'resetTokenExpiry'>> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (projectId) {
      const projectUser = await prisma.projectUser.findFirst({
        where: {
          projectId,
          userId: user.id
        }
      });

      if (!projectUser) {
        throw new Error('User not authorized for this project');
      }
    }

    const { password: _, refreshToken: __, resetToken: ___, resetTokenExpiry: ____, ...userWithoutSensitive } = user;
    return userWithoutSensitive;
  }

  async findOrCreateOAuthUser(profile: any, provider: string, projectId?: string): Promise<User> {
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: profile.email },
          { providerId: profile.id, provider }
        ]
      }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: profile.email,
          username: profile.username || profile.displayName || profile.email.split('@')[0],
          provider,
          providerId: profile.id
        }
      });
    }

    if (projectId) {
      const projectUser = await prisma.projectUser.findFirst({
        where: {
          projectId,
          userId: user.id
        }
      });

      if (!projectUser) {
        await prisma.projectUser.create({
          data: {
            projectId,
            userId: user.id,
            role: 'user'
          }
        });
      }
    }

    return user;
  }

  async createProject(name: string, description?: string): Promise<Project> {
    const apiKey = uuidv4();
    
    const project = await prisma.project.create({
      data: {
        name,
        apiKey,
        description
      }
    });

    return project;
  }

  async validateProjectApiKey(projectId: string, apiKey: string): Promise<boolean> {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    return project?.apiKey === apiKey;
  }
}