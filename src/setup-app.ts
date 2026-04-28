import express, { Express } from 'express';
import { createPostRouter } from './modules/post/post-router';
import { createTestingRouter } from './modules/testing/testing-router';
import { errorHandler } from './core/errors/error.handler';
import { createUserRouter } from './modules/user/api/user-router';
import { createCommentRouter } from './modules/comment/comment-router';
import { createAuthRouter } from './modules/auth/api/auth-router';
import type { AuthService } from './modules/auth/domain/auth-service';
import type { UserService } from './modules/user/domain/user-service';
import type { BlogService } from './modules/blog/domain/blog-service';
import type { PostService } from './modules/post/post-service';
import type { CommentService } from './modules/comment/comment-service';
import type { UserQueryRepository } from './modules/user/infrastructure/user-query-repository';
import type { CommentQueryRepository } from './modules/comment/comment-query-repository';
import type { DatabaseConnection } from './bd/mongo.db';
import cookieParser from 'cookie-parser';
import { createSecurityRouter } from './modules/security/api/security-router';
import { createPostByBlogRouter } from './modules/post/post-by-blog-router';
import { createBlogRouter } from './modules/blog/api/blog-router';

type AppDependencies = {
  authService: AuthService;
  userService: UserService;
  blogService: BlogService;
  postService: PostService;
  commentService: CommentService;
  userQueryRepository: UserQueryRepository;
  commentQueryRepository: CommentQueryRepository;
  databaseConnection: DatabaseConnection;
};

export const setupApp = (app: Express, deps: AppDependencies) => {
  app.use(cookieParser());
  app.use(express.json()); // middleware для парсинга JSON в теле запроса

  // основной роут
  app.get('/', (req, res) => {
    res.status(200).send('Hello world! h06');
  });

  app.use('/security', createSecurityRouter());
  app.use(
    '/auth',
    createAuthRouter({
      authService: deps.authService,
      userQueryRepository: deps.userQueryRepository,
    }),
  );
  app.use(
    '/users',
    createUserRouter({
      userService: deps.userService,
      userQueryRepository: deps.userQueryRepository,
    }),
  );
  app.use(
    '/blogs',
    createBlogRouter({
      blogService: deps.blogService,
    }),
  );
  app.use(
    '/posts',
    createPostRouter({
      postService: deps.postService,
      commentService: deps.commentService,
      commentQueryRepository: deps.commentQueryRepository,
    }),
  );
  app.use(
    '/blogs/:blogId/posts',
    createPostByBlogRouter({
      postService: deps.postService,
    }),
  );
  app.use(
    '/comments',
    createCommentRouter({
      commentService: deps.commentService,
      commentQueryRepository: deps.commentQueryRepository,
    }),
  );

  app.use(
    '/testing/all-data',
    createTestingRouter({ databaseConnection: deps.databaseConnection }),
  );

  app.use(errorHandler);

  return app;
};
