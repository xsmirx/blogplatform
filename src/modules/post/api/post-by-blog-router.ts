import { Router } from 'express';
import { superAdminGuard } from '../../auth/api/guards/super-admin-guard';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import {
  blogIdParamValidation,
  contentValidation,
  pageNumberValidation,
  pageSizeValidation,
  shortDescriptionValidation,
  sortByValidation,
  sortDirectionValidation,
  titleValidation,
} from '../middlewares/post-validators';
import { Container } from 'inversify';
import { PostController } from './post-controller';
import { createOptionalAccessTokenGuard } from '../../../core/guards/optional-access-token-guard';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter/jwt-adapter';

export const createPostByBlogRouter = (container: Container) => {
  const postController = container.get(PostController);
  const jwtAdapter = container.get(JwtAdapter);
  const postByBlogRouter: Router = Router({ mergeParams: true });

  postByBlogRouter
    .get(
      '/',
      createOptionalAccessTokenGuard({ jwtAdapter }),
      blogIdParamValidation,
      pageNumberValidation,
      pageSizeValidation,
      sortByValidation,
      sortDirectionValidation,
      inputValidationResultMiddleware,
      postController.getPostList,
    )
    .post(
      '/',
      superAdminGuard,
      blogIdParamValidation,
      titleValidation,
      shortDescriptionValidation,
      contentValidation,
      inputValidationResultMiddleware,
      postController.createPost,
    );

  return postByBlogRouter;
};
