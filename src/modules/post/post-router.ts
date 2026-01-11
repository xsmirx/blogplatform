import { Router } from 'express';
import {
  createPostHandler,
  deletePostHandler,
  getPostHandler,
  getPostListHandler,
  updatePostHandler,
} from './post-handlers';
import { idValidation, postDTOValidation } from './post-validators';
import { inputValidationResultMiddleware } from '../../core/middleware/input-validation-result.middleware';

export const postRouter: Router = Router();

postRouter
  .get('/', getPostListHandler)
  .get('/:id', idValidation, inputValidationResultMiddleware, getPostHandler)
  .post(
    '/',
    postDTOValidation,
    inputValidationResultMiddleware,
    createPostHandler,
  )
  .put(
    '/:id',
    idValidation,
    postDTOValidation,
    inputValidationResultMiddleware,
    updatePostHandler,
  )
  .delete(
    '/:id',
    idValidation,
    inputValidationResultMiddleware,
    deletePostHandler,
  );
