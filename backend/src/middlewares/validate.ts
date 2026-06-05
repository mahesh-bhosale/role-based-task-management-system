import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../types/shared';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodSchema, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[part]);
      Object.defineProperty(req, part, {
        value: parsed,
        writable: true,
        enumerable: true,
        configurable: true
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        console.error(`[Validate Error on ${req.method} ${req.originalUrl}]:`, {
          body: req[part],
          fieldErrors: err.flatten().fieldErrors,
          formErrors: err.flatten().formErrors
        });
        next(
          new AppError(400, 'Validation failed', {
            ...err.flatten().fieldErrors,
            _form: err.flatten().formErrors
          })
        );
        return;
      }
      next(err);
    }
  };
}
