import { ErrorRequestHandler } from 'express';
import { createErrorsMessages } from '../middleware/input-validation-result.middleware';
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  WrongCredentialsError,
} from './errors';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof NotFoundError) return res.status(404).send();
  if (error instanceof ForbiddenError) return res.status(403).send();
  if (error instanceof WrongCredentialsError) return res.status(401).send();
  if (error instanceof UnauthorizedError) return res.status(401).send();
  if (error instanceof ValidationError)
    return res
      .status(400)
      .send(
        createErrorsMessages([{ field: error.field, message: error.message }]),
      );

  return res.status(500).send('Internal Server Error');
};
