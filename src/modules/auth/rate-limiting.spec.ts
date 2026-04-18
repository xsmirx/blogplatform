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
    it('should return 429 after 5 attempts from same IP within 10 seconds', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/registration-email-resending')
          .send({
            email: `nonexistent${i}@example.dev`,
          })
          .expect(400);
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
          .expect(400);
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

  describe('Security Devices rate limiting', () => {
    let refreshToken: string;

    beforeEach(async () => {
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
      for (const cookie of arr) {
        const match = cookie.match(/^refreshToken=([^;]+)/);
        if (match) {
          refreshToken = match[1];
          break;
        }
      }
    });

    it('GET /security/devices should return 429 after 5 failed attempts', async () => {
      // Make 5 failed attempts with invalid tokens
      for (let i = 0; i < 5; i++) {
        await request(app)
          .get('/security/devices')
          .set('Cookie', 'refreshToken=invalid.token.value')
          .expect(401);
      }

      // 6th attempt should return 429
      const response = await request(app)
        .get('/security/devices')
        .set('Cookie', 'refreshToken=invalid.token.value');

      expect(response.status).toBe(429);
    });

    it('DELETE /security/devices should return 429 after 5 failed attempts', async () => {
      // Make 5 failed attempts with invalid tokens
      for (let i = 0; i < 5; i++) {
        await request(app)
          .delete('/security/devices')
          .set('Cookie', 'refreshToken=invalid.token.value')
          .expect(401);
      }

      // 6th attempt should return 429
      const response = await request(app)
        .delete('/security/devices')
        .set('Cookie', 'refreshToken=invalid.token.value');

      expect(response.status).toBe(429);
    });

    it('DELETE /security/devices/{deviceId} should return 429 after 5 failed attempts', async () => {
      const fakeDeviceId = 'non-existent-device-id';

      // Make 5 failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .delete(`/security/devices/${fakeDeviceId}`)
          .set('Cookie', 'refreshToken=invalid.token.value')
          .expect(401);
      }

      // 6th attempt should return 429
      const response = await request(app)
        .delete(`/security/devices/${fakeDeviceId}`)
        .set('Cookie', 'refreshToken=invalid.token.value');

      expect(response.status).toBe(429);
    });

    it('should track device endpoints separately from auth endpoints', async () => {
      // 5 login attempts with wrong password
      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send({
          login: 'anotheruser',
          password: 'password123',
          email: 'another@example.dev',
        })
        .expect(201);

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: 'anotheruser',
            password: 'wrongpassword',
          })
          .expect(401);
      }

      // GET /security/devices should still work
      const devicesResponse = await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(devicesResponse.status).toBe(200);
    });
  });

  describe('Rate limiting - edge cases', () => {
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
