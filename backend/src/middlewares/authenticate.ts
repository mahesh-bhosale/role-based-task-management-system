import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { env } from '../config/env';
import { verifyToken, TokenPayload } from '../utils/jwt';
import { AppError } from '../types/shared';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError(401, 'Authentication required'));
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyToken<TokenPayload>(token, env.JWT_ACCESS_SECRET);
    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role as Role,
    };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired access token'));
  }
}
