import { Router } from 'express';
import {
  updateCommentHandler,
  deleteCommentHandler,
  getCommentHandler,
} from './comment-handlers';
import {
  commentContentValidation,
  commentIdValidation,
} from './comment-validators';
import { inputValidationResultMiddleware } from '../../core/middleware/input-validation-result.middleware';
import { accessTokenGuard } from '../auth/access-token-guard';

export const commentRouter: Router = Router();

commentRouter
  .get(
    '/:id',
    commentIdValidation,
    inputValidationResultMiddleware,
    getCommentHandler,
  )
  .put(
    '/:id',
    accessTokenGuard,
    commentIdValidation,
    commentContentValidation,
    inputValidationResultMiddleware,
    updateCommentHandler,
  )
  .delete(
    '/:id',
    accessTokenGuard,
    commentIdValidation,
    inputValidationResultMiddleware,
    deleteCommentHandler,
  );
