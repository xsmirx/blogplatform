import express, { Express } from 'express';
import { setupApp } from './setup-app';
import { AuthService } from './modules/auth/domain/auth-service';
import { bcryptService } from './core/adapters/bcript-service';
import { jwtService } from './modules/auth/adapters/jwt-service';
import { UserRepository } from './modules/user/infrastructure/user-repository';
import { databaseConnection } from './bd/mongo.db';
import type { MailService } from './modules/auth/adapters/mail-service';

export const mockMailService: jest.Mocked<MailService> = {
  sendEmail: jest.fn().mockResolvedValue(true),
} as unknown as jest.Mocked<MailService>;

export const createTestApp = (): Express => {
  const app = express();

  const authService = new AuthService({
    bcryptService,
    jwtService,
    mailService: mockMailService,
    userRepository: new UserRepository(databaseConnection),
  });

  setupApp(app, { authService });

  return app;
};
