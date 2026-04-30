import { Router } from 'express';
import type { CommentService } from '../domain/comment-service';
import type { CommentQueryRepository } from '../infrastucture/comment-query-repository';
import {
  commentContentValidation,
  idValidation,
} from '../middlewares/comment-validators';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { accessTokenGuard } from '../../auth/api/guards/access-token-guard';
import {
  createDeleteCommentHandler,
  createGetCommentHandler,
  createUpdateCommentHandler,
} from './comment-handlers';

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
      idValidation,
      inputValidationResultMiddleware,
      createGetCommentHandler({ commentQueryRepository }),
    )
    .put(
      '/:id',
      accessTokenGuard,
      idValidation,
      commentContentValidation,
      inputValidationResultMiddleware,
      createUpdateCommentHandler({ commentService }),
    )
    .delete(
      '/:id',
      accessTokenGuard,
      idValidation,
      inputValidationResultMiddleware,
      createDeleteCommentHandler({ commentService }),
    );

  return commentRouter;
};
