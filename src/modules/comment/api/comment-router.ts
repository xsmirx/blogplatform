import { Router } from 'express';
import type { CommentService } from '../domain/comment-service';
import type { CommentQueryRepository } from '../infrastucture/comment-query-repository';
import {
  commentContentValidation,
  idValidation,
} from '../middlewares/comment-validators';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { createAccessTokenGuard } from '../../../core/guards/access-token-guard';
import {
  createDeleteCommentHandler,
  createGetCommentHandler,
  createUpdateCommentHandler,
} from './comment-handlers';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter/jwt-adapter';

export const createCommentRouter = ({
  commentService,
  commentQueryRepository,
  jwtAdapter,
}: {
  commentService: CommentService;
  commentQueryRepository: CommentQueryRepository;
  jwtAdapter: JwtAdapter;
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
      createAccessTokenGuard({ jwtAdapter }),
      idValidation,
      commentContentValidation,
      inputValidationResultMiddleware,
      createUpdateCommentHandler({ commentService }),
    )
    .delete(
      '/:id',
      createAccessTokenGuard({ jwtAdapter }),
      idValidation,
      inputValidationResultMiddleware,
      createDeleteCommentHandler({ commentService }),
    );

  return commentRouter;
};
