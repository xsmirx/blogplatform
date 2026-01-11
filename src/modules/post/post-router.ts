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
import { superAdminGuardMiddleware } from '../auth/super-admin-guard.middleware';

export const postRouter: Router = Router();

postRouter
  .get('/', getPostListHandler)
  .get('/:id', idValidation, inputValidationResultMiddleware, getPostHandler)
  .post(
    '/',
    superAdminGuardMiddleware,
    postDTOValidation,
    inputValidationResultMiddleware,
    createPostHandler,
  )
  .put(
    '/:id',
    superAdminGuardMiddleware,
    idValidation,
    postDTOValidation,
    inputValidationResultMiddleware,
    updatePostHandler,
  )
  .delete(
    '/:id',
    superAdminGuardMiddleware,
    idValidation,
    inputValidationResultMiddleware,
    deletePostHandler,
  );
