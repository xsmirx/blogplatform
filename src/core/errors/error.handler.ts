import { ErrorRequestHandler } from 'express';
import {
  EmailNotUniqueError,
  LoginNotUniqueError,
} from '../../modules/user/user-errors';
import { createErrorsMessages } from '../middleware/input-validation-result.middleware';
import { ForbiddenError, NotFoundError, WrongCredentialsError } from './errors';

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (error instanceof WrongCredentialsError) {
    res.status(401).send();
    return;
  }
  if (error instanceof NotFoundError) {
    res.status(404).send();
    return;
  }
  if (error instanceof ForbiddenError) {
    res.status(403).send();
    return;
  }

  if (error instanceof EmailNotUniqueError) {
    res
      .status(400)
      .send(
        createErrorsMessages([
          { field: 'email', message: 'email should be unique' },
        ]),
      );
    return;
  }
  if (error instanceof LoginNotUniqueError) {
    res
      .status(400)
      .send(
        createErrorsMessages([
          { field: 'login', message: 'login should be unique' },
        ]),
      );
    return;
  }

  console.error('Unhandled error:', error);

  res.status(500).send('Internal Server Error');
  return;
};
