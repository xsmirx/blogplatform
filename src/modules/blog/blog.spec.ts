import express from 'express';
import request from 'supertest';
import { BlogInputDTO } from './types';
import { ValidationError } from '../../core/types/validation-error';
import { databaseConnection } from '../../bd';
import { setupApp } from '../../setup-app';

describe('Blog API', () => {
  const app = express();
  setupApp(app);

  const VALID_AUTH_HEADER = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;
  const INVALID_AUTH_HEADER = `Basic ${Buffer.from('admin:wrong').toString('base64')}`;

  const testBlog: BlogInputDTO = {
    name: 'Test Blog',
    description: 'This is a test blog',
    websiteUrl: 'https://testblog.com',
  };

  const updatedTestBlog: BlogInputDTO = {
    name: 'Updated Blog',
    description: 'This is an updated test blog',
    websiteUrl: 'https://updatedtestblog.com',
  };

  let blogId: string;

  beforeAll(async () => {
    await databaseConnection.connect({
      mongoURL: 'mongodb://admin:admin@localhost:27017',
      dbName: 'blogplatform-test',
    });

    await request(app).delete('/testing/all-data').expect(204);
  });

  describe('GET /blogs', () => {
    it('should return 200 and empty array when no blogs exist', async () => {
      const response = await request(app).get('/blogs').expect(200);

      expect(response.body).toEqual([]);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 200 and array of blogs when blogs exist', async () => {
      // Create a blog first
      const createResponse = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      blogId = createResponse.body.id;

      // Get all blogs
      const response = await request(app).get('/blogs').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
            websiteUrl: expect.any(String),
            createdAt: expect.any(String),
            isMembership: expect.any(Boolean),
          }),
        ]),
      );

      // Verify createdAt is valid ISO date string
      const blog = response.body[0];
      expect(new Date(blog.createdAt).toISOString()).toBe(blog.createdAt);

      // Verify isMembership is false (as per OpenAPI spec)
      expect(blog.isMembership).toBe(false);
    });
  });

  describe('POST /blogs', () => {
    beforeAll(async () => {
      await request(app).delete('/testing/all-data').expect(204);
    });

    it('should return 201 and create a new blog with valid data', async () => {
      const response = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      blogId = response.body.id;

      // Verify response structure matches BlogViewModel from OpenAPI
      expect(response.body).toEqual({
        id: expect.any(String),
        name: testBlog.name,
        description: testBlog.description,
        websiteUrl: testBlog.websiteUrl,
        createdAt: expect.any(String),
        isMembership: expect.any(Boolean),
      });
      expect(blogId).toBeDefined();

      // Verify createdAt is valid ISO 8601 date-time format
      expect(new Date(response.body.createdAt).toISOString()).toBe(
        response.body.createdAt,
      );

      // Verify isMembership is false (as per OpenAPI spec)
      expect(response.body.isMembership).toBe(false);
    });

    it('should create blog with createdAt timestamp close to current time', async () => {
      const beforeCreate = new Date();

      const response = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      const afterCreate = new Date();
      const createdAt = new Date(response.body.createdAt);

      // Verify createdAt is between before and after timestamps (with 1 second tolerance)
      expect(createdAt.getTime()).toBeGreaterThanOrEqual(
        beforeCreate.getTime() - 1000,
      );
      expect(createdAt.getTime()).toBeLessThanOrEqual(
        afterCreate.getTime() + 1000,
      );
    });

    it('should always set isMembership to false for new blogs', async () => {
      const response = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      // As per OpenAPI spec: isMembership is always false for now
      expect(response.body.isMembership).toBe(false);
    });

    describe('Authorization tests', () => {
      it('should return 401 when authorization header is missing', async () => {
        await request(app).post('/blogs').send(testBlog).expect(401);
      });

      it('should return 401 when authorization credentials are invalid', async () => {
        await request(app)
          .post('/blogs')
          .set('authorization', INVALID_AUTH_HEADER)
          .send(testBlog)
          .expect(401);
      });

      it('should return 401 when authorization header has wrong format', async () => {
        await request(app)
          .post('/blogs')
          .set('authorization', 'Bearer sometoken')
          .send(testBlog)
          .expect(401);
      });
    });

    describe('Validation - name field', () => {
      it('should return 400 if name is missing', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
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
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            name: '',
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

      it('should return 400 if name is only whitespace', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            name: '   ',
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

      it('should return 400 if name exceeds maxLength of 15 characters', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            name: 'a'.repeat(16),
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

      it('should return 201 if name is exactly 15 characters', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            name: 'a'.repeat(15),
          })
          .expect(201);

        // Verify new fields are present
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('isMembership');
      });

      it('should return 400 if name is not a string', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            name: 123,
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
    });

    describe('Validation - description field', () => {
      it('should return 400 if description is missing', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
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
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            description: '',
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

      it('should return 400 if description is only whitespace', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            description: '   ',
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

      it('should return 400 if description exceeds maxLength of 500 characters', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            description: 'a'.repeat(501),
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

      it('should return 201 if description is exactly 500 characters', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            description: 'a'.repeat(500),
          })
          .expect(201);

        // Verify new fields are present
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('isMembership');
      });

      it('should return 400 if description is not a string', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            description: 12345,
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
    });

    describe('Validation - websiteUrl field', () => {
      it('should return 400 if websiteUrl is missing', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
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

      it('should return 400 if websiteUrl is empty string', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            websiteUrl: '',
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

      it('should return 400 if websiteUrl does not match pattern (not https)', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            websiteUrl: 'http://example.com',
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

      it('should return 400 if websiteUrl does not match pattern (invalid format)', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            websiteUrl: 'not-a-valid-url',
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

      it('should return 400 if websiteUrl exceeds maxLength of 100 characters', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            websiteUrl: 'https://' + 'a'.repeat(95) + '.com',
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

      it('should return 201 if websiteUrl is valid with path', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            websiteUrl: 'https://example.com/path/to/blog',
          })
          .expect(201);

        // Verify new fields are present
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('isMembership');
      });

      it('should return 201 if websiteUrl is valid with subdomain', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            websiteUrl: 'https://blog.example.com',
          })
          .expect(201);

        // Verify new fields are present
        expect(response.body).toHaveProperty('createdAt');
        expect(response.body).toHaveProperty('isMembership');
      });

      it('should return 400 if websiteUrl is not a string', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testBlog,
            websiteUrl: 12345,
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
    });

    describe('Validation - multiple fields', () => {
      it('should return 400 with multiple errors for multiple invalid fields', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
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

      it('should return 400 with correct error structure (APIErrorResult)', async () => {
        const response = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            name: '',
            description: testBlog.description,
            websiteUrl: testBlog.websiteUrl,
          })
          .expect(400);

        // Verify APIErrorResult structure
        expect(response.body).toHaveProperty('errorsMessages');
        expect(Array.isArray(response.body.errorsMessages)).toBe(true);

        // Verify FieldError structure
        response.body.errorsMessages.forEach((error: ValidationError) => {
          expect(error).toHaveProperty('message');
          expect(error).toHaveProperty('field');
          expect(typeof error.message).toBe('string');
          expect(typeof error.field).toBe('string');
        });
      });
    });
  });

  describe('GET /blogs/:id', () => {
    beforeAll(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      const createResponse = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      blogId = createResponse.body.id;
    });

    it('should return 200 and blog by id', async () => {
      const response = await request(app).get(`/blogs/${blogId}`).expect(200);

      // Verify response matches BlogViewModel from OpenAPI
      expect(response.body).toEqual({
        id: blogId,
        name: testBlog.name,
        description: testBlog.description,
        websiteUrl: testBlog.websiteUrl,
        createdAt: expect.any(String),
        isMembership: expect.any(Boolean),
      });

      // Verify all required fields are present
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('websiteUrl');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('isMembership');

      // Verify createdAt is valid ISO 8601 date-time format
      expect(new Date(response.body.createdAt).toISOString()).toBe(
        response.body.createdAt,
      );

      // Verify isMembership is false (as per OpenAPI spec)
      expect(response.body.isMembership).toBe(false);
    });

    it('should return 404 if blog does not exist', async () => {
      await request(app).get('/blogs/507f1f77bcf86cd799439011').expect(404);
    });

    it('should return 404 for non-existent blog with valid id format', async () => {
      await request(app).get('/blogs/000000000000000000000001').expect(404);
    });
  });

  describe('PUT /blogs/:id', () => {
    beforeAll(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      const createResponse = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      blogId = createResponse.body.id;
    });

    it('should return 204 and update existing blog', async () => {
      // Get original createdAt value
      const originalBlog = await request(app)
        .get(`/blogs/${blogId}`)
        .expect(200);
      const originalCreatedAt = originalBlog.body.createdAt;

      await request(app)
        .put(`/blogs/${blogId}`)
        .set('authorization', VALID_AUTH_HEADER)
        .send(updatedTestBlog)
        .expect(204);

      // Verify the blog was updated
      const response = await request(app).get(`/blogs/${blogId}`).expect(200);
      expect(response.body.name).toEqual(updatedTestBlog.name);
      expect(response.body.description).toEqual(updatedTestBlog.description);
      expect(response.body.websiteUrl).toEqual(updatedTestBlog.websiteUrl);

      // Verify new fields are still present after update
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('isMembership');
      expect(response.body.isMembership).toBe(false);

      // Verify createdAt doesn't change after update
      expect(response.body.createdAt).toBe(originalCreatedAt);
    });

    describe('Authorization tests', () => {
      it('should return 401 when authorization header is missing', async () => {
        await request(app)
          .put(`/blogs/${blogId}`)
          .send(updatedTestBlog)
          .expect(401);
      });

      it('should return 401 when authorization credentials are invalid', async () => {
        await request(app)
          .put(`/blogs/${blogId}`)
          .set('authorization', INVALID_AUTH_HEADER)
          .send(updatedTestBlog)
          .expect(401);
      });
    });

    describe('Validation', () => {
      it('should return 400 if name is empty', async () => {
        const response = await request(app)
          .put(`/blogs/${blogId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...updatedTestBlog,
            name: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'name' })]),
        );
      });

      it('should return 400 if name exceeds 15 characters', async () => {
        const response = await request(app)
          .put(`/blogs/${blogId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...updatedTestBlog,
            name: 'a'.repeat(16),
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'name' })]),
        );
      });

      it('should return 400 if description is empty', async () => {
        const response = await request(app)
          .put(`/blogs/${blogId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...updatedTestBlog,
            description: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'description' }),
          ]),
        );
      });

      it('should return 400 if description exceeds 500 characters', async () => {
        const response = await request(app)
          .put(`/blogs/${blogId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...updatedTestBlog,
            description: 'a'.repeat(501),
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'description' }),
          ]),
        );
      });

      it('should return 400 if websiteUrl is invalid', async () => {
        const response = await request(app)
          .put(`/blogs/${blogId}`)
          .set('authorization', VALID_AUTH_HEADER)
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

      it('should return 400 if websiteUrl does not use https', async () => {
        const response = await request(app)
          .put(`/blogs/${blogId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...updatedTestBlog,
            websiteUrl: 'http://example.com',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'websiteUrl' }),
          ]),
        );
      });

      it('should return 400 if websiteUrl exceeds 100 characters', async () => {
        const response = await request(app)
          .put(`/blogs/${blogId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...updatedTestBlog,
            websiteUrl: 'https://' + 'a'.repeat(95) + '.com',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'websiteUrl' }),
          ]),
        );
      });

      it('should return 400 with multiple errors for multiple invalid fields', async () => {
        const response = await request(app)
          .put(`/blogs/${blogId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            name: 'a'.repeat(16),
            description: '',
            websiteUrl: 'not-valid',
          })
          .expect(400);

        expect(response.body.errorsMessages.length).toBeGreaterThanOrEqual(3);
      });
    });

    describe('Not found tests', () => {
      it('should return 404 if blog does not exist', async () => {
        await request(app)
          .put('/blogs/507f1f77bcf86cd799439011')
          .set('authorization', VALID_AUTH_HEADER)
          .send(updatedTestBlog)
          .expect(404);
      });

      it('should return 404 for non-existent blog with valid id format', async () => {
        await request(app)
          .put('/blogs/000000000000000000000001')
          .set('authorization', VALID_AUTH_HEADER)
          .send(updatedTestBlog)
          .expect(404);
      });
    });
  });

  describe('DELETE /blogs/:id', () => {
    let blogToDeleteId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      blogToDeleteId = createResponse.body.id;
    });

    it('should return 204 and delete blog by id', async () => {
      await request(app)
        .delete(`/blogs/${blogToDeleteId}`)
        .set('authorization', VALID_AUTH_HEADER)
        .expect(204);

      // Verify the blog was deleted
      await request(app).get(`/blogs/${blogToDeleteId}`).expect(404);
    });

    describe('Authorization tests', () => {
      it('should return 401 when authorization header is missing', async () => {
        await request(app).delete(`/blogs/${blogToDeleteId}`).expect(401);

        // Verify blog was not deleted
        await request(app).get(`/blogs/${blogToDeleteId}`).expect(200);
      });

      it('should return 401 when authorization credentials are invalid', async () => {
        await request(app)
          .delete(`/blogs/${blogToDeleteId}`)
          .set('authorization', INVALID_AUTH_HEADER)
          .expect(401);

        // Verify blog was not deleted
        await request(app).get(`/blogs/${blogToDeleteId}`).expect(200);
      });
    });

    describe('Not found tests', () => {
      it('should return 404 if blog does not exist', async () => {
        await request(app)
          .delete('/blogs/507f1f77bcf86cd799439011')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(404);
      });

      it('should return 404 for non-existent blog with valid id format', async () => {
        await request(app)
          .delete('/blogs/000000000000000000000001')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(404);
      });

      it('should return 404 when trying to delete already deleted blog', async () => {
        await request(app)
          .delete(`/blogs/${blogToDeleteId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .expect(204);

        await request(app)
          .delete(`/blogs/${blogToDeleteId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .expect(404);
      });
    });
  });
});
