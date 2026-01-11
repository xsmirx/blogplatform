import express from 'express';
import request from 'supertest';
import { setupApp } from '../../setup-app';
import { PostDTO } from './types';
import { BlogDTO } from '../blog/types';
import { ValidationError } from '../../core/types/validation-error';

describe('Post API', () => {
  const app = express();
  setupApp(app);

  const VALID_AUTH_HEADER = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;
  const INVALID_AUTH_HEADER = `Basic ${Buffer.from('admin:wrong').toString('base64')}`;

  const testBlog: BlogDTO = {
    name: 'Test Blog',
    description: 'This is a test blog',
    websiteUrl: 'https://testblog.com',
  };

  const testPost: PostDTO = {
    title: 'Test Post',
    shortDescription: 'This is a test post',
    content: 'This is the content of the test post',
    blogId: '',
  };

  const updatedTestPost: PostDTO = {
    title: 'Updated Post',
    shortDescription: 'This is an updated test post',
    content: 'This is the updated content of the test post',
    blogId: '',
  };

  let blogId: string;
  let postId: string;

  beforeAll(async () => {
    await request(app).delete('/testing/all-data').expect(204);

    // Create a blog first to use in post tests
    const blogResponse = await request(app)
      .post('/blogs')
      .set('authorization', VALID_AUTH_HEADER)
      .send(testBlog)
      .expect(201);

    blogId = blogResponse.body.id;
    testPost.blogId = blogId;
    updatedTestPost.blogId = blogId;
  });

  describe('GET /posts', () => {
    it('should return 200 and empty array when no posts exist', async () => {
      const response = await request(app).get('/posts').expect(200);

      expect(response.body).toEqual([]);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return 200 and array of posts when posts exist', async () => {
      // Create a post first
      const createResponse = await request(app)
        .post('/posts')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testPost)
        .expect(201);

      postId = createResponse.body.id;

      // Get all posts
      const response = await request(app).get('/posts').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
            shortDescription: expect.any(String),
            content: expect.any(String),
            blogId: expect.any(String),
            blogName: expect.any(String),
          }),
        ]),
      );
    });
  });

  describe('POST /posts', () => {
    beforeAll(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      // Recreate blog
      const blogResponse = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      blogId = blogResponse.body.id;
      testPost.blogId = blogId;
      updatedTestPost.blogId = blogId;
    });

    it('should return 201 and create a new post with valid data', async () => {
      const response = await request(app)
        .post('/posts')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testPost)
        .expect(201);

      postId = response.body.id;

      // Verify response structure matches PostViewModel from OpenAPI
      expect(response.body).toEqual({
        id: expect.any(String),
        title: testPost.title,
        shortDescription: testPost.shortDescription,
        content: testPost.content,
        blogId: testPost.blogId,
        blogName: testBlog.name,
      });
      expect(postId).toBeDefined();

      // Verify blogName is included in response
      expect(response.body.blogName).toEqual(testBlog.name);
    });

    describe('Authorization tests', () => {
      it('should return 401 when authorization header is missing', async () => {
        await request(app).post('/posts').send(testPost).expect(401);
      });

      it('should return 401 when authorization credentials are invalid', async () => {
        await request(app)
          .post('/posts')
          .set('authorization', INVALID_AUTH_HEADER)
          .send(testPost)
          .expect(401);
      });

      it('should return 401 when authorization header has wrong format', async () => {
        await request(app)
          .post('/posts')
          .set('authorization', 'Bearer sometoken')
          .send(testPost)
          .expect(401);
      });
    });

    describe('Validation - title field', () => {
      it('should return 400 if title is missing', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            shortDescription: testPost.shortDescription,
            content: testPost.content,
            blogId: testPost.blogId,
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if title is empty string', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            title: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if title is only whitespace', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            title: '   ',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if title exceeds maxLength of 30 characters', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            title: 'a'.repeat(31),
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 201 if title is exactly 30 characters', async () => {
        await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            title: 'a'.repeat(30),
          })
          .expect(201);
      });

      it('should return 400 if title is not a string', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            title: 123,
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              message: expect.any(String),
            }),
          ]),
        );
      });
    });

    describe('Validation - shortDescription field', () => {
      it('should return 400 if shortDescription is missing', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            title: testPost.title,
            content: testPost.content,
            blogId: testPost.blogId,
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'shortDescription',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if shortDescription is empty string', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            shortDescription: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'shortDescription',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if shortDescription is only whitespace', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            shortDescription: '   ',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'shortDescription',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if shortDescription exceeds maxLength of 100 characters', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            shortDescription: 'a'.repeat(101),
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'shortDescription',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 201 if shortDescription is exactly 100 characters', async () => {
        await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            shortDescription: 'a'.repeat(100),
          })
          .expect(201);
      });

      it('should return 400 if shortDescription is not a string', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            shortDescription: 12345,
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'shortDescription',
              message: expect.any(String),
            }),
          ]),
        );
      });
    });

    describe('Validation - content field', () => {
      it('should return 400 if content is missing', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            title: testPost.title,
            shortDescription: testPost.shortDescription,
            blogId: testPost.blogId,
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'content',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if content is empty string', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            content: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'content',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if content is only whitespace', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            content: '   ',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'content',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if content exceeds maxLength of 1000 characters', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            content: 'a'.repeat(1001),
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'content',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 201 if content is exactly 1000 characters', async () => {
        await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            content: 'a'.repeat(1000),
          })
          .expect(201);
      });

      it('should return 400 if content is not a string', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            content: 12345,
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'content',
              message: expect.any(String),
            }),
          ]),
        );
      });
    });

    describe('Validation - blogId field', () => {
      it('should return 400 if blogId is missing', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            title: testPost.title,
            shortDescription: testPost.shortDescription,
            content: testPost.content,
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'blogId',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if blogId is empty string', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            blogId: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'blogId',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if blogId is only whitespace', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            blogId: '   ',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'blogId',
              message: expect.any(String),
            }),
          ]),
        );
      });

      it('should return 400 if blogId is not a string', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            blogId: 12345,
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'blogId',
              message: expect.any(String),
            }),
          ]),
        );
      });
    });

    describe('Validation - multiple fields', () => {
      it('should return 400 with multiple errors for multiple invalid fields', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            title: '',
            shortDescription: '',
            content: '',
            blogId: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toHaveLength(4);
        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'title' }),
            expect.objectContaining({ field: 'shortDescription' }),
            expect.objectContaining({ field: 'content' }),
            expect.objectContaining({ field: 'blogId' }),
          ]),
        );
      });

      it('should return 400 with correct error structure (APIErrorResult)', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            title: '',
            shortDescription: testPost.shortDescription,
            content: testPost.content,
            blogId: testPost.blogId,
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

  describe('GET /posts/:id', () => {
    beforeAll(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      // Recreate blog and post
      const blogResponse = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      blogId = blogResponse.body.id;
      testPost.blogId = blogId;

      const postResponse = await request(app)
        .post('/posts')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testPost)
        .expect(201);

      postId = postResponse.body.id;
    });

    it('should return 200 and post by id', async () => {
      const response = await request(app).get(`/posts/${postId}`).expect(200);

      // Verify response matches PostViewModel from OpenAPI
      expect(response.body).toEqual({
        id: postId,
        title: testPost.title,
        shortDescription: testPost.shortDescription,
        content: testPost.content,
        blogId: testPost.blogId,
        blogName: testBlog.name,
      });

      // Verify all required fields are present
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('shortDescription');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('blogId');
      expect(response.body).toHaveProperty('blogName');
    });

    it('should return 404 if post does not exist', async () => {
      await request(app).get('/posts/999999').expect(404);
    });

    it('should return 404 for non-existent post with valid id format', async () => {
      await request(app).get('/posts/000000000000000000000000').expect(404);
    });
  });

  describe('PUT /posts/:id', () => {
    beforeAll(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      // Recreate blog and post
      const blogResponse = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      blogId = blogResponse.body.id;
      testPost.blogId = blogId;
      updatedTestPost.blogId = blogId;

      const postResponse = await request(app)
        .post('/posts')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testPost)
        .expect(201);

      postId = postResponse.body.id;
    });

    it('should return 204 and update existing post', async () => {
      await request(app)
        .put(`/posts/${postId}`)
        .set('authorization', VALID_AUTH_HEADER)
        .send(updatedTestPost)
        .expect(204);

      // Verify the post was updated
      const response = await request(app).get(`/posts/${postId}`).expect(200);
      expect(response.body.title).toEqual(updatedTestPost.title);
      expect(response.body.shortDescription).toEqual(
        updatedTestPost.shortDescription,
      );
      expect(response.body.content).toEqual(updatedTestPost.content);
      expect(response.body.blogId).toEqual(updatedTestPost.blogId);
    });

    describe('Authorization tests', () => {
      it('should return 401 when authorization header is missing', async () => {
        await request(app)
          .put(`/posts/${postId}`)
          .send(updatedTestPost)
          .expect(401);
      });

      it('should return 401 when authorization credentials are invalid', async () => {
        await request(app)
          .put(`/posts/${postId}`)
          .set('authorization', INVALID_AUTH_HEADER)
          .send(updatedTestPost)
          .expect(401);
      });
    });

    describe('Validation', () => {
      it('should return 400 if title is empty', async () => {
        const response = await request(app)
          .put(`/posts/${postId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...updatedTestPost,
            title: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'title' })]),
        );
      });

      it('should return 400 if title exceeds 30 characters', async () => {
        const response = await request(app)
          .put(`/posts/${postId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...updatedTestPost,
            title: 'a'.repeat(31),
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'title' })]),
        );
      });

      it('should return 400 if shortDescription is empty', async () => {
        const response = await request(app)
          .put(`/posts/${postId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...updatedTestPost,
            shortDescription: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'shortDescription' }),
          ]),
        );
      });

      it('should return 400 if shortDescription exceeds 100 characters', async () => {
        const response = await request(app)
          .put(`/posts/${postId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...updatedTestPost,
            shortDescription: 'a'.repeat(101),
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'shortDescription' }),
          ]),
        );
      });

      it('should return 400 if content is empty', async () => {
        const response = await request(app)
          .put(`/posts/${postId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...updatedTestPost,
            content: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'content' }),
          ]),
        );
      });

      it('should return 400 if content exceeds 1000 characters', async () => {
        const response = await request(app)
          .put(`/posts/${postId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...updatedTestPost,
            content: 'a'.repeat(1001),
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'content' }),
          ]),
        );
      });

      it('should return 400 if blogId is empty', async () => {
        const response = await request(app)
          .put(`/posts/${postId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...updatedTestPost,
            blogId: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'blogId' }),
          ]),
        );
      });

      it('should return 400 with multiple errors for multiple invalid fields', async () => {
        const response = await request(app)
          .put(`/posts/${postId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            title: 'a'.repeat(31),
            shortDescription: '',
            content: 'a'.repeat(1001),
            blogId: '',
          })
          .expect(400);

        expect(response.body.errorsMessages.length).toBeGreaterThanOrEqual(4);
      });
    });

    describe('Not found tests', () => {
      it('should return 404 if post does not exist', async () => {
        await request(app)
          .put('/posts/999999')
          .set('authorization', VALID_AUTH_HEADER)
          .send(updatedTestPost)
          .expect(404);
      });

      it('should return 404 for non-existent post with valid id format', async () => {
        await request(app)
          .put('/posts/000000000000000000000000')
          .set('authorization', VALID_AUTH_HEADER)
          .send(updatedTestPost)
          .expect(404);
      });
    });
  });

  describe('DELETE /posts/:id', () => {
    let postToDeleteId: string;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/posts')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testPost)
        .expect(201);

      postToDeleteId = createResponse.body.id;
    });

    it('should return 204 and delete post by id', async () => {
      await request(app)
        .delete(`/posts/${postToDeleteId}`)
        .set('authorization', VALID_AUTH_HEADER)
        .expect(204);

      // Verify the post was deleted
      await request(app).get(`/posts/${postToDeleteId}`).expect(404);
    });

    describe('Authorization tests', () => {
      it('should return 401 when authorization header is missing', async () => {
        await request(app).delete(`/posts/${postToDeleteId}`).expect(401);

        // Verify post was not deleted
        await request(app).get(`/posts/${postToDeleteId}`).expect(200);
      });

      it('should return 401 when authorization credentials are invalid', async () => {
        await request(app)
          .delete(`/posts/${postToDeleteId}`)
          .set('authorization', INVALID_AUTH_HEADER)
          .expect(401);

        // Verify post was not deleted
        await request(app).get(`/posts/${postToDeleteId}`).expect(200);
      });
    });

    describe('Not found tests', () => {
      it('should return 404 if post does not exist', async () => {
        await request(app)
          .delete('/posts/999999')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(404);
      });

      it('should return 404 for non-existent post with valid id format', async () => {
        await request(app)
          .delete('/posts/000000000000000000000000')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(404);
      });

      it('should return 404 when trying to delete already deleted post', async () => {
        await request(app)
          .delete(`/posts/${postToDeleteId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .expect(204);

        await request(app)
          .delete(`/posts/${postToDeleteId}`)
          .set('authorization', VALID_AUTH_HEADER)
          .expect(404);
      });
    });
  });
});
