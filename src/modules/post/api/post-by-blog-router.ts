import { Router } from 'express';
import { superAdminGuard } from '../../auth/api/guards/super-admin-guard';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import {
  blogIdParamValidation,
  contentValidation,
  pageNumberValidation,
  pageSizeValidation,
  shortDescriptionValidation,
  sortByValidation,
  sortDirectionValidation,
  titleValidation,
} from '../middlewares/post-validators';
import {
  createCreatePostHandler,
  createGetPostListHandler,
} from './post-handlers';
import type { PostQueryRepository } from '../infrastructure/post-query-repository';
import type { PostService } from '../domain/post-service';

export const createPostByBlogRouter = ({
  postService,
  postQueryRepository,
}: {
  postService: PostService;
  postQueryRepository: PostQueryRepository;
}) => {
  const postByBlogRouter: Router = Router({ mergeParams: true });

  postByBlogRouter
    .get(
      '/',
      blogIdParamValidation,
      pageNumberValidation,
      pageSizeValidation,
      sortByValidation,
      sortDirectionValidation,
      inputValidationResultMiddleware,
      createGetPostListHandler({ postQueryRepository }),
    )
    .post(
      '/',
      superAdminGuard,
      blogIdParamValidation,
      titleValidation,
      shortDescriptionValidation,
      contentValidation,
      inputValidationResultMiddleware,
      createCreatePostHandler({ postService, postQueryRepository }),
    );

  return postByBlogRouter;
};
