import { Router } from 'express';
import {
  createBlogHandler,
  createPostHandler,
  deleteBlogHandler,
  getBlogHandler,
  getBlogListHandler,
  getPostListHandler,
  updateBlogHandler,
} from './blog-handlers';
import {
  blogDTOValidation,
  blogIdValidation,
  idValidation,
  pageNumberValidation,
  pageSizeValidation,
  searchNameTermValidation,
  sortByValidation,
  sortDirectionValidation,
} from './blog-validators';
import {
  pageNumberValidation as pageNumberValidationPost,
  pageSizeValidation as pageSizeValidationPost,
  sortByValidation as sortByValidationPost,
  sortDirectionValidation as sortDirectionValidationPost,
  titleValidation,
  shortDescriptionValidation,
  contentValidation,
} from '../post/post-validators';
import { inputValidationResultMiddleware } from '../../core/middleware/input-validation-result.middleware';
import { superAdminGuardMiddleware } from '../auth/super-admin-guard.middleware';

export const blogRouter: Router = Router();

blogRouter
  .get(
    '/',
    searchNameTermValidation,
    pageNumberValidation,
    pageSizeValidation,
    sortByValidation,
    sortDirectionValidation,
    getBlogListHandler,
  )
  .get('/:id', idValidation, inputValidationResultMiddleware, getBlogHandler)
  .get(
    '/:blogId/posts',
    blogIdValidation,
    inputValidationResultMiddleware,
    pageNumberValidationPost,
    pageSizeValidationPost,
    sortByValidationPost,
    sortDirectionValidationPost,
    getPostListHandler,
  )
  .post(
    '/',
    superAdminGuardMiddleware,
    blogDTOValidation,
    inputValidationResultMiddleware,
    createBlogHandler,
  )
  .post(
    '/:blogId/posts',
    superAdminGuardMiddleware,
    blogIdValidation,
    titleValidation,
    shortDescriptionValidation,
    contentValidation,
    inputValidationResultMiddleware,
    createPostHandler,
  )
  .put(
    '/:id',
    superAdminGuardMiddleware,
    idValidation,
    blogDTOValidation,
    inputValidationResultMiddleware,
    updateBlogHandler,
  )
  .delete(
    '/:id',
    superAdminGuardMiddleware,
    idValidation,
    inputValidationResultMiddleware,
    deleteBlogHandler,
  );
