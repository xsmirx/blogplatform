import { Router } from 'express';
import {
  createCommentHandler,
  createPostHandler,
  deletePostHandler,
  getCommentListHandler,
  getPostHandler,
  getPostListHandler,
  updatePostHandler,
} from './post-handlers';
import {
  idValidation,
  pageNumberValidation,
  pageSizeValidation,
  postDTOValidation,
  sortByValidation,
  sortDirectionValidation,
} from './post-validators';
import { inputValidationResultMiddleware } from '../../core/middleware/input-validation-result.middleware';
import { superAdminGuard } from '../auth/super-admin-guard';
import { accessTokenGuard } from '../auth/access-token-guard';
import {
  commentContentValidation,
  commentIdValidation,
  sortByValidation as commentSortByValidation,
  sortDirectionValidation as commentSortDirectionValidation,
} from '../comment/comment-validators';

export const postRouter: Router = Router();

postRouter
  .get(
    '/',
    pageNumberValidation,
    pageSizeValidation,
    sortByValidation,
    sortDirectionValidation,
    getPostListHandler,
  )
  .get('/:id', idValidation, inputValidationResultMiddleware, getPostHandler)
  .post(
    '/',
    superAdminGuard,
    postDTOValidation,
    inputValidationResultMiddleware,
    createPostHandler,
  )
  .put(
    '/:id',
    superAdminGuard,
    idValidation,
    postDTOValidation,
    inputValidationResultMiddleware,
    updatePostHandler,
  )
  .delete(
    '/:id',
    superAdminGuard,
    idValidation,
    inputValidationResultMiddleware,
    deletePostHandler,
  );

postRouter
  .get(
    '/:id/comments',
    idValidation,
    pageNumberValidation,
    pageSizeValidation,
    commentSortByValidation,
    commentSortDirectionValidation,
    inputValidationResultMiddleware,
    getCommentListHandler,
  )
  .post(
    '/:id/comments',
    accessTokenGuard,
    commentIdValidation,
    commentContentValidation,
    inputValidationResultMiddleware,
    createCommentHandler,
  );
