import express, { Express } from 'express';
import { setupApp } from './setup-app';
import { DatabaseConnection } from './bd/mongo.db';
// import { AuthService } from './modules/auth/domain/auth-service';
import { BcryptService } from './core/adapters/bcript-service';
// import { jwtService } from './modules/auth/adapters/jwt-service';
import { MongoUserRepository } from './modules/user/infrastructure/user-repository';
import { UserQueryRepository } from './modules/user/infrastructure/user-query-repository';
// import { BlackListRefreshTokenRepository } from './modules/auth/infrastructure/black-list-refresk-token-repository';
import { UserService } from './modules/user/domain/user-service';
import { MongoBlogRepository } from './modules/blog/infrastucture/blog-repository';
import { BlogQueryRepository } from './modules/blog/infrastucture/blog-query-repository';
import { BlogService } from './modules/blog/domain/blog-service';
import { MongoPostRepository } from './modules/post/infrastructure/post-repository';
import { PostQueryRepository } from './modules/post/infrastructure/post-query-repository';
import { PostService } from './modules/post/domain/post-service';
// import { CommentRepository } from './modules/comment/comment-repository';
// import { CommentQueryRepository } from './modules/comment/comment-query-repository';
// import { CommentService } from './modules/comment/comment-service';
// import type { MailService } from './modules/auth/adapters/mail-service';

// export const mockMailService: jest.Mocked<MailService> = {
//   sendEmail: jest.fn().mockResolvedValue(true),
// } as unknown as jest.Mocked<MailService>;

export const testDatabaseConnection = new DatabaseConnection({
  mongoURL: 'mongodb://admin:admin@localhost:27017',
  dbName: 'blogplatform-test',
});

export const createTestApp = (): Express => {
  const app = express();

  // Repositories
  const userRepository = new MongoUserRepository(testDatabaseConnection);
  const userQueryRepository = new UserQueryRepository(testDatabaseConnection);
  const blogRepository = new MongoBlogRepository(testDatabaseConnection);
  const blogQueryRepository = new BlogQueryRepository(testDatabaseConnection);
  const postRepository = new MongoPostRepository(testDatabaseConnection);
  const postQueryRepository = new PostQueryRepository(testDatabaseConnection);
  // const commentRepository = new CommentRepository(testDatabaseConnection);
  // const commentQueryRepository = new CommentQueryRepository(
  //   testDatabaseConnection,
  // );
  // const blackListRefreshTokenRepository = new BlackListRefreshTokenRepository(
  //   testDatabaseConnection,
  // );

  // Services
  const bcryptService = new BcryptService();

  const userService = new UserService({ bcryptService, userRepository });
  // const authService = new AuthService({
  //   bcryptService,
  //   jwtService,
  //   mailService: mockMailService,
  //   userRepository,
  //   blackListRefreshTokenRepository,
  // });
  const blogService = new BlogService(blogRepository);
  const postService = new PostService({ blogRepository, postRepository });
  // const commentService = new CommentService({
  //   userRepository,
  //   commentRepository,
  // });

  setupApp(app, {
    // authService,
    userService,
    userQueryRepository,
    blogService,
    blogQueryRepository,
    postService,
    postQueryRepository,
    // commentService,
    // commentQueryRepository,
    databaseConnection: testDatabaseConnection,
  });

  return app;
};
