import 'reflect-metadata';
import { Container } from 'inversify';
import express from 'express';
import { DatabaseConnection } from './bd/mongo.db';
import { settings } from './core/settings/settings';
import { setupApp } from './setup-app';
import { MongoUserRepository } from './modules/user/infrastructure/user-repository';
import { MongoBlogRepository } from './modules/blog/infrastucture/blog-repository';
import { PostService } from './modules/post/domain/post-service';
import { PostQueryRepository } from './modules/post/infrastructure/post-query-repository';
import { MongoPostRepository } from './modules/post/infrastructure/post-repository';
import { BcryptAdapter } from './core/adapters/bcrypt-adapter';
import { CommentService } from './modules/comment/domain/comment-service';
import { MongoCommentRepository } from './modules/comment/infrastucture/comment-repository';
import { CommentQueryRepository } from './modules/comment/infrastucture/comment-query-repository';
import { JwtAdapter } from './core/adapters/jwt-adapter/jwt-adapter';
import { DeviceService } from './modules/security/domain/device-service';
import { MongoDeviceRepository } from './modules/security/infrastructure/device-repository';
import { AuthService } from './modules/auth/domain/auth-service';
import { RegistrationService } from './modules/registration/domain/registrarion-service';
import { mailAdapter } from './modules/registration/adapters/mail-adapter';
import { RateLimitingService } from './modules/rateLimiting/domain/rate-limiting-service';
import { MongoLogRepository } from './modules/rateLimiting/infrastructure/log-repository';
import { DEVICE_REPOSITORY } from './modules/security/domain/ports/device-repository.interface';
import { USER_REPOSITORY } from './modules/user/domain/user-repository.interface';
import { BLOG_REPOSITORY } from './modules/blog/domain/blog-repository.interface';

const bootstrap = async () => {
  // connect to DB
  const databaseConnection = new DatabaseConnection({
    mongoURL: settings.MONGO_URL,
    dbName: settings.MONGO_DB_NAME,
  });
  await databaseConnection.connect();

  const container = new Container({
    autobind: true,
    defaultScope: 'Singleton',
  });
  container.bind(DatabaseConnection).toConstantValue(databaseConnection);
  container.bind(USER_REPOSITORY).to(MongoUserRepository);
  container.bind(DEVICE_REPOSITORY).to(MongoDeviceRepository);
  container.bind(BLOG_REPOSITORY).to(MongoBlogRepository);

  // создание приложения
  const app = express();

  // Repositories
  const userRepository = new MongoUserRepository(databaseConnection);
  const blogRepository = new MongoBlogRepository(databaseConnection);
  const postRepository = new MongoPostRepository(databaseConnection);
  const postQueryRepository = new PostQueryRepository(databaseConnection);
  const commentRepository = new MongoCommentRepository(databaseConnection);
  const commentQueryRepository = new CommentQueryRepository(databaseConnection);
  const logRepository = new MongoLogRepository(databaseConnection);

  // Adapters
  const bcryptAdapter = new BcryptAdapter();
  const jwtAdapter = new JwtAdapter();

  // Services

  const postService = new PostService({ blogRepository, postRepository });
  const commentService = new CommentService({
    userRepository,
    postRepository,
    commentRepository,
  });
  const registrationService = new RegistrationService({
    userAccessor: userRepository,
    bcryptAdapter,
    mailAdapter,
  });
  const authService = new AuthService({
    userAccessor: userRepository,
    deviceService: container.get(DeviceService),
    bcryptAdapter: bcryptAdapter,
    jwtAdapter: jwtAdapter,
  });
  const rateLimitingService = new RateLimitingService({ logRepository });

  setupApp(app, container, {
    authService,
    registrationService,
    postService,
    postQueryRepository,
    commentService,
    commentQueryRepository,
    rateLimitingService,

    jwtAdapter,

    databaseConnection,
  });

  // запуск приложения
  app.listen(settings.PORT, settings.HOST, () => {
    console.log(`Example app listening on port ${settings.PORT}`);
  });
};

bootstrap();
