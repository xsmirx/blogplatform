import { Router } from 'express';
import {
  createCreateCommentHandler,
  createCreatePostHandler,
  createDeletePostHandler,
  createGetCommentListHandler,
  createGetPostHandler,
  createGetPostListHandler,
  createUpdatePostHandler,
} from './post-handlers';
import {
  idValidation,
  pageNumberValidation,
  pageSizeValidation,
  postDTOValidation,
  sortByValidation,
  sortDirectionValidation,
} from './post-validators';
import { inputValidationResultMiddleware } from '../../core/middleware/input-validation-result.middleware';
import { superAdminGuard } from '../auth/api/guards/super-admin-guard';
import {
  commentContentValidation,
  sortByValidation as commentSortByValidation,
  sortDirectionValidation as commentSortDirectionValidation,
} from '../comment/comment-validators';
import { accessTokenGuard } from '../auth/api/guards/access-token-guard';
import type { PostService } from './post-service';
import type { CommentService } from '../comment/comment-service';
import type { CommentQueryRepository } from '../comment/comment-query-repository';

export const createPostRouter = ({
  postService,
  commentService,
  commentQueryRepository,
}: {
  postService: PostService;
  commentService: CommentService;
  commentQueryRepository: CommentQueryRepository;
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
      createGetPostListHandler({ postService }),
    )
    .get('/:id', idValidation, inputValidationResultMiddleware, createGetPostHandler({ postService }))
    .post(
      '/',
      superAdminGuard,
      postDTOValidation,
      inputValidationResultMiddleware,
      createCreatePostHandler({ postService }),
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

  postRouter
    .get(
      '/:id/comments',
      idValidation,
      pageNumberValidation,
      pageSizeValidation,
      commentSortByValidation,
      commentSortDirectionValidation,
      inputValidationResultMiddleware,
      createGetCommentListHandler({ postService, commentQueryRepository }),
    )
    .post(
      '/:id/comments',
      accessTokenGuard,
      idValidation,
      commentContentValidation,
      inputValidationResultMiddleware,
      createCreateCommentHandler({ postService, commentService, commentQueryRepository }),
    );

  return postRouter;
};
