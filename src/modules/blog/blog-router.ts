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

export const blogRouter: Router = Router();

blogRouter
  .get('/', getBlogListHandler)
  .get('/:id', idValidation, inputValidationResultMiddleware, getBlogHandler)
  .post(
    '/',
    blogDTOValidation,
    inputValidationResultMiddleware,
    createBlogHandler,
  )
  .put(
    '/:id',
    idValidation,
    blogDTOValidation,
    inputValidationResultMiddleware,
    updateBlogHandler,
  )
  .delete(
    '/:id',
    idValidation,
    inputValidationResultMiddleware,
    deleteBlogHandler,
  );
