import { Router } from 'express';
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

import { Container } from 'inversify';
import { PostController } from './post-controller';

export const createPostRouter = (container: Container) => {
  const postController = container.get(PostController);
  const postRouter: Router = Router();

  postRouter
    .get(
      '/',
      pageNumberValidation,
      pageSizeValidation,
      sortByValidation,
      sortDirectionValidation,
      inputValidationResultMiddleware,
      postController.getPostList,
    )
    .get(
      '/:id',
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
    .delete(
      '/:id',
      superAdminGuard,
      idValidation,
      inputValidationResultMiddleware,
      postController.deletePost,
    );

  return postRouter;
};
