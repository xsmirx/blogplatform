import request from 'supertest';
import {
  createTestApp,
  mockMailService,
  testDatabaseConnection,
} from '../../test-setup-app';

const extractRefreshToken = (res: request.Response): string | null => {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return null;
  const arr = Array.isArray(cookies) ? cookies : [cookies];
  for (const cookie of arr) {
    const match = cookie.match(/^refreshToken=([^;]+)/);
    if (match) return match[1];
  }
  return null;
};

describe('Auth API', () => {
  const app = createTestApp();

  const VALID_AUTH_HEADER = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;

  const testUser = {
    login: 'testuser',
    password: 'password123',
    email: 'test@example.dev',
  };

  const testUser2 = {
    login: 'johndoe',
    password: 'securepass',
    email: 'john@example.dev',
  };

  beforeAll(async () => {
    await testDatabaseConnection.connect();

    await request(app).delete('/testing/all-data').expect(204);
  });

  afterEach(() => {
    mockMailService.sendEmail.mockClear();
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      // Create a test user for login tests
      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);
    });

    it('should return 200 and accessToken in body and refreshToken in cookie when login and password are correct', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toEqual({
        accessToken: expect.any(String),
      });
      expect(response.body.accessToken).toBeTruthy();
      expect(response.body.accessToken.split('.').length).toBe(3);

      const refreshToken = extractRefreshToken(response);
      expect(refreshToken).toBeTruthy();

      const cookieHeader = response.headers['set-cookie'];
      const rtCookie = (
        Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader]
      ).find((c: string) => c.startsWith('refreshToken='));
      expect(rtCookie).toContain('HttpOnly');
      expect(rtCookie).toContain('Secure');
    });

    it('should return 200 and accessToken in body and refreshToken in cookie when email and password are correct', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toEqual({
        accessToken: expect.any(String),
      });
      expect(response.body.accessToken).toBeTruthy();

      const refreshToken = extractRefreshToken(response);
      expect(refreshToken).toBeTruthy();
    });

    it('should return 401 when password is wrong', async () => {
      await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should return 401 when login does not exist', async () => {
      await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: 'nonexistentuser',
          password: 'password123',
        })
        .expect(401);
    });

    it('should return 401 when email does not exist', async () => {
      await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: 'nonexistent@example.dev',
          password: 'password123',
        })
        .expect(401);
    });

    it('should return 401 when user exists but password is incorrect', async () => {
      await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: 'incorrectpassword',
        })
        .expect(401);
    });

    describe('Validation tests', () => {
      it('should return 400 when loginOrEmail is missing', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            password: 'password123',
          })
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'loginOrEmail',
            }),
          ]),
        });
      });

      it('should return 400 when password is missing', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: 'testuser',
          })
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'password',
            }),
          ]),
        });
      });

      it('should return 400 when both loginOrEmail and password are missing', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({})
          .expect(400);

        expect(response.body.errorsMessages.length).toBeGreaterThanOrEqual(2);
        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'loginOrEmail' }),
            expect.objectContaining({ field: 'password' }),
          ]),
        );
      });

      it('should return 400 when loginOrEmail is empty string', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: '',
            password: 'password123',
          })
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'loginOrEmail',
            }),
          ]),
        });
      });

      it('should return 400 when password is empty string', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: 'testuser',
            password: '',
          })
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'password',
            }),
          ]),
        });
      });

      it('should return 400 when loginOrEmail is only whitespace', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: '   ',
            password: 'password123',
          })
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'loginOrEmail',
            }),
          ]),
        });
      });
    });

    describe('Case sensitivity tests', () => {
      it('should be case-sensitive for login', async () => {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login.toUpperCase(),
            password: testUser.password,
          })
          .expect(401);
      });

      it('should be case-insensitive for email', async () => {
        // Most email systems are case-insensitive
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.email.toUpperCase(),
            password: testUser.password,
          })
          .expect(200);

        expect(response.body).toEqual({
          accessToken: expect.any(String),
        });
      });
    });

    describe('Multiple users tests', () => {
      beforeEach(async () => {
        await request(app).delete('/testing/all-data').expect(204);

        // Create multiple users
        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send(testUser)
          .expect(201);

        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send(testUser2)
          .expect(201);
      });

      it('should authenticate first user correctly', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        expect(response.body.accessToken).toBeTruthy();
      });

      it('should authenticate second user correctly', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser2.login,
            password: testUser2.password,
          })
          .expect(200);

        expect(response.body.accessToken).toBeTruthy();
      });

      it('should not authenticate first user with second users password', async () => {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser2.password,
          })
          .expect(401);
      });

      it('should not authenticate second user with first users password', async () => {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser2.login,
            password: testUser.password,
          })
          .expect(401);
      });

      it('should authenticate user by email', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.email,
            password: testUser.password,
          })
          .expect(200);

        expect(response.body.accessToken).toBeTruthy();
      });

      it('should authenticate user by login', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        expect(response.body.accessToken).toBeTruthy();
      });
    });

    describe('Edge cases', () => {
      beforeEach(async () => {
        await request(app).delete('/testing/all-data').expect(204);

        // Create a user with minimum length password
        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'minuser',
            password: '123456',
            email: 'min@example.dev',
          })
          .expect(201);
      });

      it('should authenticate with minimum length password', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: 'minuser',
            password: '123456',
          })
          .expect(200);

        expect(response.body.accessToken).toBeTruthy();
      });

      it('should not authenticate with password missing one character', async () => {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: 'minuser',
            password: '12345',
          })
          .expect(401);
      });

      it('should not authenticate with password having extra character', async () => {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: 'minuser',
            password: '1234567',
          })
          .expect(401);
      });
    });

    describe('Special characters in credentials', () => {
      beforeEach(async () => {
        await request(app).delete('/testing/all-data').expect(204);

        // Create a user with special characters in password
        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'special',
            password: 'P@ssw0rd!',
            email: 'special@example.dev',
          })
          .expect(201);
      });

      it('should authenticate with special characters in password', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: 'special',
            password: 'P@ssw0rd!',
          })
          .expect(200);

        expect(response.body.accessToken).toBeTruthy();
      });

      it('should not authenticate if special character is missing', async () => {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: 'special',
            password: 'P@ssw0rd',
          })
          .expect(401);
      });
    });

    describe('Trimming tests', () => {
      it('should not trim loginOrEmail field', async () => {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: ' testuser ',
            password: testUser.password,
          })
          .expect(401);
      });

      it('should not trim password field', async () => {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: ' password123 ',
          })
          .expect(401);
      });
    });

    describe('SQL injection and security tests', () => {
      it('should not authenticate with SQL injection attempt in loginOrEmail', async () => {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: "' OR '1'='1",
            password: 'password123',
          })
          .expect(401);
      });

      it('should not authenticate with SQL injection attempt in password', async () => {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: "' OR '1'='1",
          })
          .expect(401);
      });

      it('should not authenticate with NoSQL injection attempt', async () => {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: { $ne: null },
            password: { $ne: null },
          })
          .expect(400);
      });
    });

    describe('Response body tests', () => {
      it('should return accessToken on successful login', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        expect(response.body).toEqual({
          accessToken: expect.any(String),
        });
        expect(typeof response.body.accessToken).toBe('string');
        expect(response.body.accessToken.split('.').length).toBe(3); // JWT has 3 parts
      });

      it('should not return any sensitive information on failed login', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: 'wrongpassword',
          })
          .expect(401);

        // Should not expose whether user exists or not
        expect(response.body).not.toHaveProperty('user');
        expect(response.body).not.toHaveProperty('id');
        expect(response.body).not.toHaveProperty('email');
      });
    });

    describe('Concurrent login attempts', () => {
      it('should handle multiple concurrent login attempts', async () => {
        const promises = [];
        for (let i = 0; i < 5; i++) {
          promises.push(
            request(app).post('/auth/login').send({
              loginOrEmail: testUser.login,
              password: testUser.password,
            }),
          );
        }

        const responses = await Promise.all(promises);
        responses.forEach((response) => {
          expect(response.status).toBe(200);
          expect(response.body.accessToken).toBeTruthy();
        });
      });

      it('should handle mixed success and failure login attempts', async () => {
        const promises = [
          request(app).post('/auth/login').send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          }),
          request(app).post('/auth/login').send({
            loginOrEmail: testUser.login,
            password: 'wrongpassword',
          }),
          request(app).post('/auth/login').send({
            loginOrEmail: testUser.email,
            password: testUser.password,
          }),
        ];

        const responses = await Promise.all(promises);
        expect(responses[0].status).toBe(200);
        expect(responses[0].body.accessToken).toBeTruthy();
        expect(responses[1].status).toBe(401);
        expect(responses[2].status).toBe(200);
        expect(responses[2].body.accessToken).toBeTruthy();
      });
    });

    describe('Device creation and tracking', () => {
      it('should create a device session on successful login', async () => {
        const loginResponse = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const refreshToken = extractRefreshToken(loginResponse);

        // Device should be visible in security/devices endpoint
        const devicesResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        expect(Array.isArray(devicesResponse.body)).toBe(true);
        expect(devicesResponse.body.length).toBeGreaterThan(0);
        expect(devicesResponse.body[0]).toHaveProperty('deviceId');
      });

      it('should create separate devices for each login', async () => {
        const login1 = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const login2 = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const refreshToken1 = extractRefreshToken(login1);
        const refreshToken2 = extractRefreshToken(login2);

        const devices1 = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken1}`)
          .expect(200);

        const devices2 = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken2}`)
          .expect(200);

        expect(devices1.body.length).toBe(2);
        expect(devices2.body.length).toBe(2);
      });

      it('should capture IP address of login request', async () => {
        const loginResponse = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const refreshToken = extractRefreshToken(loginResponse);

        const devicesResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        const device = devicesResponse.body[0];
        expect(device.ip).toBeTruthy();
        expect(typeof device.ip).toBe('string');
      });

      it('should extract device title from User-Agent header', async () => {
        const userAgent =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

        const loginResponse = await request(app)
          .post('/auth/login')
          .set('User-Agent', userAgent)
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const refreshToken = extractRefreshToken(loginResponse);

        const devicesResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        const device = devicesResponse.body[0];
        expect(device.title).toBeTruthy();
        expect(typeof device.title).toBe('string');
      });

      it('should set lastActiveDate to login time', async () => {
        const beforeLogin = new Date();

        const loginResponse = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const afterLogin = new Date();
        const refreshToken = extractRefreshToken(loginResponse);

        const devicesResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        const device = devicesResponse.body[0];
        const lastActiveDate = new Date(device.lastActiveDate);

        expect(lastActiveDate.getTime()).toBeGreaterThanOrEqual(
          beforeLogin.getTime(),
        );
        expect(lastActiveDate.getTime()).toBeLessThanOrEqual(
          afterLogin.getTime() + 1000,
        );
      });
    });
  });

  describe('POST /auth/registration', () => {
    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);
    });

    it('should return 204 when input data is valid', async () => {
      await request(app).post('/auth/registration').send(testUser).expect(204);

      expect(mockMailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendEmail).toHaveBeenCalledWith(
        testUser.email,
        expect.any(String),
        expect.any(Function),
      );
    });

    it('should return 400 when login is missing', async () => {
      const response = await request(app)
        .post('/auth/registration')
        .send({
          password: 'password123',
          email: 'test@example.dev',
        })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'login',
          }),
        ]),
      });
      expect(mockMailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/auth/registration')
        .send({
          login: 'testuser',
          email: 'test@example.dev',
        })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'password',
          }),
        ]),
      });
      expect(mockMailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/auth/registration')
        .send({
          login: 'testuser',
          password: 'password123',
        })
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

    it('should return 400 when login is too short (less than 3 characters)', async () => {
      const response = await request(app)
        .post('/auth/registration')
        .send({
          login: 'ab',
          password: 'password123',
          email: 'test@example.dev',
        })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'login',
          }),
        ]),
      });
    });

    it('should return 400 when login is too long (more than 10 characters)', async () => {
      const response = await request(app)
        .post('/auth/registration')
        .send({
          login: 'verylonglogin',
          password: 'password123',
          email: 'test@example.dev',
        })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'login',
          }),
        ]),
      });
    });

    it('should return 400 when login contains invalid characters', async () => {
      const response = await request(app)
        .post('/auth/registration')
        .send({
          login: 'user@123',
          password: 'password123',
          email: 'test@example.dev',
        })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'login',
          }),
        ]),
      });
    });

    it('should return 400 when password is too short (less than 6 characters)', async () => {
      const response = await request(app)
        .post('/auth/registration')
        .send({
          login: 'testuser',
          password: 'pass1',
          email: 'test@example.dev',
        })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'password',
          }),
        ]),
      });
    });

    it('should return 400 when password is too long (more than 20 characters)', async () => {
      const response = await request(app)
        .post('/auth/registration')
        .send({
          login: 'testuser',
          password: 'verylongpasswordthatexceeds20characters',
          email: 'test@example.dev',
        })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'password',
          }),
        ]),
      });
    });

    it('should return 400 when email has invalid format', async () => {
      const response = await request(app)
        .post('/auth/registration')
        .send({
          login: 'testuser',
          password: 'password123',
          email: 'invalid-email',
        })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'email',
          }),
        ]),
      });
    });

    it('should return 400 with multiple errors when multiple fields are invalid', async () => {
      const response = await request(app)
        .post('/auth/registration')
        .send({
          login: 'ab',
          password: 'short',
          email: 'invalid',
        })
        .expect(400);

      expect(response.body.errorsMessages.length).toBeGreaterThanOrEqual(3);
      expect(response.body.errorsMessages).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'login' }),
          expect.objectContaining({ field: 'password' }),
          expect.objectContaining({ field: 'email' }),
        ]),
      );
    });

    it('should return 400 when login is already taken', async () => {
      // Register first user
      await request(app).post('/auth/registration').send(testUser).expect(204);

      mockMailService.sendEmail.mockClear();

      // Try to register with same login
      const response = await request(app)
        .post('/auth/registration')
        .send({
          login: testUser.login,
          password: 'otherpassword1',
          email: 'other@example.dev',
        })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'login',
          }),
        ]),
      });
      expect(mockMailService.sendEmail).not.toHaveBeenCalled();
    });

    it('should return 400 when email is already taken', async () => {
      // Register first user
      await request(app).post('/auth/registration').send(testUser).expect(204);

      mockMailService.sendEmail.mockClear();

      // Try to register with same email
      const response = await request(app)
        .post('/auth/registration')
        .send({
          login: 'otheruser',
          password: 'otherpassword1',
          email: testUser.email,
        })
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

  describe('POST /auth/registration-confirmation', () => {
    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);
    });

    it('should return 204 when confirmation code is valid', async () => {
      // Register a user to get a confirmation code
      await request(app).post('/auth/registration').send(testUser).expect(204);

      // Extract the confirmation code from the mock call
      const confirmationCode = mockMailService.sendEmail.mock.calls[0][1];

      await request(app)
        .post('/auth/registration-confirmation')
        .send({ code: confirmationCode })
        .expect(204);
    });

    it('should return 400 when code is already confirmed', async () => {
      await request(app).post('/auth/registration').send(testUser).expect(204);

      const confirmationCode = mockMailService.sendEmail.mock.calls[0][1];

      // Confirm first time
      await request(app)
        .post('/auth/registration-confirmation')
        .send({ code: confirmationCode })
        .expect(204);

      // Try to confirm again
      const response = await request(app)
        .post('/auth/registration-confirmation')
        .send({ code: confirmationCode })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'code',
          }),
        ]),
      });
    });

    it('should return 400 when code does not exist', async () => {
      const response = await request(app)
        .post('/auth/registration-confirmation')
        .send({ code: 'nonexistent-code-12345' })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'code',
          }),
        ]),
      });
    });

    it('should return 400 when code is missing', async () => {
      const response = await request(app)
        .post('/auth/registration-confirmation')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'code',
          }),
        ]),
      });
    });

    it('should return 400 when code is empty string', async () => {
      const response = await request(app)
        .post('/auth/registration-confirmation')
        .send({ code: '' })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'code',
          }),
        ]),
      });
    });

    it('should return 400 when code is only whitespace', async () => {
      const response = await request(app)
        .post('/auth/registration-confirmation')
        .send({ code: '   ' })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'code',
          }),
        ]),
      });
    });

    it('should return 400 when code is not a string', async () => {
      const response = await request(app)
        .post('/auth/registration-confirmation')
        .send({ code: 12345 })
        .expect(400);

      expect(response.body).toEqual({
        errorsMessages: expect.arrayContaining([
          expect.objectContaining({
            message: expect.any(String),
            field: 'code',
          }),
        ]),
      });
    });
  });

  describe('POST /auth/registration-email-resending', () => {
    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);
    });

    it('should return 204 and resend email for unconfirmed user', async () => {
      // Register a user (unconfirmed by default)
      await request(app).post('/auth/registration').send(testUser).expect(204);

      mockMailService.sendEmail.mockClear();

      // Resend confirmation email
      await request(app)
        .post('/auth/registration-email-resending')
        .send({ email: testUser.email })
        .expect(204);

      expect(mockMailService.sendEmail).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendEmail).toHaveBeenCalledWith(
        testUser.email,
        expect.any(String),
        expect.any(Function),
      );
    });

    it('should not send email when email is missing', async () => {
      const response = await request(app)
        .post('/auth/registration-email-resending')
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

    it('should not send email when email has invalid format', async () => {
      const response = await request(app)
        .post('/auth/registration-email-resending')
        .send({ email: 'not-an-email' })
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

    it('should not send email when email has no @ symbol', async () => {
      const response = await request(app)
        .post('/auth/registration-email-resending')
        .send({ email: 'invalidemail.com' })
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

    it('should not send email when email has no domain', async () => {
      const response = await request(app)
        .post('/auth/registration-email-resending')
        .send({ email: 'user@' })
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

  describe('GET /auth/me', () => {
    let accessToken: string;

    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      // Create a test user
      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);

      // Login to get access token
      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(200);

      accessToken = loginResponse.body.accessToken;
    });

    it('should return 401 when no authorization header provided', async () => {
      await request(app).get('/auth/me').expect(401);
    });

    it('should return 401 when authorization header is empty', async () => {
      await request(app).get('/auth/me').set('authorization', '').expect(401);
    });

    it('should return 401 when invalid token provided', async () => {
      await request(app)
        .get('/auth/me')
        .set('authorization', 'Bearer invalidtoken')
        .expect(401);
    });

    it('should return 401 when malformed token provided', async () => {
      await request(app)
        .get('/auth/me')
        .set('authorization', 'Bearer not.a.jwt')
        .expect(401);
    });

    it('should return 401 when token without Bearer prefix', async () => {
      await request(app)
        .get('/auth/me')
        .set('authorization', accessToken)
        .expect(401);
    });

    it('should return 200 and user info when valid token provided', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        email: expect.any(String),
        login: expect.any(String),
        userId: expect.any(String),
      });
    });

    it('should return correct user information', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.email).toBe(testUser.email);
      expect(response.body.login).toBe(testUser.login);
      expect(response.body.userId).toBeTruthy();
      expect(typeof response.body.userId).toBe('string');
    });

    it('should return different info for different users', async () => {
      // Create second user
      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser2)
        .expect(201);

      // Login as second user
      const loginResponse2 = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser2.login,
          password: testUser2.password,
        })
        .expect(200);

      const accessToken2 = loginResponse2.body.accessToken;

      // Get info for first user
      const response1 = await request(app)
        .get('/auth/me')
        .set('authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Get info for second user
      const response2 = await request(app)
        .get('/auth/me')
        .set('authorization', `Bearer ${accessToken2}`)
        .expect(200);

      // Should be different users
      expect(response1.body.userId).not.toBe(response2.body.userId);
      expect(response1.body.login).toBe(testUser.login);
      expect(response2.body.login).toBe(testUser2.login);
      expect(response1.body.email).toBe(testUser.email);
      expect(response2.body.email).toBe(testUser2.email);
    });

    it('should work with token from recent login', async () => {
      // Login again
      const newLoginResponse = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(200);

      const newAccessToken = newLoginResponse.body.accessToken;

      // Both tokens should work
      await request(app)
        .get('/auth/me')
        .set('authorization', `Bearer ${accessToken}`)
        .expect(200);

      await request(app)
        .get('/auth/me')
        .set('authorization', `Bearer ${newAccessToken}`)
        .expect(200);
    });

    it('should validate JWT structure of token', async () => {
      expect(accessToken).toBeTruthy();
      expect(typeof accessToken).toBe('string');

      // JWT should have 3 parts separated by dots
      const parts = accessToken.split('.');
      expect(parts.length).toBe(3);

      // Each part should be base64 encoded
      parts.forEach((part) => {
        expect(part.length).toBeGreaterThan(0);
      });
    });

    describe('Edge cases', () => {
      it('should return 401 with Bearer prefix but no token', async () => {
        await request(app)
          .get('/auth/me')
          .set('authorization', 'Bearer ')
          .expect(401);
      });

      it('should return 401 with extra spaces in Bearer token', async () => {
        await request(app)
          .get('/auth/me')
          .set('authorization', `Bearer  ${accessToken}`)
          .expect(401);
      });

      it('should return 401 with lowercase bearer', async () => {
        await request(app)
          .get('/auth/me')
          .set('authorization', `bearer ${accessToken}`)
          .expect(401);
      });

      it('should not expose user info without proper authentication', async () => {
        const response = await request(app).get('/auth/me').expect(401);

        expect(response.body).not.toHaveProperty('email');
        expect(response.body).not.toHaveProperty('login');
        expect(response.body).not.toHaveProperty('userId');
      });
    });
  });

  describe('POST /auth/refresh-token', () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(200);

      refreshToken = extractRefreshToken(loginResponse)!;
    });

    it('should return 200 and new accessToken in body and new refreshToken in cookie', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(response.body).toEqual({
        accessToken: expect.any(String),
      });
      expect(response.body.accessToken.split('.').length).toBe(3);

      const newRefreshToken = extractRefreshToken(response);
      expect(newRefreshToken).toBeTruthy();

      const cookieHeader = response.headers['set-cookie'];
      const rtCookie = (
        Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader]
      ).find((c: string) => c.startsWith('refreshToken='));
      expect(rtCookie).toContain('HttpOnly');
      expect(rtCookie).toContain('Secure');
    });

    it('should return new accessToken that works for /auth/me', async () => {
      const refreshResponse = await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const newAccessToken = refreshResponse.body.accessToken;

      const meResponse = await request(app)
        .get('/auth/me')
        .set('authorization', `Bearer ${newAccessToken}`)
        .expect(200);

      expect(meResponse.body.login).toBe(testUser.login);
      expect(meResponse.body.email).toBe(testUser.email);
    });

    it('should revoke old refreshToken after refresh', async () => {
      // Use refresh token to get new pair
      await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      // Try to use the old refresh token again — should be revoked
      await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(401);
    });

    it('should allow chaining refresh tokens', async () => {
      // First refresh
      const response1 = await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const newRefreshToken1 = extractRefreshToken(response1)!;

      // Second refresh with the new token
      const response2 = await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${newRefreshToken1}`)
        .expect(200);

      expect(response2.body.accessToken).toBeTruthy();

      const newRefreshToken2 = extractRefreshToken(response2);
      expect(newRefreshToken2).toBeTruthy();
      expect(newRefreshToken2).not.toBe(newRefreshToken1);
    });

    it('should return 401 when no cookie is sent', async () => {
      await request(app).post('/auth/refresh-token').expect(401);
    });

    it('should return 401 when refreshToken cookie is invalid', async () => {
      await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', 'refreshToken=invalid.token.value')
        .expect(401);
    });

    it('should return 401 when refreshToken cookie is empty', async () => {
      await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', 'refreshToken=')
        .expect(401);
    });

    it('should return different tokens on each refresh', async () => {
      const response = await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const newRefreshToken = extractRefreshToken(response);
      expect(newRefreshToken).not.toBe(refreshToken);
    });

    describe('Device lastActiveDate update', () => {
      it('should update device lastActiveDate on refresh-token', async () => {
        // Get initial lastActiveDate
        const devicesBeforeResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        const initialLastActiveDate = new Date(
          devicesBeforeResponse.body[0].lastActiveDate,
        );

        // Wait a bit to ensure time difference
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Refresh token
        const refreshResponse = await request(app)
          .post('/auth/refresh-token')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        const newRefreshToken = extractRefreshToken(refreshResponse)!;

        // Get updated lastActiveDate
        const devicesAfterResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${newRefreshToken}`)
          .expect(200);

        const updatedLastActiveDate = new Date(
          devicesAfterResponse.body[0].lastActiveDate,
        );

        expect(updatedLastActiveDate.getTime()).toBeGreaterThan(
          initialLastActiveDate.getTime(),
        );
      });

      it('should maintain the same device during refresh-token chain', async () => {
        // Get initial device info
        const devicesInitialResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        const initialDeviceId = devicesInitialResponse.body[0].deviceId;

        // Refresh multiple times
        let currentRefreshToken = refreshToken;
        for (let i = 0; i < 3; i++) {
          const refreshResponse = await request(app)
            .post('/auth/refresh-token')
            .set('Cookie', `refreshToken=${currentRefreshToken}`)
            .expect(200);

          currentRefreshToken = extractRefreshToken(refreshResponse)!;
        }

        // Get final device info
        const devicesFinalResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${currentRefreshToken}`)
          .expect(200);

        const finalDeviceId = devicesFinalResponse.body[0].deviceId;

        // Device ID should remain the same
        expect(finalDeviceId).toBe(initialDeviceId);
      });

      it('should update lastActiveDate to current time on refresh', async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));

        const beforeRefresh = new Date();

        const refreshResponse = await request(app)
          .post('/auth/refresh-token')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        const afterRefresh = new Date();
        const newRefreshToken = extractRefreshToken(refreshResponse)!;

        const devicesResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${newRefreshToken}`)
          .expect(200);

        const device = devicesResponse.body[0];
        const lastActiveDate = new Date(device.lastActiveDate);

        expect(lastActiveDate.getTime()).toBeGreaterThanOrEqual(
          beforeRefresh.getTime(),
        );
        expect(lastActiveDate.getTime()).toBeLessThanOrEqual(
          afterRefresh.getTime() + 1000,
        );
      });

      it('should update lastActiveDate for correct device when multiple sessions exist', async () => {
        // Create a second login
        const login2 = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const refreshToken2 = extractRefreshToken(login2)!;

        // Get devices before refresh
        const devicesBeforeResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        const device1Before = devicesBeforeResponse.body.find(
          (d: any) =>
            extractRefreshToken(login2) ===
            devicesBeforeResponse.body.find(
              (dev: any) => dev.deviceId === d.deviceId,
            ),
        );
        const device2Before = devicesBeforeResponse.body.find(
          (d: any) => d !== device1Before,
        );

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Refresh only the first token
        const refreshResponse = await request(app)
          .post('/auth/refresh-token')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        const newRefreshToken = extractRefreshToken(refreshResponse)!;

        // Get devices after refresh
        const devicesAfterResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${newRefreshToken}`)
          .expect(200);

        const device1After = devicesAfterResponse.body.find(
          (d: any) => d.deviceId === device1Before.deviceId,
        );

        const device1LastActiveDateBefore = new Date(
          device1Before.lastActiveDate,
        );
        const device1LastActiveDateAfter = new Date(
          device1After.lastActiveDate,
        );

        expect(device1LastActiveDateAfter.getTime()).toBeGreaterThan(
          device1LastActiveDateBefore.getTime(),
        );
      });
    });
  });

  describe('POST /auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(200);

      refreshToken = extractRefreshToken(loginResponse)!;
    });

    it('should return 204 when logout with valid refreshToken', async () => {
      await request(app)
        .post('/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(204);
    });

    it('should revoke refreshToken after logout', async () => {
      // Logout
      await request(app)
        .post('/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(204);

      // Try to use the same refresh token — should be revoked
      await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(401);
    });

    it('should return 401 when no cookie is sent', async () => {
      await request(app).post('/auth/logout').expect(401);
    });

    it('should return 401 when refreshToken cookie is invalid', async () => {
      await request(app)
        .post('/auth/logout')
        .set('Cookie', 'refreshToken=invalid.token.value')
        .expect(401);
    });

    it('should return 401 when refreshToken is already revoked', async () => {
      // Logout first time
      await request(app)
        .post('/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(204);

      // Try to logout again with the same token
      await request(app)
        .post('/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(401);
    });

    it('should not affect other sessions (other refresh tokens should still work)', async () => {
      // Login again to get a second refresh token
      const loginResponse2 = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(200);

      const refreshToken2 = extractRefreshToken(loginResponse2)!;

      // Logout first session
      await request(app)
        .post('/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(204);

      // Second session's refresh token should still work
      await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken2}`)
        .expect(200);
    });

    describe('Device termination on logout', () => {
      it('should remove device from active devices list after logout', async () => {
        // Get devices before logout
        const devicesBeforeResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        const initialDeviceCount = devicesBeforeResponse.body.length;

        // Logout
        await request(app)
          .post('/auth/logout')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(204);

        // Create another session to check devices
        const loginResponse2 = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const refreshToken2 = extractRefreshToken(loginResponse2)!;

        // Get devices after logout
        const devicesAfterResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken2}`)
          .expect(200);

        const newDeviceCount = devicesAfterResponse.body.length;

        // Device count should be less (old session removed)
        expect(newDeviceCount).toBeLessThan(initialDeviceCount + 1);
      });

      it('should not affect devices of other users after logout', async () => {
        // Create another user
        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send(testUser2)
          .expect(201);

        const otherUserLogin = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser2.login,
            password: testUser2.password,
          })
          .expect(200);

        const otherUserRefreshToken = extractRefreshToken(otherUserLogin)!;

        // Get other user's devices count before
        const otherDevicesBefore = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${otherUserRefreshToken}`)
          .expect(200);

        const otherDevicesCountBefore = otherDevicesBefore.body.length;

        // Logout first user
        await request(app)
          .post('/auth/logout')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(204);

        // Get other user's devices count after
        const otherDevicesAfter = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${otherUserRefreshToken}`)
          .expect(200);

        const otherDevicesCountAfter = otherDevicesAfter.body.length;

        // Other user's device count should not change
        expect(otherDevicesCountAfter).toBe(otherDevicesCountBefore);
      });
    });
  });
});
