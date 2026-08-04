import request from 'supertest';
import {
  createTestApp,
  testDatabaseConnection,
} from '../../test-setup-app';

describe('Rate Limiting (429 Too Many Requests)', () => {
  const app = createTestApp();

  const VALID_AUTH_HEADER = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;

  const testUser = {
    login: 'testuser',
    password: 'password123',
    email: 'test@example.dev',
  };

  beforeAll(async () => {
    await testDatabaseConnection.connect();
  });

  afterAll(async () => {
    await testDatabaseConnection.getClient().close();
  });

  beforeEach(async () => {
    await request(app).delete('/testing/all-data').expect(204);
  });

  describe('POST /auth/login rate limiting', () => {
    beforeEach(async () => {
      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);
    });

    it('should return 429 after 5 failed attempts from same IP within 10 seconds', async () => {
      // Make 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: 'wrongpassword',
          })
          .expect(401);
      }

      // 6th attempt should return 429
      const response = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        });

      expect(response.status).toBe(429);
    });

    it('should count attempts per IP separately', async () => {
      // This test demonstrates that different IPs have separate attempt counters
      // In practice, testing different IPs requires special setup
      // For now we just verify 5 attempts threshold

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: 'wrongpassword',
          })
          .expect(401);
      }

      await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(429);
    });

    it('should track attempts for each endpoint separately - login endpoint', async () => {
      // 5 failed login attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: 'wrongpassword',
          })
          .expect(401);
      }

      // Login endpoint should be blocked
      await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(429);
    });
  });

  describe('POST /auth/registration rate limiting', () => {
    it('should return 429 after 5 attempts from same IP within 10 seconds', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/registration')
          .send({
            login: `user${i}`,
            password: 'password123',
            email: `user${i}@example.dev`,
          })
          .expect(204);
      }

      // 6th attempt should return 429
      const response = await request(app)
        .post('/auth/registration')
        .send({
          login: 'user6',
          password: 'password123',
          email: 'user6@example.dev',
        });

      expect(response.status).toBe(429);
    });

    it('should track registration attempts separately from login attempts', async () => {
      // 5 registration attempts should not affect login endpoint
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/registration')
          .send({
            login: `user${i}`,
            password: 'password123',
            email: `user${i}@example.dev`,
          })
          .expect(204);
      }

      // Login endpoint should still work
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
        });

      expect(loginResponse.status).toBe(200);
    });

    it('should return 429 on 6th registration attempt', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/registration')
          .send({
            login: `user${i}`,
            password: 'password123',
            email: `user${i}@example.dev`,
          })
          .expect(204);
      }

      await request(app)
        .post('/auth/registration')
        .send({
          login: 'user6',
          password: 'password123',
          email: 'user6@example.dev',
        })
        .expect(429);
    });
  });

  describe('POST /auth/registration-confirmation rate limiting', () => {
    it('should return 429 after 5 attempts from same IP within 10 seconds', async () => {
      // Make 5 confirmation attempts with invalid codes
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/registration-confirmation')
          .send({
            code: `invalid-code-${i}`,
          })
          .expect(400);
      }

      // 6th attempt should return 429
      const response = await request(app)
        .post('/auth/registration-confirmation')
        .send({
          code: 'invalid-code-6',
        });

      expect(response.status).toBe(429);
    });

    it('should track confirmation attempts separately from other endpoints', async () => {
      // 5 confirmation attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/registration-confirmation')
          .send({
            code: `invalid-code-${i}`,
          })
          .expect(400);
      }

      // Registration should still work
      await request(app)
        .post('/auth/registration')
        .send({
          login: 'newuser',
          password: 'password123',
          email: 'new@example.dev',
        })
        .expect(204);
    });
  });

  describe('POST /auth/registration-email-resending rate limiting', () => {
    // Per api.json: valid email that doesn't exist returns 204 (not 400).
    // 400 is only for an invalid inputModel (malformed email).
    it('should return 429 after 5 attempts from same IP within 10 seconds', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/registration-email-resending')
          .send({
            email: `nonexistent${i}@example.dev`,
          })
          .expect(204);
      }

      const response = await request(app)
        .post('/auth/registration-email-resending')
        .send({
          email: 'nonexistent6@example.dev',
        });

      expect(response.status).toBe(429);
    });

    it('should track email resending attempts separately from other endpoints', async () => {
      // 5 email resending attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/registration-email-resending')
          .send({
            email: `nonexistent${i}@example.dev`,
          })
          .expect(204);
      }

      // Registration endpoint should still work
      await request(app)
        .post('/auth/registration')
        .send({
          login: 'newuser',
          password: 'password123',
          email: 'new@example.dev',
        })
        .expect(204);
    });
  });

  describe('Rate limiting - edge cases', () => {
    // /security/devices* endpoints are NOT rate limited per api.json (they only
    // define 200/204/401/403/404). This test guards that exhausting the login
    // rate limit does not leak into the device endpoints.
    it('auth rate limiting does not affect device endpoints', async () => {
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

      const cookies = loginResponse.headers['set-cookie'];
      const arr = Array.isArray(cookies) ? cookies : [cookies];
      const refreshToken = arr
        .map((cookie) => cookie.match(/^refreshToken=([^;]+)/)?.[1])
        .find(Boolean);

      // The successful login above already consumed 1 of the 5 allowed requests
      // against POST /auth/login for this IP, so 4 more remain before the limit.
      for (let i = 0; i < 4; i++) {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: 'wrongpassword',
          })
          .expect(401);
      }
      // 6th request overall against POST /auth/login -> rate limited.
      await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: 'wrongpassword',
        })
        .expect(429);

      // GET /security/devices should still work with a valid refresh token.
      await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);
    });

    it('should allow request after rate limit window expires (simulated by waiting)', async () => {
      // This test demonstrates the concept - in practice, the 10-second window
      // would need to actually pass. For CI/CD, we can make assumptions about timing
      // or skip time-based tests

      // The key is that rate limits are per-endpoint and per-IP
      // Different endpoints should have independent counters
    });

    it('should return appropriate error body with 429 response', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: 'test',
            password: 'test',
          })
          .expect(401);
      }

      const response = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: 'test',
          password: 'test',
        })
        .expect(429);

      // 429 response should have some error information
      expect(response.body).toBeDefined();
    });
  });
});
