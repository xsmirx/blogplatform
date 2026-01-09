import express from 'express';
import request from 'supertest';
import { setupApp } from './setup-app';

describe('GET /', () => {
  it("should return 'Hello world!'", async () => {
    const app = express();
    setupApp(app);
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.text).toBe('Hello world!');
  });
});
