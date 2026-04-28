import { Router } from 'express';
import {
  createCreateBlogHandler,
  createCreatePostHandler,
  createDeleteBlogHandler,
  createGetBlogHandler,
  createGetBlogListHandler,
  createGetPostListHandler,
  createUpdateBlogHandler,
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
} from '../middlewares/blog-validators';
import {
  pageNumberValidation as pageNumberValidationPost,
  pageSizeValidation as pageSizeValidationPost,
  sortByValidation as sortByValidationPost,
  sortDirectionValidation as sortDirectionValidationPost,
  titleValidation,
  shortDescriptionValidation,
  contentValidation,
} from '../../post/post-validators';
import type { BlogService } from '../domain/blog-service';
import type { PostService } from '../../post/post-service';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { superAdminGuard } from '../../auth/api/guards/super-admin-guard';

export const createBlogRouter = ({
  blogService,
  postService,
}: {
  blogService: BlogService;
  postService: PostService;
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
    .get(
      '/:blogId/posts',
      blogIdValidation,
      inputValidationResultMiddleware,
      pageNumberValidationPost,
      pageSizeValidationPost,
      sortByValidationPost,
      sortDirectionValidationPost,
      createGetPostListHandler({ postService }),
    )
    .post(
      '/',
      superAdminGuard,
      blogDTOValidation,
      inputValidationResultMiddleware,
      createCreateBlogHandler({ blogService }),
    )
    .post(
      '/:blogId/posts',
      superAdminGuard,
      blogIdValidation,
      titleValidation,
      shortDescriptionValidation,
      contentValidation,
      inputValidationResultMiddleware,
      createCreatePostHandler({ postService }),
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
