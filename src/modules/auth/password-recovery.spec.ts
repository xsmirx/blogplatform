import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  mockMailService,
  testDatabaseConnection,
  testMongooseDatabaseConnetcion,
} from '../../test-setup-app';

/**
 * End-to-end tests for the Password Recovery flow (api-h10.json):
 *   - POST /auth/password-recovery
 *       h10.PasswordRecoveryInputModel { email }
 *       204 always (even if email is not registered, to prevent email detection),
 *       400 if email is invalid, 429 on rate limit (covered in rate-limiting.spec.ts).
 *   - POST /auth/new-password
 *       h10.NewPasswordRecoveryInputModel { newPassword, recoveryCode }
 *       204 if code is valid and password accepted,
 *       400 if password length is wrong or recoveryCode is incorrect/expired.
 *
 * These are e2e tests: they drive the real Express app + real MongoDB (blogplatform-test),
 * with the mail adapter mocked via DI (mockMailService). The recovery code is captured
 * from the mocked sendEmail call, exactly like the registration flow does.
 *
 * NOTE (TDD): these endpoints are not implemented yet, so the suite is expected to be
 * red until the /auth/password-recovery and /auth/new-password handlers exist.
 */
describe('Password Recovery API', () => {
  const app: Express = createTestApp();

  const testUser = {
    login: 'testuser',
    password: 'password123',
    email: 'test@example.dev',
  };

  // Full flow: register -> confirm -> clear mail mock so the next captured
  // sendEmail call (calls[0]) is the password-recovery email.
  const registerAndConfirmUser = async (
    user: { login: string; password: string; email: string } = testUser,
  ): Promise<void> => {
    await request(app).post('/auth/registration').send(user).expect(204);

    const confirmationCode = mockMailService.sendEmail.mock.calls[0][1];

    await request(app)
      .post('/auth/registration-confirmation')
      .send({ code: confirmationCode })
      .expect(204);

    mockMailService.sendEmail.mockClear();
  };

  beforeAll(async () => {
    await testMongooseDatabaseConnetcion.connect();
    await request(app).delete('/testing/all-data').expect(204);
  });

  afterAll(async () => {
    await testMongooseDatabaseConnetcion.disconnect();
    await testDatabaseConnection.getClient().close();
  });

  afterEach(() => {
    mockMailService.sendEmail.mockClear();
  });

  describe('POST /auth/password-recovery', () => {
    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);
      await registerAndConfirmUser();
    });

    it('should return 204 and send an email with a recovery code for a registered email', async () => {
      await request(app)
        .post('/auth/password-recovery')
        .send({ email: testUser.email })
        .expect(204);

      expect(mockMailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendEmail).toHaveBeenCalledWith(
        testUser.email,
        expect.any(String),
        expect.any(Function),
      );
    });

    it('should return 204 but NOT send an email when the email is not registered', async () => {
      await request(app)
        .post('/auth/password-recovery')
        .send({ email: 'unknown@example.dev' })
        .expect(204);

      expect(mockMailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should return 400 when email has invalid format (222^gmail.com)', async () => {
      const response = await request(app)
        .post('/auth/password-recovery')
        .send({ email: '222^gmail.com' })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'email',
          }),
        ]),
      });
      expect(mockMailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should return 400 when email is an empty string', async () => {
      const response = await request(app)
        .post('/auth/password-recovery')
        .send({ email: '' })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'email',
          }),
        ]),
      });
      expect(mockMailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/auth/password-recovery')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'email',
          }),
        ]),
      });
      expect(mockMailService.sendEmail).not.toHaveBeenCalled();
    });
  });

  describe('POST /auth/new-password', () => {
    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);
      await registerAndConfirmUser();
    });

    // Request a recovery code and return it (captured from the mocked email).
    const requestRecoveryCode = async (
      email: string = testUser.email,
    ): Promise<string> => {
      await request(app)
        .post('/auth/password-recovery')
        .send({ email })
        .expect(204);

      const recoveryCode = mockMailService.sendEmail.mock.calls[0][1];
      mockMailService.sendEmail.mockClear();
      return recoveryCode as string;
    };

    it('should return 204 and set the new password so the user can log in with it', async () => {
      const recoveryCode = await requestRecoveryCode();
      const newPassword = 'newPassword123';

      await request(app)
        .post('/auth/new-password')
        .send({ newPassword, recoveryCode })
        .expect(204);

      // The old password must no longer work.
      await request(app)
        .post('/auth/login')
        .send({ loginOrEmail: testUser.login, password: testUser.password })
        .expect(401);

      // The new password must work.
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ loginOrEmail: testUser.login, password: newPassword })
        .expect(200);

      expect(loginResponse.body).toEqual({ accessToken: expect.any(String) });
    });

    it('should return 400 when recoveryCode does not exist', async () => {
      const response = await request(app)
        .post('/auth/new-password')
        .send({
          newPassword: 'newPassword123',
          recoveryCode: 'non-existent-code',
        })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'recoveryCode',
          }),
        ]),
      });
    });

    it('should return 400 when recoveryCode is reused (already applied / no longer valid)', async () => {
      const recoveryCode = await requestRecoveryCode();

      // First use succeeds.
      await request(app)
        .post('/auth/new-password')
        .send({ newPassword: 'newPassword123', recoveryCode })
        .expect(204);

      // Second use of the same code must be rejected (imitates an invalid/expired code).
      const response = await request(app)
        .post('/auth/new-password')
        .send({ newPassword: 'anotherPass123', recoveryCode })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'recoveryCode',
          }),
        ]),
      });
    });

    it('should return 400 when newPassword is too short (less than 6 characters)', async () => {
      const recoveryCode = await requestRecoveryCode();

      const response = await request(app)
        .post('/auth/new-password')
        .send({ newPassword: '12345', recoveryCode })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'newPassword',
          }),
        ]),
      });
    });

    it('should return 400 when newPassword is too long (more than 20 characters)', async () => {
      const recoveryCode = await requestRecoveryCode();

      const response = await request(app)
        .post('/auth/new-password')
        .send({ newPassword: 'a'.repeat(21), recoveryCode })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'newPassword',
          }),
        ]),
      });
    });

    it('should return 400 when newPassword is missing', async () => {
      const recoveryCode = await requestRecoveryCode();

      const response = await request(app)
        .post('/auth/new-password')
        .send({ recoveryCode })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'newPassword',
          }),
        ]),
      });
    });

    it('should return 400 when recoveryCode is missing', async () => {
      const response = await request(app)
        .post('/auth/new-password')
        .send({ newPassword: 'newPassword123' })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'recoveryCode',
          }),
        ]),
      });
    });
  });
});
