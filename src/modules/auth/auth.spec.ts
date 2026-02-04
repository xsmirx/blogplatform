import express from 'express';
import request from 'supertest';
import { setupApp } from '../../setup-app';
import { databaseConnection } from '../../bd';

describe('Auth API', () => {
  const app = express();
  setupApp(app);

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
    await databaseConnection.connect({
      mongoURL: 'mongodb://admin:admin@localhost:27017',
      dbName: 'blogplatform-test',
    });

    await request(app).delete('/testing/all-data').expect(204);
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

    it('should return 204 when login and password are correct', async () => {
      await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(204);
    });

    it('should return 204 when email and password are correct', async () => {
      await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.email,
          password: testUser.password,
        })
        .expect(204);
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

      it('should return 400 when password is only whitespace', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: 'testuser',
            password: '   ',
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
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.email.toUpperCase(),
            password: testUser.password,
          })
          .expect(204);
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
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(204);
      });

      it('should authenticate second user correctly', async () => {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser2.login,
            password: testUser2.password,
          })
          .expect(204);
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
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.email,
            password: testUser.password,
          })
          .expect(204);
      });

      it('should authenticate user by login', async () => {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(204);
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
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: 'minuser',
            password: '123456',
          })
          .expect(204);
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
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: 'special',
            password: 'P@ssw0rd!',
          })
          .expect(204);
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
      it('should return empty body on successful login', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(204);

        expect(response.body).toEqual({});
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
          expect(response.status).toBe(204);
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
        expect(responses[0].status).toBe(204);
        expect(responses[1].status).toBe(401);
        expect(responses[2].status).toBe(204);
      });
    });
  });
});
