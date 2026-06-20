import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { RegisterRequest, LoginRequest, AuthResponse, User, Project } from '../types/index.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const prisma = new PrismaClient();

export class AuthService {
  async register(data: RegisterRequest, apiKey?: string): Promise<AuthResponse> {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('User already exists');
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

    let projectDetails = null;
    let projectUserDetails = null;

    if (data.projectId) { 
      const project = await prisma.project.findUnique({
        where: { id: data.projectId }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      if (apiKey && project.apiKey !== apiKey) {
        throw new Error('Invalid API key for project');
      }

      projectUserDetails = await prisma.projectUser.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: 'user'
        },
        include: {
          project: true
        }
      });
      
      projectDetails = project;
    }

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
      project: projectUserDetails ? {
        id: projectUserDetails.project.id,
        name: projectUserDetails.project.name,
        role: projectUserDetails.role
      } : undefined
    };
  }

  async login(credentials: LoginRequest, apiKey?: string): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isValid = await comparePassword(credentials.password, user.password);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    let projectUserDetails = null;

    if (credentials.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: credentials.projectId }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      if (apiKey && project.apiKey !== apiKey) {
        throw new Error('Invalid API key for project');
      }

      projectUserDetails = await prisma.projectUser.findFirst({
        where: {
          projectId: project.id,
          userId: user.id
        },
        include: {
          project: true
        }
      });

      if (!projectUserDetails) {
        projectUserDetails = await prisma.projectUser.create({
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
      project: projectUserDetails ? {
        id: projectUserDetails.project.id,
        name: projectUserDetails.project.name,
        role: projectUserDetails.role
      } : undefined
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

  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Return silently for security (don't reveal if email exists)
      console.log(`Password reset requested for non-existent email: ${email}`);
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    // Log the reset link for development
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    console.log(`Password reset link for ${email}: ${resetLink}`);
    
    // TODO: Send email in production
    // await this.sendPasswordResetEmail(email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });
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