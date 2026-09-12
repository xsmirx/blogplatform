import 'reflect-metadata';
import express, { Express } from 'express';
import { Container } from 'inversify';
import { setupApp } from './setup-app';
import { DatabaseConnection } from './db/mongo.db';
import { MongoUserRepository } from './modules/user/infrastructure/user-repository';
import { MongoBlogRepository } from './modules/blog/infrastucture/blog-repository';
import { MongoPostRepository } from './modules/post/infrastructure/post-repository';
import { MongoCommentRepository } from './modules/comment/infrastucture/comment-repository';
import { MongoDeviceRepository } from './modules/security/infrastructure/device-repository';
import { MailAdapter } from './core/adapters/email-adapter/mail-adapter';
import { MongoLogRepository } from './modules/rateLimiting/infrastructure/log-repository';
import { DEVICE_REPOSITORY } from './modules/security/domain/ports/device-repository.interface';
import { USER_REPOSITORY } from './modules/user/domain/user-repository.interface';
import { BLOG_REPOSITORY } from './modules/blog/domain/blog-repository.interface';
import { POST_REPOSITORY } from './modules/post/domain/post-repository.interface';
import { COMMENT_REPOSITORY } from './modules/comment/domain/comment-repository.interface';
import { LOG_ROPOSITORY } from './modules/rateLimiting/domain/log-repository.interface';
import { REGISTATION_USER_ACESSOR } from './modules/registration/domain/ports/reistration-user-accessor.interface';
import { AUTH_USER_ACCESSOR } from './modules/auth/domain/ports/auth-user-accessor.interface';
import { RECOVERY_REPOSITORY } from './modules/recovery/domain/ports/recovery-repository.interface';
import { MongoRecoveryRepository } from './modules/recovery/infrastuucture/recovery-repository';
import { RECOVERY_USER_REPOSITORY } from './modules/recovery/domain/ports/recovery-user-repository.interface';
import { MongooseDatabaseConnection } from './db/mongoose.db';
import { BLOG_MODEL, BlogModel } from './modules/blog/infrastucture/blog-model';
import {
  DEVICE_MODEL,
  DeviceModel,
} from './modules/security/infrastructure/device-model';
import {
  POST_MODEL,
  PostModel,
} from './modules/post/infrastructure/post-model';
import {
  COMMENT_MODEL,
  CommentModel,
} from './modules/comment/infrastucture/comment-model';
import {
  LOG_MODEL,
  LogModel,
} from './modules/rateLimiting/infrastructure/log-model';
import {
  RECOVERY_MODEL,
  RecoveryModel,
} from './modules/recovery/infrastuucture/recovery-model';

export const mockMailService: jest.Mocked<MailAdapter> = {
  sendEmail: jest.fn().mockResolvedValue(true),
} as unknown as jest.Mocked<MailAdapter>;

export const testDatabaseConnection = new DatabaseConnection({
  mongoURL: 'mongodb://admin:admin@localhost:27017',
  dbName: 'blogplatform-test',
});

export const testMongooseDatabaseConnetcion = new MongooseDatabaseConnection(
  'mongodb://admin:admin@localhost:27017/blogplatform-test?authSource=admin',
);

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
  container.bind(AUTH_USER_ACCESSOR).to(MongoUserRepository);
  container.bind(MailAdapter).toConstantValue(mockMailService);
  container.bind(RECOVERY_REPOSITORY).to(MongoRecoveryRepository);
  container.bind(RECOVERY_USER_REPOSITORY).to(MongoUserRepository);

  container.bind(BLOG_MODEL).toConstantValue(BlogModel);
  container.bind(POST_MODEL).toConstantValue(PostModel);
  container.bind(COMMENT_MODEL).toConstantValue(CommentModel);
  container.bind(DEVICE_MODEL).toConstantValue(DeviceModel);
  container.bind(LOG_MODEL).toConstantValue(LogModel);
  container.bind(RECOVERY_MODEL).toConstantValue(RecoveryModel);

  setupApp(app, container);

  return app;
};
