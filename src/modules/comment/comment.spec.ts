import express from 'express';
import request from 'supertest';
import { setupApp } from '../../setup-app';
import { databaseConnection } from '../../bd';

describe('Comment API', () => {
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

  const testBlog = {
    name: 'Test Blog',
    description: 'This is a test blog',
    websiteUrl: 'https://testblog.com',
  };

  const testPost = {
    title: 'Test Post',
    shortDescription: 'This is a test post',
    content: 'This is the content of the test post',
    blogId: '',
  };

  const validComment = {
    content: 'This is a valid comment with at least 20 characters',
  };

  let blogId: string;
  let postId: string;
  let accessToken: string;
  let accessToken2: string;

  // Helper function to get access token
  const getAccessToken = async (
    login: string,
    password: string,
  ): Promise<string> => {
    const response = await request(app)
      .post('/auth/login')
      .send({ loginOrEmail: login, password })
      .expect(200);
    return response.body.accessToken;
  };

  beforeAll(async () => {
    await databaseConnection.connect({
      mongoURL: 'mongodb://admin:admin@localhost:27017',
      dbName: 'blogplatform-test',
    });

    await request(app).delete('/testing/all-data').expect(204);

    // Create a blog
    const blogResponse = await request(app)
      .post('/blogs')
      .set('authorization', VALID_AUTH_HEADER)
      .send(testBlog)
      .expect(201);

    blogId = blogResponse.body.id;
    testPost.blogId = blogId;

    // Create a post
    const postResponse = await request(app)
      .post('/posts')
      .set('authorization', VALID_AUTH_HEADER)
      .send(testPost)
      .expect(201);

    postId = postResponse.body.id;

    // Create users and get access tokens
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

    accessToken = await getAccessToken(testUser.login, testUser.password);
    accessToken2 = await getAccessToken(testUser2.login, testUser2.password);
  });

  describe('POST /posts/{postId}/comments', () => {
    beforeEach(async () => {
      // Clean comments before each test
      await request(app).delete('/testing/all-data').expect(204);

      // Recreate necessary data
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

      accessToken = await getAccessToken(testUser.login, testUser.password);
      accessToken2 = await getAccessToken(testUser2.login, testUser2.password);
    });

    it('should return 401 when not authorized', async () => {
      await request(app)
        .post(`/posts/${postId}/comments`)
        .send(validComment)
        .expect(401);
    });

    it('should return 401 when authorization header is empty', async () => {
      await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', '')
        .send(validComment)
        .expect(401);
    });

    it('should return 401 when invalid token provided', async () => {
      await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', 'Bearer invalidtoken')
        .send(validComment)
        .expect(401);
    });

    it('should return 404 when post does not exist', async () => {
      await request(app)
        .post('/posts/507f1f77bcf86cd799439011/comments')
        .set('authorization', `Bearer ${accessToken}`)
        .send(validComment)
        .expect(404);
    });

    it('should return 201 and created comment when valid data', async () => {
      const response = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send(validComment)
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        content: validComment.content,
        commentatorInfo: {
          userId: expect.any(String),
          userLogin: expect.any(String),
        },
        createdAt: expect.any(String),
      });
    });

    it('should return comment with correct structure', async () => {
      const response = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send(validComment)
        .expect(201);

      expect(response.body.id).toBeTruthy();
      expect(response.body.content).toBe(validComment.content);
      expect(response.body.commentatorInfo).toBeDefined();
      expect(response.body.commentatorInfo.userId).toBeTruthy();
      expect(response.body.commentatorInfo.userLogin).toBeTruthy();
      expect(response.body.createdAt).toBeTruthy();

      // Validate createdAt is a valid ISO date string
      expect(new Date(response.body.createdAt).toISOString()).toBe(
        response.body.createdAt,
      );
    });

    it('should set correct userId and userLogin in commentatorInfo', async () => {
      const response = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send(validComment)
        .expect(201);

      expect(response.body.commentatorInfo.userLogin).toBe(testUser.login);
      expect(typeof response.body.commentatorInfo.userId).toBe('string');
    });

    describe('Validation tests', () => {
      it('should return 400 when content is missing', async () => {
        const response = await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({})
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'content',
            }),
          ]),
        });
      });

      it('should return 400 when content is too short (< 20 chars)', async () => {
        const response = await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: 'Too short' })
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'content',
            }),
          ]),
        });
      });

      it('should return 400 when content is too long (> 300 chars)', async () => {
        const longContent = 'a'.repeat(301);
        const response = await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: longContent })
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'content',
            }),
          ]),
        });
      });

      it('should return 400 when content is empty string', async () => {
        const response = await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: '' })
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'content',
            }),
          ]),
        });
      });

      it('should return 400 when content is only whitespace', async () => {
        const response = await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: '                    ' })
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'content',
            }),
          ]),
        });
      });

      it('should accept content with exactly 20 characters', async () => {
        const response = await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: '12345678901234567890' })
          .expect(201);

        expect(response.body.content).toBe('12345678901234567890');
      });

      it('should accept content with exactly 300 characters', async () => {
        const content = 'a'.repeat(300);
        const response = await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content })
          .expect(201);

        expect(response.body.content).toBe(content);
        expect(response.body.content.length).toBe(300);
      });
    });

    describe('Multiple comments', () => {
      it('should create multiple comments for same post', async () => {
        const comment1 = await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: 'First comment with enough characters' })
          .expect(201);

        const comment2 = await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: 'Second comment with enough characters' })
          .expect(201);

        expect(comment1.body.id).not.toBe(comment2.body.id);
        expect(comment1.body.content).not.toBe(comment2.body.content);
      });

      it('should create comments from different users', async () => {
        const comment1 = await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: 'Comment from first user here' })
          .expect(201);

        const comment2 = await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken2}`)
          .send({ content: 'Comment from second user here' })
          .expect(201);

        expect(comment1.body.commentatorInfo.userLogin).toBe(testUser.login);
        expect(comment2.body.commentatorInfo.userLogin).toBe(testUser2.login);
        expect(comment1.body.commentatorInfo.userId).not.toBe(
          comment2.body.commentatorInfo.userId,
        );
      });
    });
  });

  describe('GET /posts/{postId}/comments', () => {
    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

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

      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);

      accessToken = await getAccessToken(testUser.login, testUser.password);
    });

    it('should return 404 when post does not exist', async () => {
      await request(app)
        .get('/posts/507f1f77bcf86cd799439011/comments')
        .expect(404);
    });

    it('should return 200 and empty paginator when no comments', async () => {
      const response = await request(app)
        .get(`/posts/${postId}/comments`)
        .expect(200);

      expect(response.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('should return 200 and paginator with comments', async () => {
      // Create a comment first
      await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send(validComment)
        .expect(201);

      const response = await request(app)
        .get(`/posts/${postId}/comments`)
        .expect(200);

      expect(response.body).toEqual({
        pagesCount: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalCount: expect.any(Number),
        items: expect.any(Array),
      });

      expect(response.body.totalCount).toBeGreaterThan(0);
      expect(response.body.items.length).toBeGreaterThan(0);
    });

    it('should return comments with correct structure', async () => {
      await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send(validComment)
        .expect(201);

      const response = await request(app)
        .get(`/posts/${postId}/comments`)
        .expect(200);

      expect(response.body.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            content: expect.any(String),
            commentatorInfo: expect.objectContaining({
              userId: expect.any(String),
              userLogin: expect.any(String),
            }),
            createdAt: expect.any(String),
          }),
        ]),
      );
    });

    describe('Pagination tests', () => {
      beforeEach(async () => {
        // Create multiple comments for pagination testing
        for (let i = 1; i <= 15; i++) {
          await request(app)
            .post(`/posts/${postId}/comments`)
            .set('authorization', `Bearer ${accessToken}`)
            .send({ content: `Comment number ${i} with enough characters` })
            .expect(201);
        }
      });

      it('should return correct page with pageNumber parameter', async () => {
        const response = await request(app)
          .get(`/posts/${postId}/comments`)
          .query({ pageNumber: 2, pageSize: 5 })
          .expect(200);

        expect(response.body.page).toBe(2);
        expect(response.body.items.length).toBe(5);
      });

      it('should return correct pageSize', async () => {
        const response = await request(app)
          .get(`/posts/${postId}/comments`)
          .query({ pageSize: 3 })
          .expect(200);

        expect(response.body.pageSize).toBe(3);
        expect(response.body.items.length).toBe(3);
      });

      it('should limit pageSize to maximum 20', async () => {
        const response = await request(app)
          .get(`/posts/${postId}/comments`)
          .query({ pageSize: 100 })
          .expect(200);

        expect(response.body.pageSize).toBeLessThanOrEqual(20);
      });

      it('should return correct totalCount', async () => {
        const response = await request(app)
          .get(`/posts/${postId}/comments`)
          .expect(200);

        expect(response.body.totalCount).toBe(15);
      });

      it('should calculate pagesCount correctly', async () => {
        const response = await request(app)
          .get(`/posts/${postId}/comments`)
          .query({ pageSize: 10 })
          .expect(200);

        expect(response.body.pagesCount).toBe(2); // 15 comments / 10 per page = 2 pages
        expect(response.body.totalCount).toBe(15);
      });

      it('should use default values when pagination params not provided', async () => {
        const response = await request(app)
          .get(`/posts/${postId}/comments`)
          .expect(200);

        expect(response.body.page).toBe(1);
        expect(response.body.pageSize).toBe(10);
      });
    });

    describe('Sorting tests', () => {
      beforeEach(async () => {
        // Create comments with delays to ensure different timestamps
        await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: 'First comment created with enough chars' })
          .expect(201);

        await new Promise((resolve) => setTimeout(resolve, 10));

        await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: 'Second comment created with enough chars' })
          .expect(201);
      });

      it('should sort by createdAt desc by default', async () => {
        const response = await request(app)
          .get(`/posts/${postId}/comments`)
          .expect(200);

        expect(response.body.items.length).toBe(2);

        const firstDate = new Date(response.body.items[0].createdAt);
        const secondDate = new Date(response.body.items[1].createdAt);

        expect(firstDate.getTime()).toBeGreaterThanOrEqual(
          secondDate.getTime(),
        );
      });

      it('should sort by createdAt asc when specified', async () => {
        const response = await request(app)
          .get(`/posts/${postId}/comments`)
          .query({ sortDirection: 'asc' })
          .expect(200);

        expect(response.body.items.length).toBe(2);

        const firstDate = new Date(response.body.items[0].createdAt);
        const secondDate = new Date(response.body.items[1].createdAt);

        expect(firstDate.getTime()).toBeLessThanOrEqual(secondDate.getTime());
      });

      it('should accept sortBy parameter', async () => {
        const response = await request(app)
          .get(`/posts/${postId}/comments`)
          .query({ sortBy: 'createdAt', sortDirection: 'desc' })
          .expect(200);

        expect(response.body.items.length).toBeGreaterThan(0);
      });
    });
  });

  describe('GET /comments/{id}', () => {
    let commentId: string;

    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

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

      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);

      accessToken = await getAccessToken(testUser.login, testUser.password);

      const commentResponse = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send(validComment)
        .expect(201);

      commentId = commentResponse.body.id;
    });

    it('should return 404 when comment does not exist', async () => {
      await request(app).get('/comments/507f1f77bcf86cd799439011').expect(404);
    });

    it('should return 200 and comment when exists', async () => {
      const response = await request(app)
        .get(`/comments/${commentId}`)
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.id).toBe(commentId);
    });

    it('should return comment with correct structure', async () => {
      const response = await request(app)
        .get(`/comments/${commentId}`)
        .expect(200);

      expect(response.body).toEqual({
        id: expect.any(String),
        content: expect.any(String),
        commentatorInfo: {
          userId: expect.any(String),
          userLogin: expect.any(String),
        },
        createdAt: expect.any(String),
      });
    });

    it('should contain correct commentatorInfo', async () => {
      const response = await request(app)
        .get(`/comments/${commentId}`)
        .expect(200);

      expect(response.body.commentatorInfo.userLogin).toBe(testUser.login);
      expect(response.body.commentatorInfo.userId).toBeTruthy();
      expect(response.body.content).toBe(validComment.content);
    });

    it('should not require authorization', async () => {
      const response = await request(app)
        .get(`/comments/${commentId}`)
        .expect(200);

      expect(response.body.id).toBe(commentId);
    });
  });

  describe('PUT /comments/{commentId}', () => {
    let commentId: string;
    let comment2Id: string;

    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

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

      accessToken = await getAccessToken(testUser.login, testUser.password);
      accessToken2 = await getAccessToken(testUser2.login, testUser2.password);

      const commentResponse = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send(validComment)
        .expect(201);

      commentId = commentResponse.body.id;

      const comment2Response = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken2}`)
        .send({ content: 'Comment from second user with enough characters' })
        .expect(201);

      comment2Id = comment2Response.body.id;
    });

    it('should return 401 when not authorized', async () => {
      await request(app)
        .put(`/comments/${commentId}`)
        .send({ content: 'Updated comment with enough characters' })
        .expect(401);
    });

    it('should return 401 when invalid token provided', async () => {
      await request(app)
        .put(`/comments/${commentId}`)
        .set('authorization', 'Bearer invalidtoken')
        .send({ content: 'Updated comment with enough characters' })
        .expect(401);
    });

    it('should return 404 when comment does not exist', async () => {
      await request(app)
        .put('/comments/507f1f77bcf86cd799439011')
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'Updated comment with enough characters' })
        .expect(404);
    });

    it('should return 403 when trying to edit other users comment', async () => {
      await request(app)
        .put(`/comments/${comment2Id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'Trying to edit other user comment here' })
        .expect(403);
    });

    it('should return 204 when successfully updated own comment', async () => {
      await request(app)
        .put(`/comments/${commentId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'Successfully updated comment with enough chars' })
        .expect(204);
    });

    it('should actually update the comment content', async () => {
      const newContent = 'Updated comment content with enough characters here';

      await request(app)
        .put(`/comments/${commentId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: newContent })
        .expect(204);

      const response = await request(app)
        .get(`/comments/${commentId}`)
        .expect(200);

      expect(response.body.content).toBe(newContent);
    });

    it('should not change commentatorInfo when updating', async () => {
      const originalComment = await request(app)
        .get(`/comments/${commentId}`)
        .expect(200);

      await request(app)
        .put(`/comments/${commentId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'Updated content with enough characters here' })
        .expect(204);

      const updatedComment = await request(app)
        .get(`/comments/${commentId}`)
        .expect(200);

      expect(updatedComment.body.commentatorInfo).toEqual(
        originalComment.body.commentatorInfo,
      );
    });

    describe('Validation tests', () => {
      it('should return 400 when content is missing', async () => {
        const response = await request(app)
          .put(`/comments/${commentId}`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({})
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'content',
            }),
          ]),
        });
      });

      it('should return 400 when content is too short', async () => {
        const response = await request(app)
          .put(`/comments/${commentId}`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: 'Too short' })
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'content',
            }),
          ]),
        });
      });

      it('should return 400 when content is too long', async () => {
        const longContent = 'a'.repeat(301);
        const response = await request(app)
          .put(`/comments/${commentId}`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: longContent })
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'content',
            }),
          ]),
        });
      });

      it('should return 400 when content is empty', async () => {
        const response = await request(app)
          .put(`/comments/${commentId}`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: '' })
          .expect(400);

        expect(response.body).toEqual({
          errorsMessages: expect.arrayContaining([
            expect.objectContaining({
              message: expect.any(String),
              field: 'content',
            }),
          ]),
        });
      });

      it('should accept valid content update', async () => {
        await request(app)
          .put(`/comments/${commentId}`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: 'Valid updated content with minimum 20 characters' })
          .expect(204);
      });

      it('should accept content with exactly 20 characters', async () => {
        await request(app)
          .put(`/comments/${commentId}`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: '12345678901234567890' })
          .expect(204);
      });

      it('should accept content with exactly 300 characters', async () => {
        const content = 'a'.repeat(300);
        await request(app)
          .put(`/comments/${commentId}`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content })
          .expect(204);
      });
    });
  });

  describe('DELETE /comments/{commentId}', () => {
    let commentId: string;
    let comment2Id: string;

    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

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

      accessToken = await getAccessToken(testUser.login, testUser.password);
      accessToken2 = await getAccessToken(testUser2.login, testUser2.password);

      const commentResponse = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send(validComment)
        .expect(201);

      commentId = commentResponse.body.id;

      const comment2Response = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken2}`)
        .send({ content: 'Comment from second user with enough characters' })
        .expect(201);

      comment2Id = comment2Response.body.id;
    });

    it('should return 401 when not authorized', async () => {
      await request(app).delete(`/comments/${commentId}`).expect(401);
    });

    it('should return 401 when invalid token provided', async () => {
      await request(app)
        .delete(`/comments/${commentId}`)
        .set('authorization', 'Bearer invalidtoken')
        .expect(401);
    });

    it('should return 404 when comment does not exist', async () => {
      await request(app)
        .delete('/comments/507f1f77bcf86cd799439011')
        .set('authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should return 403 when trying to delete other users comment', async () => {
      await request(app)
        .delete(`/comments/${comment2Id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('should return 204 when successfully deleted own comment', async () => {
      await request(app)
        .delete(`/comments/${commentId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should actually delete the comment', async () => {
      await request(app)
        .delete(`/comments/${commentId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(204);

      await request(app).get(`/comments/${commentId}`).expect(404);
    });

    it('should return 404 on subsequent GET after deletion', async () => {
      await request(app)
        .delete(`/comments/${commentId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(204);

      await request(app).get(`/comments/${commentId}`).expect(404);
    });

    it('should return 404 on subsequent DELETE after deletion', async () => {
      await request(app)
        .delete(`/comments/${commentId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(204);

      await request(app)
        .delete(`/comments/${commentId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should not affect other comments when deleting one', async () => {
      await request(app)
        .delete(`/comments/${commentId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(204);

      await request(app).get(`/comments/${comment2Id}`).expect(200);
    });
  });

  describe('Integration tests', () => {
    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

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

      accessToken = await getAccessToken(testUser.login, testUser.password);
      accessToken2 = await getAccessToken(testUser2.login, testUser2.password);
    });

    it('should handle full lifecycle: create -> get -> update -> delete', async () => {
      // Create
      const createResponse = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'Original comment with enough characters' })
        .expect(201);

      const commentId = createResponse.body.id;

      // Get
      const getResponse = await request(app)
        .get(`/comments/${commentId}`)
        .expect(200);

      expect(getResponse.body.content).toBe(
        'Original comment with enough characters',
      );

      // Update
      await request(app)
        .put(`/comments/${commentId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'Updated comment with enough characters' })
        .expect(204);

      const getUpdatedResponse = await request(app)
        .get(`/comments/${commentId}`)
        .expect(200);

      expect(getUpdatedResponse.body.content).toBe(
        'Updated comment with enough characters',
      );

      // Delete
      await request(app)
        .delete(`/comments/${commentId}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(204);

      await request(app).get(`/comments/${commentId}`).expect(404);
    });

    it('should isolate comments between different users', async () => {
      await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'Comment from user 1 with enough chars' })
        .expect(201);

      const comment2 = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken2}`)
        .send({ content: 'Comment from user 2 with enough chars' })
        .expect(201);

      // User1 cannot update user2's comment
      await request(app)
        .put(`/comments/${comment2.body.id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'Trying to update user 2 comment' })
        .expect(403);

      // User1 cannot delete user2's comment
      await request(app)
        .delete(`/comments/${comment2.body.id}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(403);

      // User2 can update their own comment
      await request(app)
        .put(`/comments/${comment2.body.id}`)
        .set('authorization', `Bearer ${accessToken2}`)
        .send({ content: 'User 2 updating their own comment here' })
        .expect(204);

      // User2 can delete their own comment
      await request(app)
        .delete(`/comments/${comment2.body.id}`)
        .set('authorization', `Bearer ${accessToken2}`)
        .expect(204);
    });

    it('should preserve comments when post is updated', async () => {
      const commentResponse = await request(app)
        .post(`/posts/${postId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'Comment before post update with chars' })
        .expect(201);

      const commentId = commentResponse.body.id;

      // Update the post
      await request(app)
        .put(`/posts/${postId}`)
        .set('authorization', VALID_AUTH_HEADER)
        .send({
          title: 'Updated Post Title',
          shortDescription: 'Updated description',
          content: 'Updated content',
          blogId: blogId,
        })
        .expect(204);

      // Comment should still exist
      const getCommentResponse = await request(app)
        .get(`/comments/${commentId}`)
        .expect(200);

      expect(getCommentResponse.body.content).toBe(
        'Comment before post update with chars',
      );
    });

    it('should maintain correct pagination after deletions', async () => {
      // Create multiple comments
      const commentIds: string[] = [];
      for (let i = 1; i <= 5; i++) {
        const response = await request(app)
          .post(`/posts/${postId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: `Comment ${i} with enough characters here` })
          .expect(201);
        commentIds.push(response.body.id);
      }

      // Verify total count
      let commentsResponse = await request(app)
        .get(`/posts/${postId}/comments`)
        .expect(200);

      expect(commentsResponse.body.totalCount).toBe(5);

      // Delete one comment
      await request(app)
        .delete(`/comments/${commentIds[0]}`)
        .set('authorization', `Bearer ${accessToken}`)
        .expect(204);

      // Verify updated count
      commentsResponse = await request(app)
        .get(`/posts/${postId}/comments`)
        .expect(200);

      expect(commentsResponse.body.totalCount).toBe(4);
      expect(commentsResponse.body.items.length).toBe(4);
    });
  });
});
