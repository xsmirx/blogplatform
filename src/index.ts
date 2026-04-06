import express from 'express';
import { databaseConnection } from './bd/mongo.db';
import { settings } from './core/settings/settings';
import { setupApp } from './setup-app';
import { AuthService } from './modules/auth/domain/auth-service';
import { bcryptService } from './core/adapters/bcript-service';
import { jwtService } from './modules/auth/adapters/jwt-service';
import { mailService } from './modules/auth/adapters/mail-service';
import { UserRepository } from './modules/user/infrastructure/user-repository';

const bootstrap = async () => {
  // connect tot DB
  await databaseConnection.connect({
    mongoURL: settings.MONGO_URL,
    dbName: settings.MONGO_DB_NAME,
  });

  // создание приложения
  const app = express();

  const authService = new AuthService({
    bcryptService,
    jwtService,
    mailService,
    userRepository: new UserRepository(databaseConnection),
  });

  setupApp(app, { authService });

  // запуск приложения
  app.listen(settings.PORT, settings.HOST, () => {
    console.log(`Example app listening on port ${settings.PORT}`);
  });
};

bootstrap();
