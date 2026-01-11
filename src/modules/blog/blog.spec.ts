import express from 'express';
import request from 'supertest';
import { setupApp } from '../../setup-app';
import { BlogDTO } from './types';

describe('Blog API', () => {
  const app = express();
  setupApp(app);

  const AUTH_HEADER = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;

  const testBlog: BlogDTO = {
    name: 'Test Blog',
    description: 'This is a test blog',
    websiteUrl: 'https://testblog.com',
  };

  const updatedTestBlog: BlogDTO = {
    name: 'Updated Blog',
    description: 'This is an updated test blog',
    websiteUrl: 'https://updatedtestblog.com',
  };

  let blogId: string;

  beforeAll(async () => {
    await request(app).delete('/testing/all-data').expect(204);
  });

  describe('GET /blogs', () => {
    it('should return empty array when no blogs exist', async () => {
      const response = await request(app).get('/blogs').expect(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('POST /blogs', () => {
    it('should create a new blog', async () => {
      const response = await request(app)
        .post('/blogs')
        .set('authorization', AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      blogId = response.body.id;
      expect(blogId).toBeDefined();
      expect(response.body.name).toEqual(testBlog.name);
      expect(response.body.description).toEqual(testBlog.description);
      expect(response.body.websiteUrl).toEqual(testBlog.websiteUrl);
    });

    describe('Validation', () => {
      it('should return 400 if name is missing', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', AUTH_HEADER)
          .send({
            description: testBlog.description,
            websiteUrl: testBlog.websiteUrl,
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if name is empty string', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', AUTH_HEADER)
          .send({
            ...testBlog,
            name: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: expect.stringContaining('1 and 15'),
            }),
          ]),
        );
      });

      it('should return 400 if name is too long (> 15 characters)', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', AUTH_HEADER)
          .send({
            ...testBlog,
            name: 'This is a very long name',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: expect.stringContaining('1 and 15'),
            }),
          ]),
        );
      });

      it('should return 400 if name is not a string', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', AUTH_HEADER)
          .send({
            ...testBlog,
            name: 123,
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'name',
              message: expect.stringContaining('string'),
            }),
          ]),
        );
      });

      it('should return 400 if description is missing', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', AUTH_HEADER)
          .send({
            name: testBlog.name,
            websiteUrl: testBlog.websiteUrl,
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'description',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if description is empty string', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', AUTH_HEADER)
          .send({
            ...testBlog,
            description: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'description',
              message: expect.stringContaining('1 and 500'),
            }),
          ]),
        );
      });

      it('should return 400 if description is too long (> 500 characters)', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', AUTH_HEADER)
          .send({
            ...testBlog,
            description: 'a'.repeat(501),
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'description',
              message: expect.stringContaining('1 and 500'),
            }),
          ]),
        );
      });

      it('should return 400 if websiteUrl is missing', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', AUTH_HEADER)
          .send({
            name: testBlog.name,
            description: testBlog.description,
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'websiteUrl',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if websiteUrl is not a valid URL', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', AUTH_HEADER)
          .send({
            ...testBlog,
            websiteUrl: 'not-a-valid-url',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'websiteUrl',
              message: expect.stringContaining('valid URL'),
            }),
          ]),
        );
      });

      it('should return 400 if websiteUrl is too long (> 100 characters)', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', AUTH_HEADER)
          .send({
            ...testBlog,
            websiteUrl: 'https://' + 'a'.repeat(100) + '.com',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'websiteUrl',
              message: expect.stringContaining('1 and 100'),
            }),
          ]),
        );
      });

      it('should return 400 with multiple errors for multiple invalid fields', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', AUTH_HEADER)
          .send({
            name: '',
            description: '',
            websiteUrl: 'invalid-url',
          })
          .expect(400);

        expect(response.body.errorsMessages).toHaveLength(3);
        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'name' }),
            expect.objectContaining({ field: 'description' }),
            expect.objectContaining({ field: 'websiteUrl' }),
          ]),
        );
      });
    });
  });

  describe('GET /blogs/:id', () => {
    it('should return blog by id', async () => {
      const response = await request(app).get(`/blogs/${blogId}`).expect(200);

      expect(response.body).toEqual({
        id: blogId,
        name: testBlog.name,
        description: testBlog.description,
        websiteUrl: testBlog.websiteUrl,
      });
    });
  });

  describe('PUT /blogs/:id', () => {
    it('should update existing blog', async () => {
      await request(app)
        .put(`/blogs/${blogId}`)
        .set('authorization', AUTH_HEADER)
        .send(updatedTestBlog)
        .expect(204);

      const response = await request(app).get(`/blogs/${blogId}`).expect(200);
      expect(response.body.name).toEqual(updatedTestBlog.name);
      expect(response.body.description).toEqual(updatedTestBlog.description);
      expect(response.body.websiteUrl).toEqual(updatedTestBlog.websiteUrl);
    });

    describe('Validation', () => {
      it('should return 400 if name is too long', async () => {
        const response = await request(app)
          .put(`/blogs/${blogId}`)
          .set('authorization', AUTH_HEADER)
          .send({
            ...updatedTestBlog,
            name: 'Very long blog name',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'name' })]),
        );
      });

      it('should return 400 if websiteUrl is invalid', async () => {
        const response = await request(app)
          .put(`/blogs/${blogId}`)
          .set('authorization', AUTH_HEADER)
          .send({
            ...updatedTestBlog,
            websiteUrl: 'invalid-url',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'websiteUrl' }),
          ]),
        );
      });

      it('should return 404 if blog does not exist', async () => {
        await request(app)
          .put('/blogs/999999')
          .set('authorization', AUTH_HEADER)
          .send(updatedTestBlog)
          .expect(404);
      });
    });
  });

  describe('DELETE /blogs/:id', () => {
    it('should delete blog by id', async () => {
      await request(app)
        .delete(`/blogs/${blogId}`)
        .set('authorization', AUTH_HEADER)
        .expect(204);

      await request(app).get(`/blogs/${blogId}`).expect(404);
    });
  });
});
