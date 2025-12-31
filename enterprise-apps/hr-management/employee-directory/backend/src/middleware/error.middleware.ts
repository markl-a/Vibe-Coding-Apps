import { Request, Response, NextFunction } from 'express';
import { getErrorMessage } from '@vibe/shared-utils';

interface ErrorWithStatus {
  statusCode?: number;
  message: string;
  stack?: string;
}

function isErrorWithStatus(error: unknown): error is ErrorWithStatus {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as ErrorWithStatus).message === 'string'
  );
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', getErrorMessage(error));

  const statusCode = isErrorWithStatus(error) && error.statusCode ? error.statusCode : 500;
  const message = isErrorWithStatus(error) ? error.message : 'Internal Server Error';
  const stack = isErrorWithStatus(error) ? error.stack : undefined;

  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && stack && { stack }),
    },
  });
}
