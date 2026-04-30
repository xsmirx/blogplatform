import { Router } from 'express';
import {
  createCreateCommentHandler,
  createGetCommentListHandler,
} from './comment-handlers';
import type { CommentQueryRepository } from '../infrastucture/comment-query-repository';
import type { PostQueryRepository } from '../../post/infrastructure/post-query-repository';
import type { CommentService } from '../domain/comment-service';
import {
  commentContentValidation,
  pageNumberValidation,
  pageSizeValidation,
  postIdValidation,
  sortByValidation,
  sortDirectionValidation,
} from '../middlewares/comment-validators';
import { accessTokenGuard } from '../../auth/api/guards/access-token-guard';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';

export const createCommentByPostRouter = ({
  commentService,
  commentQueryRepository,
  postQueryRepository,
}: {
  commentService: CommentService;
  commentQueryRepository: CommentQueryRepository;
  postQueryRepository: PostQueryRepository;
}) => {
  const commentByPostRouter: Router = Router({ mergeParams: true });

  commentByPostRouter
    .get(
      '/',
      postIdValidation,
      pageNumberValidation,
      pageSizeValidation,
      sortByValidation,
      sortDirectionValidation,
      inputValidationResultMiddleware,
      createGetCommentListHandler({
        commentQueryRepository,
        postQueryRepository,
      }),
    )
    .post(
      '/',
      accessTokenGuard,
      postIdValidation,
      commentContentValidation,
      inputValidationResultMiddleware,
      createCreateCommentHandler({ commentService, commentQueryRepository }),
    );

  return commentByPostRouter;
};
