import { Request } from 'express';
import { Role, StageName, StageStatus, Priority } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface CreateProjectInput {
  title: string;
  description?: string;
  priority: Priority;
  stages: StageInput[];
}

export interface StageInput {
  stageName: StageName;
  plannedStartDate: Date;
  plannedEndDate: Date;
}

export interface UpdateStageInput {
  actualStartDate?: Date;
  actualEndDate?: Date;
  status?: StageStatus;
}

export interface BlockStageInput {
  reason: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export { Role, StageName, StageStatus, Priority };
