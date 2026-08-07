import { Router } from 'express';
import {
  blogDTOValidation,
  idValidation,
  pageNumberValidation,
  pageSizeValidation,
  searchNameTermValidation,
  sortByValidation,
  sortDirectionValidation,
} from '../middlewares/blog-validators';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { superAdminGuard } from '../../auth/api/guards/super-admin-guard';
import { Container } from 'inversify';
import { BlogController } from './blog-controller';

export const createBlogRouter = (container: Container) => {
  const blogController = container.get(BlogController);
  const blogRouter: Router = Router();

  blogRouter
    .get(
      '/',
      searchNameTermValidation,
      pageNumberValidation,
      pageSizeValidation,
      sortByValidation,
      sortDirectionValidation,
      inputValidationResultMiddleware,
      blogController.getBlogList,
    )
    .get(
      '/:id',
      idValidation,
      inputValidationResultMiddleware,
      blogController.getBlog,
    )
    .post(
      '/',
      superAdminGuard,
      blogDTOValidation,
      inputValidationResultMiddleware,
      blogController.createBlog,
    )
    .put(
      '/:id',
      superAdminGuard,
      idValidation,
      blogDTOValidation,
      inputValidationResultMiddleware,
      blogController.updateBlog,
    )
    .delete(
      '/:id',
      superAdminGuard,
      idValidation,
      inputValidationResultMiddleware,
      blogController.deleteBlog,
    );

  return blogRouter;
};
