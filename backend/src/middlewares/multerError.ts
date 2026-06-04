import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { AppError } from '../types/shared';

/**
 * Wraps multer middleware to convert multer errors into AppError
 * so they flow through the standard errorHandler.
 */
export function handleMulterError(
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      next(new AppError(400, 'File too large. Maximum size is 5 MB.'));
      return;
    }
    next(new AppError(400, `Upload error: ${err.message}`));
    return;
  }
  // Generic error from fileFilter
  if (err instanceof Error) {
    next(new AppError(400, err.message));
    return;
  }
  next(err);
}
