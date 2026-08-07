import 'reflect-metadata';
import express, { Express } from 'express';
import { Container } from 'inversify';
import { setupApp } from './setup-app';
import { DatabaseConnection } from './bd/mongo.db';
import { BcryptAdapter } from './core/adapters/bcrypt-adapter';
import { MongoUserRepository } from './modules/user/infrastructure/user-repository';
import { MongoBlogRepository } from './modules/blog/infrastucture/blog-repository';
import { MongoPostRepository } from './modules/post/infrastructure/post-repository';
import { MongoCommentRepository } from './modules/comment/infrastucture/comment-repository';
import { AuthService } from './modules/auth/domain/auth-service';
import { JwtAdapter } from './core/adapters/jwt-adapter/jwt-adapter';
import { DeviceService } from './modules/security/domain/device-service';
import { MongoDeviceRepository } from './modules/security/infrastructure/device-repository';
import { MailAdapter } from './modules/registration/adapters/mail-adapter';
import { MongoLogRepository } from './modules/rateLimiting/infrastructure/log-repository';
import { DEVICE_REPOSITORY } from './modules/security/domain/ports/device-repository.interface';
import { USER_REPOSITORY } from './modules/user/domain/user-repository.interface';
import { BLOG_REPOSITORY } from './modules/blog/domain/blog-repository.interface';
import { POST_REPOSITORY } from './modules/post/domain/post-repository.interface';
import { COMMENT_REPOSITORY } from './modules/comment/domain/comment-repository.interface';
import { LOG_ROPOSITORY } from './modules/rateLimiting/domain/log-repository.interface';
import { REGISTATION_USER_ACESSOR } from './modules/registration/domain/ports/reistration-user-accessor.interface';

export const mockMailService: jest.Mocked<MailAdapter> = {
  sendEmail: jest.fn().mockResolvedValue(true),
} as unknown as jest.Mocked<MailAdapter>;

export const testDatabaseConnection = new DatabaseConnection({
  mongoURL: 'mongodb://admin:admin@localhost:27017',
  dbName: 'blogplatform-test',
});

export const createTestApp = (): Express => {
  const app = express();

  const container = new Container({
    autobind: true,
    defaultScope: 'Singleton',
  });
  container.bind(DatabaseConnection).toConstantValue(testDatabaseConnection);
  container.bind(USER_REPOSITORY).to(MongoUserRepository);
  container.bind(DEVICE_REPOSITORY).to(MongoDeviceRepository);
  container.bind(BLOG_REPOSITORY).to(MongoBlogRepository);
  container.bind(POST_REPOSITORY).to(MongoPostRepository);
  container.bind(COMMENT_REPOSITORY).to(MongoCommentRepository);
  container.bind(LOG_ROPOSITORY).to(MongoLogRepository);
  container.bind(REGISTATION_USER_ACESSOR).to(MongoUserRepository);
  container.bind(MailAdapter).toConstantValue(mockMailService);

  // Repositories built manually for services not resolved through the container
  const userRepository = new MongoUserRepository(testDatabaseConnection);

  // Adapters
  const bcryptAdapter = new BcryptAdapter();
  const jwtAdapter = new JwtAdapter();

  // Services

  const authService = new AuthService({
    userAccessor: userRepository,
    deviceService: container.get(DeviceService),
    bcryptAdapter,
    jwtAdapter,
  });

  setupApp(app, container, {
    authService,
  });

  return app;
};
