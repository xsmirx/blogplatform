import express, { Express } from 'express';
import { setupApp } from './setup-app';
import { DatabaseConnection } from './bd/mongo.db';
import { BcryptAdapter } from './core/adapters/bcrypt-adapter';
import { MongoUserRepository } from './modules/user/infrastructure/user-repository';
import { UserQueryRepository } from './modules/user/infrastructure/user-query-repository';
import { UserService } from './modules/user/domain/user-service';
import { MongoBlogRepository } from './modules/blog/infrastucture/blog-repository';
import { BlogQueryRepository } from './modules/blog/infrastucture/blog-query-repository';
import { BlogService } from './modules/blog/domain/blog-service';
import { MongoPostRepository } from './modules/post/infrastructure/post-repository';
import { PostQueryRepository } from './modules/post/infrastructure/post-query-repository';
import { PostService } from './modules/post/domain/post-service';
import { CommentService } from './modules/comment/domain/comment-service';
import { MongoCommentRepository } from './modules/comment/infrastucture/comment-repository';
import { CommentQueryRepository } from './modules/comment/infrastucture/comment-query-repository';
import { AuthService } from './modules/auth/domain/auth-service';
import { JwtAdapter } from './core/adapters/jwt-adapter/jwt-adapter';
import { DeviceService } from './modules/security/domain/device-service';
import { MongoDeviceRepository } from './modules/security/infrastructure/device-repository';
import { RegistrationService } from './modules/registration/domain/registrarion-service';
import { MailAdapter } from './modules/registration/adapters/mail-adapter';
import { DeviceQueryRepository } from './modules/security/infrastructure/device-query-repository';
import { RateLimitingService } from './modules/rateLimiting/domain/rate-limiting-service';
import { MongoLogRepository } from './modules/rateLimiting/infrastructure/log-repository';

export const mockMailService: jest.Mocked<MailAdapter> = {
  sendEmail: jest.fn().mockResolvedValue(true),
} as unknown as jest.Mocked<MailAdapter>;

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
  const commentRepository = new MongoCommentRepository(testDatabaseConnection);
  const commentQueryRepository = new CommentQueryRepository(
    testDatabaseConnection,
  );
  const deviceRepository = new MongoDeviceRepository(testDatabaseConnection);
  const deviceQueryRepository = new DeviceQueryRepository(
    testDatabaseConnection,
  );
  const logRepository = new MongoLogRepository(testDatabaseConnection);

  // Services
  const bcryptAdapter = new BcryptAdapter();
  const jwtAdapter = new JwtAdapter();
  const mailAdapter = mockMailService;

  const userService = new UserService({
    bcryptAdapter: bcryptAdapter,
    userRepository,
  });
  const deviceService = new DeviceService({
    deviceRepository,
  });
  const authService = new AuthService({
    bcryptAdapter,
    jwtAdapter,
    userAccessor: userRepository,
    deviceService,
  });
  const registrationService = new RegistrationService({
    bcryptAdapter,
    mailAdapter,
    userAccessor: userRepository,
  });
  const blogService = new BlogService(blogRepository);
  const postService = new PostService({ blogRepository, postRepository });
  const commentService = new CommentService({
    userRepository,
    postRepository,
    commentRepository,
  });
  const rateLimitingService = new RateLimitingService({ logRepository });

  setupApp(app, {
    rateLimitingService,
    authService,
    registrationService,
    deviceService,
    deviceQueryRepository,
    userService,
    userQueryRepository,
    blogService,
    blogQueryRepository,
    postService,
    postQueryRepository,
    commentService,
    commentQueryRepository,
    jwtAdapter,
    databaseConnection: testDatabaseConnection,
  });

  return app;
};
