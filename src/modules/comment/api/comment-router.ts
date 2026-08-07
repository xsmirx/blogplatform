import { Router } from 'express';
import {
  commentContentValidation,
  idValidation,
} from '../middlewares/comment-validators';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { createAccessTokenGuard } from '../../../core/guards/access-token-guard';
import { Container } from 'inversify';
import { CommentController } from './comment-controller';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter/jwt-adapter';

export const createCommentRouter = (container: Container) => {
  const commentController = container.get(CommentController);
  const jwtAdapter = container.get(JwtAdapter);

  const commentRouter: Router = Router();

  commentRouter
    .get(
      '/:id',
      idValidation,
      inputValidationResultMiddleware,
      commentController.getComment,
    )
    .put(
      '/:id',
      createAccessTokenGuard({ jwtAdapter }),
      idValidation,
      commentContentValidation,
      inputValidationResultMiddleware,
      commentController.updateComment,
    )
    .delete(
      '/:id',
      createAccessTokenGuard({ jwtAdapter }),
      idValidation,
      inputValidationResultMiddleware,
      commentController.deleteComment,
    );

  return commentRouter;
};
