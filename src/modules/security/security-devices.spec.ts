import request from 'supertest';
import {
  createTestApp,
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

describe('Security Devices API', () => {
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

  describe('GET /security/devices', () => {
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

    it('should return 200 and array of devices when valid refreshToken is provided', async () => {
      const response = await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should return DeviceViewModel with required fields', async () => {
      const response = await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const device = response.body[0];
      expect(device).toHaveProperty('deviceId');
      expect(device).toHaveProperty('ip');
      expect(device).toHaveProperty('title');
      expect(device).toHaveProperty('lastActiveDate');

      expect(typeof device.deviceId).toBe('string');
      expect(typeof device.ip).toBe('string');
      expect(typeof device.title).toBe('string');
      expect(typeof device.lastActiveDate).toBe('string');
    });

    it('should return device with valid ISO 8601 date format for lastActiveDate', async () => {
      const response = await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(200);

      const device = response.body[0];
      expect(device.lastActiveDate).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/,
      );
    });

    it('should return 401 when no refreshToken is provided', async () => {
      await request(app).get('/security/devices').expect(401);
    });

    it('should return 401 when refreshToken is invalid', async () => {
      await request(app)
        .get('/security/devices')
        .set('Cookie', 'refreshToken=invalid.token.value')
        .expect(401);
    });

    it('should return 401 when refreshToken is revoked', async () => {
      // Logout to revoke the token
      await request(app)
        .post('/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(204);

      // Try to get devices with revoked token
      await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken}`)
        .expect(401);
    });

    it('should return 401 when refreshToken is empty', async () => {
      await request(app)
        .get('/security/devices')
        .set('Cookie', 'refreshToken=')
        .expect(401);
    });

    describe('Multiple devices tests', () => {
      it('should show multiple devices after multiple logins', async () => {
        // Login from different clients (multiple login calls)
        const login1 = await request(app)
          .post('/auth/login')
          .set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const login2 = await request(app)
          .post('/auth/login')
          .set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6)')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const refreshToken1 = extractRefreshToken(login1)!;
        const refreshToken2 = extractRefreshToken(login2)!;

        // Get devices
        const devicesResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken1}`)
          .expect(200);

        expect(devicesResponse.body.length).toBeGreaterThanOrEqual(2);
      });

      it('should show correct number of devices (including old device from beforeEach)', async () => {
        // Login once more
        const login2 = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        // We should have 2 devices now (one from beforeEach, one from this login)
        const devicesResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        expect(devicesResponse.body.length).toBe(2);
      });
    });

    describe('Device title parsing from User-Agent', () => {
      it('should extract device title from Chrome User-Agent', async () => {
        const userAgent =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

        const loginResponse = await request(app)
          .post('/auth/login')
          .set('User-Agent', userAgent)
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const newRefreshToken = extractRefreshToken(loginResponse)!;

        const devicesResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${newRefreshToken}`)
          .expect(200);

        const device = devicesResponse.body.find(
          (d: any) => d.deviceId !== undefined,
        );
        expect(device.title).toBeTruthy();
        expect(typeof device.title).toBe('string');
      });

      it('should extract device title from Safari User-Agent', async () => {
        const userAgent =
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15';

        const loginResponse = await request(app)
          .post('/auth/login')
          .set('User-Agent', userAgent)
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const newRefreshToken = extractRefreshToken(loginResponse)!;

        const devicesResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${newRefreshToken}`)
          .expect(200);

        const device = devicesResponse.body.find(
          (d: any) => d.deviceId !== undefined,
        );
        expect(device.title).toBeTruthy();
      });

      it('should extract device title from mobile User-Agent', async () => {
        const userAgent =
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1';

        const loginResponse = await request(app)
          .post('/auth/login')
          .set('User-Agent', userAgent)
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const newRefreshToken = extractRefreshToken(loginResponse)!;

        const devicesResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${newRefreshToken}`)
          .expect(200);

        const device = devicesResponse.body.find(
          (d: any) => d.deviceId !== undefined,
        );
        expect(device.title).toBeTruthy();
      });

      it('should provide default title when User-Agent is not provided', async () => {
        const loginResponse = await request(app)
          .post('/auth/login')
          .send({
            loginOrEmail: testUser.login,
            password: testUser.password,
          })
          .expect(200);

        const newRefreshToken = extractRefreshToken(loginResponse)!;

        const devicesResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${newRefreshToken}`)
          .expect(200);

        const devices = devicesResponse.body;
        expect(devices.length).toBeGreaterThan(0);
        devices.forEach((device: any) => {
          expect(device.title).toBeTruthy();
        });
      });
    });

    describe('IP address tracking', () => {
      it('should capture IP address of login request', async () => {
        const devicesResponse = await request(app)
          .get('/security/devices')
          .set('Cookie', `refreshToken=${refreshToken}`)
          .expect(200);

        const device = devicesResponse.body[0];
        expect(device.ip).toBeTruthy();
        expect(typeof device.ip).toBe('string');
      });
    });
  });

  describe('DELETE /security/devices', () => {
    let refreshToken1: string;
    let refreshToken2: string;
    let refreshToken3: string;

    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);

      // Create 3 sessions
      const login1 = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(200);
      refreshToken1 = extractRefreshToken(login1)!;

      const login2 = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(200);
      refreshToken2 = extractRefreshToken(login2)!;

      const login3 = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(200);
      refreshToken3 = extractRefreshToken(login3)!;
    });

    it('should return 204 when logout from all other sessions', async () => {
      await request(app)
        .delete('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(204);
    });

    it('should terminate all other sessions except current', async () => {
      // Get initial device count
      const devicesBeforeResponse = await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(200);

      const initialCount = devicesBeforeResponse.body.length;
      expect(initialCount).toBe(3);

      // Logout from all other sessions
      await request(app)
        .delete('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(204);

      // Get devices after logout
      const devicesAfterResponse = await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(200);

      expect(devicesAfterResponse.body.length).toBe(1);
    });

    it('should keep current session active after logout from all others', async () => {
      await request(app)
        .delete('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(204);

      // Current session should still be able to get devices
      const devicesResponse = await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(200);

      expect(devicesResponse.body.length).toBe(1);
    });

    it('should revoke other sessions refresh tokens', async () => {
      await request(app)
        .delete('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(204);

      // Other sessions should not be able to refresh
      await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken2}`)
        .expect(401);

      await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken3}`)
        .expect(401);
    });

    it('should allow current session to continue refreshing', async () => {
      await request(app)
        .delete('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(204);

      // Current session should still be able to refresh
      await request(app)
        .post('/auth/refresh-token')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(200);
    });

    it('should return 401 when no refreshToken is provided', async () => {
      await request(app).delete('/security/devices').expect(401);
    });

    it('should return 401 when refreshToken is invalid', async () => {
      await request(app)
        .delete('/security/devices')
        .set('Cookie', 'refreshToken=invalid.token.value')
        .expect(401);
    });

    it('should return 401 when refreshToken is revoked', async () => {
      // Logout the first session
      await request(app)
        .post('/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(204);

      // Try to logout all sessions with revoked token
      await request(app)
        .delete('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(401);
    });
  });

  describe('DELETE /security/devices/{deviceId}', () => {
    let refreshToken1: string;
    let refreshToken2: string;
    let deviceId2: string;

    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);

      const login1 = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(200);
      refreshToken1 = extractRefreshToken(login1)!;

      const login2 = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser.login,
          password: testUser.password,
        })
        .expect(200);
      refreshToken2 = extractRefreshToken(login2)!;

      // Get deviceId of second device
      const devicesResponse = await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken2}`)
        .expect(200);

      deviceId2 = devicesResponse.body.find(
        (d: any) =>
          devicesResponse.body.indexOf(d) ===
          devicesResponse.body.length - 1,
      )?.deviceId;
    });

    it('should return 204 when terminate specific device session', async () => {
      await request(app)
        .delete(`/security/devices/${deviceId2}`)
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(204);
    });

    it('should revoke the specific device session', async () => {
      await request(app)
        .delete(`/security/devices/${deviceId2}`)
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(204);

      // Terminated session should not be able to get devices
      await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken2}`)
        .expect(401);
    });

    it('should not affect other sessions', async () => {
      await request(app)
        .delete(`/security/devices/${deviceId2}`)
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(204);

      // Current session should still work
      const devicesResponse = await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(200);

      expect(devicesResponse.body.length).toBeGreaterThan(0);
    });

    it('should return 401 when no refreshToken is provided', async () => {
      await request(app)
        .delete(`/security/devices/${deviceId2}`)
        .expect(401);
    });

    it('should return 401 when refreshToken is invalid', async () => {
      await request(app)
        .delete(`/security/devices/${deviceId2}`)
        .set('Cookie', 'refreshToken=invalid.token.value')
        .expect(401);
    });

    it('should return 403 when trying to delete another users device', async () => {
      // Create another user
      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser2)
        .expect(201);

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({
          loginOrEmail: testUser2.login,
          password: testUser2.password,
        })
        .expect(200);

      const otherUserRefreshToken = extractRefreshToken(loginResponse)!;

      // Try to delete first user's device with second user's token
      await request(app)
        .delete(`/security/devices/${deviceId2}`)
        .set('Cookie', `refreshToken=${otherUserRefreshToken}`)
        .expect(403);
    });

    it('should return 404 when device does not exist', async () => {
      const fakeDeviceId = 'nonexistent-device-id-12345';

      await request(app)
        .delete(`/security/devices/${fakeDeviceId}`)
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(404);
    });

    it('should return 404 when trying to delete already deleted device', async () => {
      // Delete the device once
      await request(app)
        .delete(`/security/devices/${deviceId2}`)
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(204);

      // Try to delete again
      await request(app)
        .delete(`/security/devices/${deviceId2}`)
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(404);
    });

    it('should allow user to delete their own device', async () => {
      // Get deviceId of first device
      const devicesResponse = await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(200);

      const deviceId1 = devicesResponse.body.find(
        (d: any) =>
          devicesResponse.body.indexOf(d) ===
          devicesResponse.body.length - 1,
      )?.deviceId;

      // Delete own device
      await request(app)
        .delete(`/security/devices/${deviceId1}`)
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(204);

      // That session should be revoked
      await request(app)
        .get('/security/devices')
        .set('Cookie', `refreshToken=${refreshToken1}`)
        .expect(401);
    });
  });
});
