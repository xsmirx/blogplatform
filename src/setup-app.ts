import express, { Express } from 'express';
import { createTestingRouter } from './modules/testing/testing-router';
import { errorHandler } from './core/errors/error.handler';
import type { DatabaseConnection } from './bd/mongo.db';
import cookieParser from 'cookie-parser';
import { createPostByBlogRouter } from './modules/post/api/post-by-blog-router';
import { createBlogRouter } from './modules/blog/api/blog-router';
import { createPostRouter } from './modules/post/api/post-router';
import { UserQueryRepository } from './modules/user/infrastructure/user-query-repository';
import { createUserRouter } from './modules/user/api/user-router';
import { createCommentRouter } from './modules/comment/api/comment-router';
import { createCommentByPostRouter } from './modules/comment/api/comment-by-post-router';
import { createSecurityRouter } from './modules/security/api/security-router';
import { JwtAdapter } from './core/adapters/jwt-adapter/jwt-adapter';
import { AuthService } from './modules/auth/domain/auth-service';
import { createAuthRouter } from './modules/auth/api/auth-router';
import { RegistrationService } from './modules/registration/domain/registrarion-service';
import { RateLimitingService } from './modules/rateLimiting/domain/rate-limiting-service';
import { Container } from 'inversify';

type AppDependencies = {
  authService: AuthService;
  registrationService: RegistrationService;

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
      userQueryRepository: container.get(UserQueryRepository),
      registrationService: deps.registrationService,
      jwtAdapter: deps.jwtAdapter,
    }),
  );
  app.use('/users', createUserRouter(container));
  app.use('/blogs', createBlogRouter(container));
  app.use('/posts', createPostRouter(container));
  app.use('/blogs/:blogId/posts', createPostByBlogRouter(container));
  app.use('/comments', createCommentRouter(container));
  app.use('/posts/:postId/comments', createCommentByPostRouter(container));

  app.use(
    '/testing/all-data',
    createTestingRouter({ databaseConnection: deps.databaseConnection }),
  );

  app.use(errorHandler);

  return app;
};
