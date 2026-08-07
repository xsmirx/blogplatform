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

export const createPostByBlogRouter = (container: Container) => {
  const postController = container.get(PostController);
  const postByBlogRouter: Router = Router({ mergeParams: true });

  postByBlogRouter
    .get(
      '/',
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
