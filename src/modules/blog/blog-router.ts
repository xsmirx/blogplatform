import { Router } from 'express';
import {
  createBlogHandler,
  deleteBlogHandler,
  getBlogHandler,
  getBlogListHandler,
  updateBlogHandler,
} from './blog-handlers';
import {
  blogDTOValidation,
  idValidation,
  pageNumberValidation,
  pageSizeValidation,
  searchNameTermValidation,
  sortByValidation,
  sortDirectionValidation,
} from './blog-validators';
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
  .post(
    '/',
    superAdminGuardMiddleware,
    blogDTOValidation,
    inputValidationResultMiddleware,
    createBlogHandler,
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
