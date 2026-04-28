import { Router } from 'express';
import { superAdminGuard } from '../auth/api/guards/super-admin-guard';
import { blogIdValidation } from '../blog/middlewares/blog-validators';
import { inputValidationResultMiddleware } from '../../core/middleware/input-validation-result.middleware';
import {
  contentValidation,
  pageNumberValidation,
  pageSizeValidation,
  shortDescriptionValidation,
  sortByValidation,
  sortDirectionValidation,
  titleValidation,
} from './post-validators';
import {
  createCreatePostHandler,
  createGetPostListHandler,
} from './post-handlers';
import type { PostService } from './post-service';

export const createPostByBlogRouter = ({
  postService,
}: {
  postService: PostService;
}) => {
  const postByBlogRouter: Router = Router({ mergeParams: true });

  postByBlogRouter
    .get(
      '/',
      blogIdValidation,
      inputValidationResultMiddleware,
      pageNumberValidation,
      pageSizeValidation,
      sortByValidation,
      sortDirectionValidation,
      createGetPostListHandler({ postService }),
    )
    .post(
      '/',
      superAdminGuard,
      blogIdValidation,
      titleValidation,
      shortDescriptionValidation,
      contentValidation,
      inputValidationResultMiddleware,
      createCreatePostHandler({ postService }),
    );

  return postByBlogRouter;
};
