import { Router } from 'express';
import type { PostQueryRepository } from '../infrastructure/post-query-repository';
import type { PostService } from '../domain/post-service';
import {
  createCreatePostHandler,
  createDeletePostHandler,
  createGetPostHandler,
  createGetPostListHandler,
  createUpdatePostHandler,
} from './post-handlers';
import { superAdminGuard } from '../../auth/api/guards/super-admin-guard';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import {
  idValidation,
  pageNumberValidation,
  pageSizeValidation,
  postDTOValidation,
  sortByValidation,
  sortDirectionValidation,
} from '../middlewares/post-validators';
import type { BlogQueryRepository } from '../../blog/infrastucture/blog-query-repository';

export const createPostRouter = ({
  postService,
  postQueryRepository,
  blogQueryRepository,
}: {
  postService: PostService;
  postQueryRepository: PostQueryRepository;
  blogQueryRepository: BlogQueryRepository;
}) => {
  const postRouter: Router = Router();

  postRouter
    .get(
      '/',
      pageNumberValidation,
      pageSizeValidation,
      sortByValidation,
      sortDirectionValidation,
      inputValidationResultMiddleware,
      createGetPostListHandler({ postQueryRepository, blogQueryRepository }),
    )
    .get(
      '/:id',
      idValidation,
      inputValidationResultMiddleware,
      createGetPostHandler({ postQueryRepository }),
    )
    .post(
      '/',
      superAdminGuard,
      postDTOValidation,
      inputValidationResultMiddleware,
      createCreatePostHandler({ postService, postQueryRepository }),
    )
    .put(
      '/:id',
      superAdminGuard,
      idValidation,
      postDTOValidation,
      inputValidationResultMiddleware,
      createUpdatePostHandler({ postService }),
    )
    .delete(
      '/:id',
      superAdminGuard,
      idValidation,
      inputValidationResultMiddleware,
      createDeletePostHandler({ postService }),
    );

  return postRouter;
};
