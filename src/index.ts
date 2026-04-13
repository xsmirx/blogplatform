import express from 'express';
import { DatabaseConnection } from './bd/mongo.db';
import { settings } from './core/settings/settings';
import { setupApp } from './setup-app';
import { AuthService } from './modules/auth/domain/auth-service';
import { bcryptService } from './core/adapters/bcript-service';
import { jwtService } from './modules/auth/adapters/jwt-service';
import { mailService } from './modules/auth/adapters/mail-service';
import { UserRepository } from './modules/user/infrastructure/user-repository';
import { BlackListRefreshTokenRepository } from './modules/auth/infrastructure/black-list-refresk-token-repository';

const bootstrap = async () => {
  // connect tot DB
  const databaseConnection = new DatabaseConnection({
    mongoURL: settings.MONGO_URL,
    dbName: settings.MONGO_DB_NAME,
  });
  await databaseConnection.connect();

  // создание приложения
  const app = express();

  const authService = new AuthService({
    bcryptService,
    jwtService,
    mailService,
    userRepository: new UserRepository(databaseConnection),
    blackListRefreshTokenRepository: new BlackListRefreshTokenRepository(
      databaseConnection,
    ),
  });

  setupApp(app, { authService });

  // запуск приложения
  app.listen(settings.PORT, settings.HOST, () => {
    console.log(`Example app listening on port ${settings.PORT}`);
  });
};

bootstrap();
