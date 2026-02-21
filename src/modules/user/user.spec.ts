import express from 'express';
import request from 'supertest';
import { setupApp } from '../../setup-app';
import { databaseConnection } from '../../bd/mongo.db';

describe('User API', () => {
  const app = express();
  setupApp(app);

  const VALID_AUTH_HEADER = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;
  const INVALID_AUTH_HEADER = `Basic ${Buffer.from('admin:wrong').toString('base64')}`;

  const testUser = {
    login: 'testuser',
    password: 'password123',
    email: 'test@example.dev',
  };

  beforeAll(async () => {
    await databaseConnection.connect({
      mongoURL: 'mongodb://admin:admin@localhost:27017',
      dbName: 'blogplatform-test',
    });

    await request(app).delete('/testing/all-data').expect(204);
  });

  describe('GET /users', () => {
    it('should return 401 when unauthorized', async () => {
      await request(app).get('/users').expect(401);
    });

    it('should return 401 with invalid credentials', async () => {
      await request(app)
        .get('/users')
        .set('authorization', INVALID_AUTH_HEADER)
        .expect(401);
    });

    it('should return 200 and paginator with empty items when no users exist', async () => {
      const response = await request(app)
        .get('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .expect(200);

      // Verify Paginator structure
      expect(response.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('should return 200 and paginator with users when users exist', async () => {
      // Create a user first
      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);

      // Get all users
      const response = await request(app)
        .get('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .expect(200);

      // Verify Paginator structure
      expect(response.body).toEqual({
        pagesCount: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalCount: expect.any(Number),
        items: expect.any(Array),
      });

      expect(response.body.totalCount).toBeGreaterThan(0);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            login: expect.any(String),
            email: expect.any(String),
            createdAt: expect.any(String),
          }),
        ]),
      );

      // Verify createdAt is valid ISO date string
      const user = response.body.items[0];
      expect(new Date(user.createdAt).toISOString()).toBe(user.createdAt);
    });

    describe('Search by login tests', () => {
      beforeAll(async () => {
        await request(app).delete('/testing/all-data').expect(204);

        // Create multiple users with different logins
        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'admin123',
            password: 'password123',
            email: 'admin@example.dev',
          })
          .expect(201);

        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'moderator',
            password: 'password456',
            email: 'moderator@example.dev',
          })
          .expect(201);

        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'user123',
            password: 'password789',
            email: 'user@example.dev',
          })
          .expect(201);
      });

      it('should find users by partial login match (case insensitive)', async () => {
        const response = await request(app)
          .get('/users?searchLoginTerm=123')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.totalCount).toBe(2);
        expect(response.body.items.length).toBe(2);
        expect(
          response.body.items.every((user: { login: string }) =>
            user.login.toLowerCase().includes('123'),
          ),
        ).toBe(true);
      });

      it('should find users by login term at the beginning', async () => {
        const response = await request(app)
          .get('/users?searchLoginTerm=admin')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.totalCount).toBe(1);
        expect(response.body.items[0].login).toBe('admin123');
      });

      it('should find users by login term at the end', async () => {
        const response = await request(app)
          .get('/users?searchLoginTerm=tor')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.totalCount).toBe(1);
        expect(response.body.items[0].login).toBe('moderator');
      });

      it('should find users by login term in the middle', async () => {
        const response = await request(app)
          .get('/users?searchLoginTerm=era')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.totalCount).toBe(1);
        expect(response.body.items[0].login).toBe('moderator');
      });

      it('should return all users when searchLoginTerm is not provided', async () => {
        const response = await request(app)
          .get('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.totalCount).toBe(3);
      });

      it('should return empty items when no users match searchLoginTerm', async () => {
        const response = await request(app)
          .get('/users?searchLoginTerm=nonexistent')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.totalCount).toBe(0);
        expect(response.body.items).toEqual([]);
      });

      it('should search case-insensitively', async () => {
        const response1 = await request(app)
          .get('/users?searchLoginTerm=ADMIN')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        const response2 = await request(app)
          .get('/users?searchLoginTerm=admin')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response1.body.totalCount).toBe(response2.body.totalCount);
        expect(response1.body.totalCount).toBe(1);
      });
    });

    describe('Search by email tests', () => {
      beforeAll(async () => {
        await request(app).delete('/testing/all-data').expect(204);

        // Create multiple users with different emails
        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'john',
            password: 'password123',
            email: 'john@gmail.com',
          })
          .expect(201);

        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'jane',
            password: 'password456',
            email: 'jane@yahoo.com',
          })
          .expect(201);

        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'bob',
            password: 'password789',
            email: 'bob@gmail.com',
          })
          .expect(201);
      });

      it('should find users by partial email match (case insensitive)', async () => {
        const response = await request(app)
          .get('/users?searchEmailTerm=gmail')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.totalCount).toBe(2);
        expect(response.body.items.length).toBe(2);
        expect(
          response.body.items.every((user: { email: string }) =>
            user.email.toLowerCase().includes('gmail'),
          ),
        ).toBe(true);
      });

      it('should find users by email term at the beginning', async () => {
        const response = await request(app)
          .get('/users?searchEmailTerm=jane')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.totalCount).toBe(1);
        expect(response.body.items[0].email).toBe('jane@yahoo.com');
      });

      it('should find users by email term at the end', async () => {
        const response = await request(app)
          .get('/users?searchEmailTerm=yahoo.com')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.totalCount).toBe(1);
        expect(response.body.items[0].email).toBe('jane@yahoo.com');
      });

      it('should return all users when searchEmailTerm is not provided', async () => {
        const response = await request(app)
          .get('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.totalCount).toBe(3);
      });

      it('should return empty items when no users match searchEmailTerm', async () => {
        const response = await request(app)
          .get('/users?searchEmailTerm=nonexistent')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.totalCount).toBe(0);
        expect(response.body.items).toEqual([]);
      });

      it('should search case-insensitively', async () => {
        const response1 = await request(app)
          .get('/users?searchEmailTerm=GMAIL')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        const response2 = await request(app)
          .get('/users?searchEmailTerm=gmail')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response1.body.totalCount).toBe(response2.body.totalCount);
        expect(response1.body.totalCount).toBe(2);
      });
    });

    describe('Search by both login and email tests', () => {
      beforeAll(async () => {
        await request(app).delete('/testing/all-data').expect(204);

        // Create multiple users
        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'alice',
            password: 'password123',
            email: 'alice@test.com',
          })
          .expect(201);

        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'bob',
            password: 'password456',
            email: 'bob@example.dev',
          })
          .expect(201);

        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'charlie',
            password: 'password789',
            email: 'charlie@test.com',
          })
          .expect(201);
      });

      it('should find users matching either login or email search term', async () => {
        const response = await request(app)
          .get('/users?searchLoginTerm=alice&searchEmailTerm=example')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        // Should find alice (by login) and bob (by email)
        expect(response.body.totalCount).toBe(2);
      });

      it('should combine both search filters correctly', async () => {
        const response = await request(app)
          .get('/users?searchLoginTerm=bob&searchEmailTerm=bob')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        // Should find bob (matches both)
        expect(response.body.totalCount).toBe(1);
        expect(response.body.items[0].login).toBe('bob');
      });
    });

    describe('Pagination tests', () => {
      beforeAll(async () => {
        await request(app).delete('/testing/all-data').expect(204);

        // Create 25 users for pagination testing
        for (let i = 1; i <= 25; i++) {
          await request(app)
            .post('/users')
            .set('authorization', VALID_AUTH_HEADER)
            .send({
              login: `user${i.toString().padStart(2, '0')}`,
              password: 'password123',
              email: `user${i}@example.dev`,
            })
            .expect(201);
        }
      });

      it('should use default pageSize of 10', async () => {
        const response = await request(app)
          .get('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.pageSize).toBe(10);
        expect(response.body.items.length).toBe(10);
      });

      it('should use default pageNumber of 1', async () => {
        const response = await request(app)
          .get('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.page).toBe(1);
      });

      it('should return correct pageSize when specified', async () => {
        const response = await request(app)
          .get('/users?pageSize=5')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.pageSize).toBe(5);
        expect(response.body.items.length).toBe(5);
      });

      it('should return correct page when pageNumber specified', async () => {
        const response = await request(app)
          .get('/users?pageNumber=2')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.page).toBe(2);
        expect(response.body.items.length).toBe(10);
      });

      it('should correctly calculate pagesCount', async () => {
        const response = await request(app)
          .get('/users?pageSize=10')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.totalCount).toBe(25);
        expect(response.body.pagesCount).toBe(3); // 25 / 10 = 3 pages
      });

      it('should handle pageSize of 1 correctly', async () => {
        const response = await request(app)
          .get('/users?pageSize=1')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.pageSize).toBe(1);
        expect(response.body.items.length).toBe(1);
        expect(response.body.pagesCount).toBe(25);
      });

      it('should handle pageSize of 20 (maximum) correctly', async () => {
        const response = await request(app)
          .get('/users?pageSize=20')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.pageSize).toBe(20);
        expect(response.body.items.length).toBe(20);
        expect(response.body.pagesCount).toBe(2); // 25 / 20 = 2 pages
      });

      it('should handle last page with fewer items', async () => {
        const response = await request(app)
          .get('/users?pageNumber=3&pageSize=10')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.page).toBe(3);
        expect(response.body.items.length).toBe(5); // Last 5 items
        expect(response.body.totalCount).toBe(25);
      });

      it('should return empty items for page beyond available data', async () => {
        const response = await request(app)
          .get('/users?pageNumber=10&pageSize=10')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.page).toBe(10);
        expect(response.body.items).toEqual([]);
        expect(response.body.totalCount).toBe(25);
      });
    });

    describe('Sorting tests', () => {
      beforeAll(async () => {
        await request(app).delete('/testing/all-data').expect(204);

        // Create users with different creation times
        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'alice',
            password: 'password123',
            email: 'alice@example.dev',
          })
          .expect(201);

        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'bob',
            password: 'password456',
            email: 'bob@example.dev',
          })
          .expect(201);

        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'charlie',
            password: 'password789',
            email: 'charlie@example.dev',
          })
          .expect(201);
      });

      it('should use default sortBy createdAt', async () => {
        const response = await request(app)
          .get('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        expect(response.body.items.length).toBe(3);
        // Default sort should be descending (newest first)
        const dates = response.body.items.map((u: { createdAt: string }) =>
          new Date(u.createdAt).getTime(),
        );
        expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
        expect(dates[1]).toBeGreaterThanOrEqual(dates[2]);
      });

      it('should use default sortDirection desc', async () => {
        const response = await request(app)
          .get('/users?sortBy=createdAt')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        const dates = response.body.items.map((u: { createdAt: string }) =>
          new Date(u.createdAt).getTime(),
        );
        expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
        expect(dates[1]).toBeGreaterThanOrEqual(dates[2]);
      });

      it('should sort by createdAt ascending', async () => {
        const response = await request(app)
          .get('/users?sortBy=createdAt&sortDirection=asc')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        const dates = response.body.items.map((u: { createdAt: string }) =>
          new Date(u.createdAt).getTime(),
        );
        expect(dates[0]).toBeLessThanOrEqual(dates[1]);
        expect(dates[1]).toBeLessThanOrEqual(dates[2]);
      });

      it('should sort by createdAt descending', async () => {
        const response = await request(app)
          .get('/users?sortBy=createdAt&sortDirection=desc')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        const dates = response.body.items.map((u: { createdAt: string }) =>
          new Date(u.createdAt).getTime(),
        );
        expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
        expect(dates[1]).toBeGreaterThanOrEqual(dates[2]);
      });

      it('should sort by login ascending', async () => {
        const response = await request(app)
          .get('/users?sortBy=login&sortDirection=asc')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        const logins = response.body.items.map(
          (u: { login: string }) => u.login,
        );
        expect(logins).toEqual(['alice', 'bob', 'charlie']);
      });

      it('should sort by login descending', async () => {
        const response = await request(app)
          .get('/users?sortBy=login&sortDirection=desc')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        const logins = response.body.items.map(
          (u: { login: string }) => u.login,
        );
        expect(logins).toEqual(['charlie', 'bob', 'alice']);
      });

      it('should sort by email ascending', async () => {
        const response = await request(app)
          .get('/users?sortBy=email&sortDirection=asc')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        const emails = response.body.items.map(
          (u: { email: string }) => u.email,
        );
        expect(emails).toEqual([
          'alice@example.dev',
          'bob@example.dev',
          'charlie@example.dev',
        ]);
      });

      it('should sort by email descending', async () => {
        const response = await request(app)
          .get('/users?sortBy=email&sortDirection=desc')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(200);

        const emails = response.body.items.map(
          (u: { email: string }) => u.email,
        );
        expect(emails).toEqual([
          'charlie@example.dev',
          'bob@example.dev',
          'alice@example.dev',
        ]);
      });
    });
  });

  describe('POST /users', () => {
    beforeAll(async () => {
      await request(app).delete('/testing/all-data').expect(204);
    });

    it('should return 401 when unauthorized', async () => {
      await request(app).post('/users').send(testUser).expect(401);
    });

    it('should return 401 with invalid credentials', async () => {
      await request(app)
        .post('/users')
        .set('authorization', INVALID_AUTH_HEADER)
        .send(testUser)
        .expect(401);
    });

    it('should create a new user with valid data', async () => {
      const response = await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        login: testUser.login,
        email: testUser.email,
        createdAt: expect.any(String),
      });

      // Verify createdAt is valid ISO date string
      expect(new Date(response.body.createdAt).toISOString()).toBe(
        response.body.createdAt,
      );

      // Verify the user doesn't contain password
      expect(response.body.password).toBeUndefined();
    });

    describe('Validation tests', () => {
      beforeEach(async () => {
        await request(app).delete('/testing/all-data').expect(204);
      });

      it('should return 400 when login is missing', async () => {
        const response = await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
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
      });

      it('should return 400 when password is missing', async () => {
        const response = await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
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
      });

      it('should return 400 when email is missing', async () => {
        const response = await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
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
      });

      it('should return 400 when login is too short (less than 3 characters)', async () => {
        const response = await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
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
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'verylongusername',
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
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
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

      it('should accept login with valid characters (letters, numbers, underscore, hyphen)', async () => {
        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'user_123-x',
            password: 'password123',
            email: 'test@example.dev',
          })
          .expect(201);
      });

      it('should return 400 when password is too short (less than 6 characters)', async () => {
        const response = await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
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
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
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
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
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

      it('should return 400 when email has no @ symbol', async () => {
        const response = await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'testuser',
            password: 'password123',
            email: 'invalidemail.com',
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

      it('should return 400 when email has no domain', async () => {
        const response = await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'testuser',
            password: 'password123',
            email: 'invalid@',
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

      it('should return 400 when login is not unique', async () => {
        // Create first user
        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'uniqueuser',
            password: 'password123',
            email: 'user1@example.dev',
          })
          .expect(201);

        // Try to create second user with same login
        const response = await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'uniqueuser',
            password: 'password456',
            email: 'user2@example.dev',
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

      it('should return 400 when email is not unique', async () => {
        // Create first user
        await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'user1',
            password: 'password123',
            email: 'unique@example.dev',
          })
          .expect(201);

        // Try to create second user with same email
        const response = await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'user2',
            password: 'password456',
            email: 'unique@example.dev',
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

      it('should return 400 with multiple validation errors', async () => {
        const response = await request(app)
          .post('/users')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            login: 'ab',
            password: 'short',
            email: 'invalid-email',
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
    });
  });

  describe('DELETE /users/{id}', () => {
    let userIdToDelete: string;

    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      // Create a user to delete
      const createResponse = await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);

      userIdToDelete = createResponse.body.id;
    });

    it('should return 401 when unauthorized', async () => {
      await request(app).delete(`/users/${userIdToDelete}`).expect(401);
    });

    it('should return 401 with invalid credentials', async () => {
      await request(app)
        .delete(`/users/${userIdToDelete}`)
        .set('authorization', INVALID_AUTH_HEADER)
        .expect(401);
    });

    it('should delete user by id', async () => {
      await request(app)
        .delete(`/users/${userIdToDelete}`)
        .set('authorization', VALID_AUTH_HEADER)
        .expect(204);

      // Verify user is deleted by trying to find it in the list
      const getResponse = await request(app)
        .get('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .expect(200);

      expect(getResponse.body.totalCount).toBe(0);
      expect(getResponse.body.items).toEqual([]);
    });

    it('should return 404 when deleting non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';

      await request(app)
        .delete(`/users/${nonExistentId}`)
        .set('authorization', VALID_AUTH_HEADER)
        .expect(404);
    });

    it('should return 404 when user with given id does not exist', async () => {
      // Delete user first
      await request(app)
        .delete(`/users/${userIdToDelete}`)
        .set('authorization', VALID_AUTH_HEADER)
        .expect(204);

      // Try to delete again
      await request(app)
        .delete(`/users/${userIdToDelete}`)
        .set('authorization', VALID_AUTH_HEADER)
        .expect(404);
    });
  });
});
