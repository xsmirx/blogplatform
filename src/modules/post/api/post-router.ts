import { Router } from 'express';
import { superAdminGuard } from '../../auth/api/guards/super-admin-guard';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import {
  idValidation,
  likeStatusValidation,
  pageNumberValidation,
  pageSizeValidation,
  postDTOValidation,
  sortByValidation,
  sortDirectionValidation,
} from '../middlewares/post-validators';

import { Container } from 'inversify';
import { PostController } from './post-controller';
import { createAccessTokenGuard } from '../../../core/guards/access-token-guard';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter/jwt-adapter';
import { createOptionalAccessTokenGuard } from '../../../core/guards/optional-access-token-guard';

export const createPostRouter = (container: Container) => {
  const jwtAdapter = container.get(JwtAdapter);
  const postController = container.get(PostController);
  const postRouter: Router = Router();

  postRouter
    .get(
      '/',
      createOptionalAccessTokenGuard({ jwtAdapter }),
      pageNumberValidation,
      pageSizeValidation,
      sortByValidation,
      sortDirectionValidation,
      inputValidationResultMiddleware,
      postController.getPostList,
    )
    .get(
      '/:id',
      createOptionalAccessTokenGuard({ jwtAdapter }),
      idValidation,
      inputValidationResultMiddleware,
      postController.getPost,
    )
    .post(
      '/',
      superAdminGuard,
      postDTOValidation,
      inputValidationResultMiddleware,
      postController.createPost,
    )
    .put(
      '/:id',
      superAdminGuard,
      idValidation,
      postDTOValidation,
      inputValidationResultMiddleware,
      postController.updatePost,
    )
    .put(
      '/:id/like-status',
      createAccessTokenGuard({ jwtAdapter }),
      idValidation,
      likeStatusValidation,
      inputValidationResultMiddleware,
      postController.updateLike,
    )
    .delete(
      '/:id',
      superAdminGuard,
      idValidation,
      inputValidationResultMiddleware,
      postController.deletePost,
    );

  return postRouter;
};
