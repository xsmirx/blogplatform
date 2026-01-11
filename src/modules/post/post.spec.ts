import express from 'express';
import request from 'supertest';
import { setupApp } from '../../setup-app';
import { PostDTO } from './types';
import { BlogDTO } from '../blog/types';

describe('Post API', () => {
  const app = express();
  setupApp(app);

  const AUTH_HEADER = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;

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
      .set('authorization', AUTH_HEADER)
      .send(testBlog)
      .expect(201);

    blogId = blogResponse.body.id;
    testPost.blogId = blogId;
    updatedTestPost.blogId = blogId;
  });

  describe('GET /posts', () => {
    it('should return empty array when no posts exist', async () => {
      const response = await request(app).get('/posts').expect(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('POST /posts', () => {
    it('should create a new post', async () => {
      const response = await request(app)
        .post('/posts')
        .set('authorization', AUTH_HEADER)
        .send(testPost)
        .expect(201);

      postId = response.body.id;
      expect(postId).toBeDefined();
      expect(response.body.title).toEqual(testPost.title);
      expect(response.body.shortDescription).toEqual(testPost.shortDescription);
      expect(response.body.content).toEqual(testPost.content);
      expect(response.body.blogId).toEqual(testPost.blogId);
    });

    describe('Validation', () => {
      it('should return 400 if title is missing', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', AUTH_HEADER)
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
          .set('authorization', AUTH_HEADER)
          .send({
            ...testPost,
            title: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              message: expect.stringContaining('1 and 30'),
            }),
          ]),
        );
      });

      it('should return 400 if title is too long (> 30 characters)', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', AUTH_HEADER)
          .send({
            ...testPost,
            title: 'This is a very long title that exceeds the limit',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              message: expect.stringContaining('1 and 30'),
            }),
          ]),
        );
      });

      it('should return 400 if title is not a string', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', AUTH_HEADER)
          .send({
            ...testPost,
            title: 123,
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              message: expect.stringContaining('string'),
            }),
          ]),
        );
      });

      it('should return 400 if shortDescription is missing', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', AUTH_HEADER)
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
          .set('authorization', AUTH_HEADER)
          .send({
            ...testPost,
            shortDescription: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'shortDescription',
              message: expect.stringContaining('1 and 100'),
            }),
          ]),
        );
      });

      it('should return 400 if shortDescription is too long (> 100 characters)', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', AUTH_HEADER)
          .send({
            ...testPost,
            shortDescription: 'a'.repeat(101),
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'shortDescription',
              message: expect.stringContaining('1 and 100'),
            }),
          ]),
        );
      });

      it('should return 400 if content is missing', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', AUTH_HEADER)
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
          .set('authorization', AUTH_HEADER)
          .send({
            ...testPost,
            content: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'content',
              message: expect.stringContaining('1 and 1000'),
            }),
          ]),
        );
      });

      it('should return 400 if content is too long (> 1000 characters)', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', AUTH_HEADER)
          .send({
            ...testPost,
            content: 'a'.repeat(1001),
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'content',
              message: expect.stringContaining('1 and 1000'),
            }),
          ]),
        );
      });

      it('should return 400 if blogId is missing', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', AUTH_HEADER)
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
          .set('authorization', AUTH_HEADER)
          .send({
            ...testPost,
            blogId: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'blogId',
              message: expect.stringContaining('must not be empty'),
            }),
          ]),
        );
      });

      it('should return 400 with multiple errors for multiple invalid fields', async () => {
        const response = await request(app)
          .post('/posts')
          .set('authorization', AUTH_HEADER)
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
    });
  });

  describe('GET /posts/:id', () => {
    it('should return post by id', async () => {
      const response = await request(app).get(`/posts/${postId}`).expect(200);

      expect(response.body).toEqual({
        id: postId,
        title: testPost.title,
        shortDescription: testPost.shortDescription,
        content: testPost.content,
        blogId: testPost.blogId,
        blogName: testBlog.name,
      });
    });

    it('should return 404 if post does not exist', async () => {
      await request(app).get('/posts/999999').expect(404);
    });
  });

  describe('PUT /posts/:id', () => {
    it('should update existing post', async () => {
      await request(app)
        .put(`/posts/${postId}`)
        .set('authorization', AUTH_HEADER)
        .send(updatedTestPost)
        .expect(204);

      const response = await request(app).get(`/posts/${postId}`).expect(200);
      expect(response.body.title).toEqual(updatedTestPost.title);
      expect(response.body.shortDescription).toEqual(
        updatedTestPost.shortDescription,
      );
      expect(response.body.content).toEqual(updatedTestPost.content);
      expect(response.body.blogId).toEqual(updatedTestPost.blogId);
    });

    describe('Validation', () => {
      it('should return 400 if title is too long', async () => {
        const response = await request(app)
          .put(`/posts/${postId}`)
          .set('authorization', AUTH_HEADER)
          .send({
            ...updatedTestPost,
            title: 'This is a very long title that exceeds the limit',
          })
          .expect(400);

        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([expect.objectContaining({ field: 'title' })]),
        );
      });

      it('should return 400 if shortDescription is too long', async () => {
        const response = await request(app)
          .put(`/posts/${postId}`)
          .set('authorization', AUTH_HEADER)
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

      it('should return 400 if content is too long', async () => {
        const response = await request(app)
          .put(`/posts/${postId}`)
          .set('authorization', AUTH_HEADER)
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

      it('should return 404 if post does not exist', async () => {
        await request(app)
          .put('/posts/999999')
          .set('authorization', AUTH_HEADER)
          .send(updatedTestPost)
          .expect(404);
      });
    });
  });

  describe('DELETE /posts/:id', () => {
    it('should delete post by id', async () => {
      await request(app)
        .delete(`/posts/${postId}`)
        .set('authorization', AUTH_HEADER)
        .expect(204);

      await request(app).get(`/posts/${postId}`).expect(404);
    });

    it('should return 404 if post does not exist', async () => {
      await request(app)
        .delete('/posts/999999')
        .set('authorization', AUTH_HEADER)
        .expect(404);
    });
  });
});
