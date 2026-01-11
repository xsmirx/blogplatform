import { Router } from 'express';
import {
  createBlogHandler,
  deleteBlogHandler,
  getBlogHandler,
  getBlogListHandler,
  updateBlogHandler,
} from './blog-handlers';
import { blogDTOValidation, idValidation } from './blog-validators';
import { inputValidationResultMiddleware } from '../../core/middleware/input-validation-result.middleware';
import { superAdminGuardMiddleware } from '../auth/super-admin-guard.middleware';

export const blogRouter: Router = Router();

blogRouter
  .get('/', getBlogListHandler)
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
