import express, { Express } from 'express';
import { createTestingRouter } from './modules/testing/testing-router';
import { errorHandler } from './core/errors/error.handler';
import cookieParser from 'cookie-parser';
import { createPostByBlogRouter } from './modules/post/api/post-by-blog-router';
import { createBlogRouter } from './modules/blog/api/blog-router';
import { createPostRouter } from './modules/post/api/post-router';
import { createUserRouter } from './modules/user/api/user-router';
import { createCommentRouter } from './modules/comment/api/comment-router';
import { createCommentByPostRouter } from './modules/comment/api/comment-by-post-router';
import { createSecurityRouter } from './modules/security/api/security-router';
import { createAuthRouter } from './modules/auth/api/auth-router';
import { Container } from 'inversify';

export const setupApp = (app: Express, container: Container) => {
  app.set('trust proxy', true);
  app.use(cookieParser());
  app.use(express.json()); // middleware для парсинга JSON в теле запроса

  // основной роут
  app.get('/', (req, res) => {
    res.status(200).send('Hello world! h10');
  });

  app.use('/security', createSecurityRouter(container));
  app.use('/auth', createAuthRouter(container));
  app.use('/users', createUserRouter(container));
  app.use('/blogs', createBlogRouter(container));
  app.use('/posts', createPostRouter(container));
  app.use('/blogs/:blogId/posts', createPostByBlogRouter(container));
  app.use('/comments', createCommentRouter(container));
  app.use('/posts/:postId/comments', createCommentByPostRouter(container));

  app.use('/testing/all-data', createTestingRouter(container));

  app.use(errorHandler);

  return app;
};
