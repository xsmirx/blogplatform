import 'reflect-metadata';
import { Container } from 'inversify';
import express from 'express';
import { DatabaseConnection } from './bd/mongo.db';
import { settings } from './core/settings/settings';
import { setupApp } from './setup-app';
import { MongoUserRepository } from './modules/user/infrastructure/user-repository';
import { MongoBlogRepository } from './modules/blog/infrastucture/blog-repository';
import { MongoPostRepository } from './modules/post/infrastructure/post-repository';
import { BcryptAdapter } from './core/adapters/bcrypt-adapter';
import { MongoCommentRepository } from './modules/comment/infrastucture/comment-repository';
import { JwtAdapter } from './core/adapters/jwt-adapter/jwt-adapter';
import { DeviceService } from './modules/security/domain/device-service';
import { MongoDeviceRepository } from './modules/security/infrastructure/device-repository';
import { AuthService } from './modules/auth/domain/auth-service';
import { MongoLogRepository } from './modules/rateLimiting/infrastructure/log-repository';
import { DEVICE_REPOSITORY } from './modules/security/domain/ports/device-repository.interface';
import { USER_REPOSITORY } from './modules/user/domain/user-repository.interface';
import { BLOG_REPOSITORY } from './modules/blog/domain/blog-repository.interface';
import { POST_REPOSITORY } from './modules/post/domain/post-repository.interface';
import { COMMENT_REPOSITORY } from './modules/comment/domain/comment-repository.interface';
import { LOG_ROPOSITORY } from './modules/rateLimiting/domain/log-repository.interface';
import { REGISTATION_USER_ACESSOR } from './modules/registration/domain/ports/reistration-user-accessor.interface';

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
  container.bind(POST_REPOSITORY).to(MongoPostRepository);
  container.bind(COMMENT_REPOSITORY).to(MongoCommentRepository);
  container.bind(LOG_ROPOSITORY).to(MongoLogRepository);
  container.bind(REGISTATION_USER_ACESSOR).to(MongoUserRepository);

  // создание приложения
  const app = express();

  // Services
  const authService = new AuthService({
    userAccessor: container.get(MongoUserRepository),
    deviceService: container.get(DeviceService),
    bcryptAdapter: container.get(BcryptAdapter),
    jwtAdapter: container.get(JwtAdapter),
  });

  setupApp(app, container, {
    authService,
  });

  // запуск приложения
  app.listen(settings.PORT, settings.HOST, () => {
    console.log(`Example app listening on port ${settings.PORT}`);
  });
};

bootstrap();
