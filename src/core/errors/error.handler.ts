import { ErrorRequestHandler } from 'express';
import { BlogNotFoundError } from '../../modules/blog/blog-errors';

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (error instanceof BlogNotFoundError) {
    res.status(404).send();
    return;
  }

  res.status(500).send('Internal Server Error');
  return;
};
