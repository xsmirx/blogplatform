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
import type { BlogQueryRepository } from '../infrastucture/blog-query-repository';

export const createBlogRouter = ({
  blogService,
  blogQueryRepository,
}: {
  blogService: BlogService;
  blogQueryRepository: BlogQueryRepository;
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
      inputValidationResultMiddleware,
      createGetBlogListHandler({ blogQueryRepository }),
    )
    .get(
      '/:id',
      idValidation,
      inputValidationResultMiddleware,
      createGetBlogHandler({ blogQueryRepository }),
    )
    .post(
      '/',
      superAdminGuard,
      blogDTOValidation,
      inputValidationResultMiddleware,
      createCreateBlogHandler({ blogService, blogQueryRepository }),
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
