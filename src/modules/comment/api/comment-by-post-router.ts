import { Router } from 'express';
import {
  commentContentValidation,
  pageNumberValidation,
  pageSizeValidation,
  postIdValidation,
  sortByValidation,
  sortDirectionValidation,
} from '../middlewares/comment-validators';
import { createAccessTokenGuard } from '../../../core/guards/access-token-guard';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';

import { Container } from 'inversify';
import { CommentController } from './comment-controller';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter/jwt-adapter';

export const createCommentByPostRouter = (container: Container) => {
  const commentController = container.get(CommentController);
  const jwtAdapter = container.get(JwtAdapter);

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
      commentController.getCommentList,
    )
    .post(
      '/',
      createAccessTokenGuard({ jwtAdapter }),
      postIdValidation,
      commentContentValidation,
      inputValidationResultMiddleware,
      commentController.createComment,
    );

  return commentByPostRouter;
};
