import express, { Express } from 'express';
import { createTestingRouter } from './modules/testing/testing-router';
import { errorHandler } from './core/errors/error.handler';
import type { BlogService } from './modules/blog/domain/blog-service';
import type { PostService } from './modules/post/domain/post-service';
import type { DatabaseConnection } from './bd/mongo.db';
import cookieParser from 'cookie-parser';
import { createPostByBlogRouter } from './modules/post/api/post-by-blog-router';
import { createBlogRouter } from './modules/blog/api/blog-router';
import type { BlogQueryRepository } from './modules/blog/infrastucture/blog-query-repository';
import { createPostRouter } from './modules/post/api/post-router';
import type { PostQueryRepository } from './modules/post/infrastructure/post-query-repository';
import type { UserService } from './modules/user/domain/user-service';
import type { UserQueryRepository } from './modules/user/infrastructure/user-query-repository';
import { createUserRouter } from './modules/user/api/user-router';
import { createCommentRouter } from './modules/comment/api/comment-router';
import { createCommentByPostRouter } from './modules/comment/api/comment-by-post-router';
import type { CommentQueryRepository } from './modules/comment/infrastucture/comment-query-repository';
import type { CommentService } from './modules/comment/domain/comment-service';
import { createSecurityRouter } from './modules/security/api/security-router';
import { DeviceService } from './modules/security/domain/device-service';
import { DeviceQueryRepository } from './modules/security/infrastructure/device-query-repository';
import { JwtAdapter } from './core/adapters/jwt-adapter/jwt-adapter';
import { AuthService } from './modules/auth/domain/auth-service';
import { createAuthRouter } from './modules/auth/api/auth-router';
import { RegistrationService } from './modules/registration/domain/registrarion-service';
import { RateLimitingService } from './modules/rateLimiting/domain/rate-limiting-service';
import { Container } from 'inversify';

type AppDependencies = {
  authService: AuthService;
  registrationService: RegistrationService;
  deviceService: DeviceService;
  deviceQueryRepository: DeviceQueryRepository;
  userService: UserService;
  userQueryRepository: UserQueryRepository;
  blogService: BlogService;
  blogQueryRepository: BlogQueryRepository;
  postService: PostService;
  postQueryRepository: PostQueryRepository;
  commentService: CommentService;
  commentQueryRepository: CommentQueryRepository;
  rateLimitingService: RateLimitingService;

  jwtAdapter: JwtAdapter;

  databaseConnection: DatabaseConnection;
};

export const setupApp = (
  app: Express,
  container: Container,
  deps: AppDependencies,
) => {
  app.set('trust proxy', true);
  app.use(cookieParser());
  app.use(express.json()); // middleware для парсинга JSON в теле запроса

  // основной роут
  app.get('/', (req, res) => {
    res.status(200).send('Hello world! h10');
  });

  app.use('/security', createSecurityRouter(container));
  app.use(
    '/auth',
    createAuthRouter({
      rateLimitingService: deps.rateLimitingService,
      authService: deps.authService,
      userQueryRepository: deps.userQueryRepository,
      registrationService: deps.registrationService,
      jwtAdapter: deps.jwtAdapter,
    }),
  );
  app.use('/users', createUserRouter(container));
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
      postQueryRepository: deps.postQueryRepository,
      blogQueryRepository: deps.blogQueryRepository,
    }),
  );
  app.use(
    '/blogs/:blogId/posts',
    createPostByBlogRouter({
      postService: deps.postService,
      postQueryRepository: deps.postQueryRepository,
      blogQueryRepository: deps.blogQueryRepository,
    }),
  );
  app.use(
    '/comments',
    createCommentRouter({
      commentService: deps.commentService,
      commentQueryRepository: deps.commentQueryRepository,
      jwtAdapter: deps.jwtAdapter,
    }),
  );
  app.use(
    '/posts/:postId/comments',
    createCommentByPostRouter({
      commentService: deps.commentService,
      commentQueryRepository: deps.commentQueryRepository,
      postQueryRepository: deps.postQueryRepository,
      jwtAdapter: deps.jwtAdapter,
    }),
  );

  app.use(
    '/testing/all-data',
    createTestingRouter({ databaseConnection: deps.databaseConnection }),
  );

  app.use(errorHandler);

  return app;
};
