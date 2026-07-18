export interface User {
  id: string;
  email: string;
  username?: string | null;
  password?: string | null;
  provider: string;
  providerId?: string | null;
  refreshToken?: string | null;
  role: string;
  profile?: any;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  apiKey: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectUser {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  project?: Project;
  user?: User;
}

export interface TokenPayload {
  userId: string;
  email: string;
  provider?: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: Omit<User, 'id' | 'password' | 'refreshToken' | 'resetToken' | 'resetTokenExpiry' | 'providerId' | 'role'>;
  project?: {
    name: string;
    role: string;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  projectId?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  projectId?: string;
}

export interface ProjectAuthRequest {
  projectId: string;
  apiKey: string;
}