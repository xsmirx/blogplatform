import { Router } from 'express';
import {
  createCreateBlogHandler,
  createDeleteBlogHandler,
  createGetBlogHandler,
  createGetBlogListHandler,
  createUpdateBlogHandler,
} from './blog-handlers';
import {
  blogDTOValidation,
  idValidation,
  pageNumberValidation,
  pageSizeValidation,
  searchNameTermValidation,
  sortByValidation,
  sortDirectionValidation,
} from '../middlewares/blog-validators';
import type { BlogService } from '../domain/blog-service';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { superAdminGuard } from '../../auth/api/guards/super-admin-guard';

export const createBlogRouter = ({
  blogService,
}: {
  blogService: BlogService;
}) => {
  const blogRouter: Router = Router();

  blogRouter
    .get(
      '/',
      searchNameTermValidation,
      pageNumberValidation,
      pageSizeValidation,
      sortByValidation,
      sortDirectionValidation,
      createGetBlogListHandler({ blogService }),
    )
    .get(
      '/:id',
      idValidation,
      inputValidationResultMiddleware,
      createGetBlogHandler({ blogService }),
    )
    .post(
      '/',
      superAdminGuard,
      blogDTOValidation,
      inputValidationResultMiddleware,
      createCreateBlogHandler({ blogService }),
    )
    .put(
      '/:id',
      superAdminGuard,
      idValidation,
      blogDTOValidation,
      inputValidationResultMiddleware,
      createUpdateBlogHandler({ blogService }),
    )
    .delete(
      '/:id',
      superAdminGuard,
      idValidation,
      inputValidationResultMiddleware,
      createDeleteBlogHandler({ blogService }),
    );

  return blogRouter;
};
