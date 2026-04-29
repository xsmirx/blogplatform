import express, { Express } from 'express';
import { createPostRouter } from './modules/post/post-router';
import { createTestingRouter } from './modules/testing/testing-router';
import { errorHandler } from './core/errors/error.handler';
import { createCommentRouter } from './modules/comment/comment-router';
import type { BlogService } from './modules/blog/domain/blog-service';
import type { PostService } from './modules/post/domain/post-service';
import type { CommentService } from './modules/comment/comment-service';
import type { CommentQueryRepository } from './modules/comment/comment-query-repository';
import type { DatabaseConnection } from './bd/mongo.db';
import cookieParser from 'cookie-parser';
import { createPostByBlogRouter } from './modules/post/api/post-by-blog-router';
import { createBlogRouter } from './modules/blog/api/blog-router';
import type { BlogQueryRepository } from './modules/blog/infrastucture/blog-query-repository';

type AppDependencies = {
  // authService: AuthService;
  // userService: UserService;
  // userQueryRepository: UserQueryRepository;
  blogService: BlogService;
  blogQueryRepository: BlogQueryRepository;
  postService: PostService;
  commentService: CommentService;
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

  // app.use('/security', createSecurityRouter());
  // app.use(
  //   '/auth',
  //   createAuthRouter({
  //     authService: deps.authService,
  //     userQueryRepository: deps.userQueryRepository,
  //   }),
  // );
  // app.use(
  //   '/users',
  //   createUserRouter({
  //     userService: deps.userService,
  //     userQueryRepository: deps.userQueryRepository,
  //   }),
  // );
  app.use(
    '/blogs',
    createBlogRouter({
      blogService: deps.blogService,
      blogQueryRepository: deps.blogQueryRepository,
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
