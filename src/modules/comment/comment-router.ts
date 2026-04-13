import { Router } from 'express';
import {
  createUpdateCommentHandler,
  createDeleteCommentHandler,
  createGetCommentHandler,
} from './comment-handlers';
import {
  commentContentValidation,
  commentIdValidation,
} from './comment-validators';
import { inputValidationResultMiddleware } from '../../core/middleware/input-validation-result.middleware';
import { accessTokenGuard } from '../auth/api/guards/access-token-guard';
import type { CommentService } from './comment-service';
import type { CommentQueryRepository } from './comment-query-repository';

export const createCommentRouter = ({
  commentService,
  commentQueryRepository,
}: {
  commentService: CommentService;
  commentQueryRepository: CommentQueryRepository;
}) => {
  const commentRouter: Router = Router();

  commentRouter
    .get(
      '/:id',
      commentIdValidation,
      inputValidationResultMiddleware,
      createGetCommentHandler({ commentQueryRepository }),
    )
    .put(
      '/:id',
      accessTokenGuard,
      commentIdValidation,
      commentContentValidation,
      inputValidationResultMiddleware,
      createUpdateCommentHandler({ commentService }),
    )
    .delete(
      '/:id',
      accessTokenGuard,
      commentIdValidation,
      inputValidationResultMiddleware,
      createDeleteCommentHandler({ commentService }),
    );

  return commentRouter;
};
