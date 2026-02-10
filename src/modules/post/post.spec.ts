import express from 'express';
import request from 'supertest';
import { setupApp } from '../../setup-app';
import { PostDTO } from './types';
import { BlogInputDTO } from '../blog/types';
import { ValidationError } from '../../core/types/validation-error';
import { databaseConnection } from '../../bd';

describe('Post API', () => {
  const app = express();
  setupApp(app);

  const VALID_AUTH_HEADER = `Basic ${Buffer.from('admin:qwerty').toString('base64')}`;
  const INVALID_AUTH_HEADER = `Basic ${Buffer.from('admin:wrong').toString('base64')}`;

  const testBlog: BlogInputDTO = {
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
    await databaseConnection.connect({
      mongoURL: 'mongodb://admin:admin@localhost:27017',
      dbName: 'blogplatform-test',
    });

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
    it('should return 200 and paginator with empty items when no posts exist', async () => {
      const response = await request(app).get('/posts').expect(200);

      // Verify Paginator structure
      expect(response.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('should return 200 and paginator with posts when posts exist', async () => {
      // Create a post first
      const createResponse = await request(app)
        .post('/posts')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testPost)
        .expect(201);

      postId = createResponse.body.id;

      // Get all posts
      const response = await request(app).get('/posts').expect(200);

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
            title: expect.any(String),
            shortDescription: expect.any(String),
            content: expect.any(String),
            blogId: expect.any(String),
            blogName: expect.any(String),
            createdAt: expect.any(String),
          }),
        ]),
      );

      // Verify createdAt is valid ISO date string
      const post = response.body.items[0];
      expect(new Date(post.createdAt).toISOString()).toBe(post.createdAt);
    });

    describe('Pagination tests', () => {
      beforeAll(async () => {
        await request(app).delete('/testing/all-data').expect(204);

        // Recreate blog
        const blogResponse = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send(testBlog)
          .expect(201);

        blogId = blogResponse.body.id;

        // Create 25 posts for pagination testing
        for (let i = 1; i <= 25; i++) {
          await request(app)
            .post('/posts')
            .set('authorization', VALID_AUTH_HEADER)
            .send({
              title: `Post ${i.toString().padStart(2, '0')}`,
              shortDescription: `Description for post ${i}`,
              content: `Content for post ${i}`,
              blogId: blogId,
            })
            .expect(201);
        }
      });

      it('should use default pageSize of 10', async () => {
        const response = await request(app).get('/posts').expect(200);

        expect(response.body.pageSize).toBe(10);
        expect(response.body.items.length).toBe(10);
      });

      it('should use default pageNumber of 1', async () => {
        const response = await request(app).get('/posts').expect(200);

        expect(response.body.page).toBe(1);
      });

      it('should return correct pageSize when specified', async () => {
        const response = await request(app)
          .get('/posts?pageSize=5')
          .expect(200);

        expect(response.body.pageSize).toBe(5);
        expect(response.body.items.length).toBe(5);
      });

      it('should return correct page when pageNumber specified', async () => {
        const response = await request(app)
          .get('/posts?pageNumber=2')
          .expect(200);

        expect(response.body.page).toBe(2);
        expect(response.body.items.length).toBe(10);
      });

      it('should correctly calculate pagesCount', async () => {
        const response = await request(app)
          .get('/posts?pageSize=10')
          .expect(200);

        expect(response.body.totalCount).toBe(25);
        expect(response.body.pagesCount).toBe(3); // 25 / 10 = 3 pages
      });

      it('should handle pageSize of 1 correctly', async () => {
        const response = await request(app)
          .get('/posts?pageSize=1')
          .expect(200);

        expect(response.body.pageSize).toBe(1);
        expect(response.body.items.length).toBe(1);
        expect(response.body.pagesCount).toBe(25);
      });

      it('should handle pageSize of 20 (maximum) correctly', async () => {
        const response = await request(app)
          .get('/posts?pageSize=20')
          .expect(200);

        expect(response.body.pageSize).toBe(20);
        expect(response.body.items.length).toBe(20);
        expect(response.body.pagesCount).toBe(2); // 25 / 20 = 2 pages
      });

      it('should handle last page with fewer items', async () => {
        const response = await request(app)
          .get('/posts?pageNumber=3&pageSize=10')
          .expect(200);

        expect(response.body.page).toBe(3);
        expect(response.body.items.length).toBe(5); // Last 5 items
        expect(response.body.totalCount).toBe(25);
      });

      it('should return empty items for page beyond available data', async () => {
        const response = await request(app)
          .get('/posts?pageNumber=10&pageSize=10')
          .expect(200);

        expect(response.body.page).toBe(10);
        expect(response.body.items).toEqual([]);
        expect(response.body.totalCount).toBe(25);
      });
    });

    describe('Sorting tests', () => {
      beforeAll(async () => {
        await request(app).delete('/testing/all-data').expect(204);

        // Recreate blog
        const blogResponse = await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send(testBlog)
          .expect(201);

        blogId = blogResponse.body.id;

        // Create posts with specific titles and delays to ensure different createdAt
        await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            title: 'Zebra Post',
            shortDescription: 'Last alphabetically',
            content: 'Content about zebras',
            blogId: blogId,
          })
          .expect(201);

        await new Promise((resolve) => setTimeout(resolve, 100));

        await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            title: 'Apple Post',
            shortDescription: 'First alphabetically',
            content: 'Content about apples',
            blogId: blogId,
          })
          .expect(201);

        await new Promise((resolve) => setTimeout(resolve, 100));

        await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            title: 'Mango Post',
            shortDescription: 'Middle alphabetically',
            content: 'Content about mangos',
            blogId: blogId,
          })
          .expect(201);
      });

      it('should sort by createdAt desc by default', async () => {
        const response = await request(app).get('/posts').expect(200);

        expect(response.body.items.length).toBe(3);
        expect(response.body.items[0].title).toBe('Mango Post'); // Last created
        expect(response.body.items[2].title).toBe('Zebra Post'); // First created
      });

      it('should sort by createdAt asc when specified', async () => {
        const response = await request(app)
          .get('/posts?sortDirection=asc')
          .expect(200);

        expect(response.body.items[0].title).toBe('Zebra Post'); // First created
        expect(response.body.items[2].title).toBe('Mango Post'); // Last created
      });

      it('should sort by title desc', async () => {
        const response = await request(app)
          .get('/posts?sortBy=title&sortDirection=desc')
          .expect(200);

        expect(response.body.items[0].title).toBe('Zebra Post');
        expect(response.body.items[1].title).toBe('Mango Post');
        expect(response.body.items[2].title).toBe('Apple Post');
      });

      it('should sort by title asc', async () => {
        const response = await request(app)
          .get('/posts?sortBy=title&sortDirection=asc')
          .expect(200);

        expect(response.body.items[0].title).toBe('Apple Post');
        expect(response.body.items[1].title).toBe('Mango Post');
        expect(response.body.items[2].title).toBe('Zebra Post');
      });

      it('should combine sorting with pagination', async () => {
        const response = await request(app)
          .get('/posts?sortBy=title&sortDirection=asc&pageSize=2')
          .expect(200);

        expect(response.body.items.length).toBe(2);
        expect(response.body.items[0].title).toBe('Apple Post');
        expect(response.body.items[1].title).toBe('Mango Post');
      });
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
        createdAt: expect.any(String),
      });
      expect(postId).toBeDefined();

      // Verify blogName is included in response
      expect(response.body.blogName).toEqual(testBlog.name);

      // Verify createdAt is valid ISO 8601 date-time format
      expect(new Date(response.body.createdAt).toISOString()).toBe(
        response.body.createdAt,
      );
    });

    it('should create post with createdAt timestamp close to current time', async () => {
      const beforeCreate = new Date();

      const response = await request(app)
        .post('/posts')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testPost)
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
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            title: 'a'.repeat(30),
          })
          .expect(201);

        // Verify new field is present
        expect(response.body).toHaveProperty('createdAt');
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
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            shortDescription: 'a'.repeat(100),
          })
          .expect(201);

        // Verify new field is present
        expect(response.body).toHaveProperty('createdAt');
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
        const response = await request(app)
          .post('/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...testPost,
            content: 'a'.repeat(1000),
          })
          .expect(201);

        // Verify new field is present
        expect(response.body).toHaveProperty('createdAt');
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
        createdAt: expect.any(String),
      });

      // Verify all required fields are present
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('shortDescription');
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('blogId');
      expect(response.body).toHaveProperty('blogName');
      expect(response.body).toHaveProperty('createdAt');

      // Verify createdAt is valid ISO 8601 date-time format
      expect(new Date(response.body.createdAt).toISOString()).toBe(
        response.body.createdAt,
      );
    });

    it('should return 404 if post does not exist', async () => {
      await request(app).get('/posts/507f1f77bcf86cd799439011').expect(404);
    });

    it('should return 404 for non-existent post with valid id format', async () => {
      await request(app).get('/posts/000000000000000000000001').expect(404);
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
      // Get original createdAt value
      const originalPost = await request(app)
        .get(`/posts/${postId}`)
        .expect(200);
      const originalCreatedAt = originalPost.body.createdAt;

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

      // Verify new field is still present after update
      expect(response.body).toHaveProperty('createdAt');

      // Verify createdAt doesn't change after update
      expect(response.body.createdAt).toBe(originalCreatedAt);
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
          .put('/posts/507f1f77bcf86cd799439011')
          .set('authorization', VALID_AUTH_HEADER)
          .send(updatedTestPost)
          .expect(404);
      });

      it('should return 404 for non-existent post with valid id format', async () => {
        await request(app)
          .put('/posts/000000000000000000000001')
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
          .delete('/posts/507f1f77bcf86cd799439011')
          .set('authorization', VALID_AUTH_HEADER)
          .expect(404);
      });

      it('should return 404 for non-existent post with valid id format', async () => {
        await request(app)
          .delete('/posts/000000000000000000000001')
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

  describe('GET /posts/{postId}/comments', () => {
    let testPostId: string;
    let accessToken: string;

    const testUser = {
      login: 'commenter',
      password: 'password123',
      email: 'commenter@example.dev',
    };

    const getAccessToken = async (): Promise<string> => {
      const response = await request(app)
        .post('/auth/login')
        .send({ loginOrEmail: testUser.login, password: testUser.password })
        .expect(200);
      return response.body.accessToken;
    };

    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      // Create blog
      const blogResponse = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      const newBlogId = blogResponse.body.id;

      // Create post
      const postResponse = await request(app)
        .post('/posts')
        .set('authorization', VALID_AUTH_HEADER)
        .send({ ...testPost, blogId: newBlogId })
        .expect(201);

      testPostId = postResponse.body.id;

      // Create user and get token
      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);

      accessToken = await getAccessToken();
    });

    it('should return 404 when post does not exist', async () => {
      await request(app)
        .get('/posts/507f1f77bcf86cd799439011/comments')
        .expect(404);
    });

    it('should return 200 and empty paginator when post has no comments', async () => {
      const response = await request(app)
        .get(`/posts/${testPostId}/comments`)
        .expect(200);

      expect(response.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('should return 200 and paginator with comments when post has comments', async () => {
      // Create a comment
      await request(app)
        .post(`/posts/${testPostId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'This is a test comment with enough characters' })
        .expect(201);

      const response = await request(app)
        .get(`/posts/${testPostId}/comments`)
        .expect(200);

      expect(response.body).toEqual({
        pagesCount: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalCount: expect.any(Number),
        items: expect.any(Array),
      });

      expect(response.body.totalCount).toBe(1);
      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0]).toEqual({
        id: expect.any(String),
        content: expect.any(String),
        commentatorInfo: {
          userId: expect.any(String),
          userLogin: expect.any(String),
        },
        createdAt: expect.any(String),
      });
    });

    it('should support pagination parameters', async () => {
      // Create multiple comments
      for (let i = 1; i <= 5; i++) {
        await request(app)
          .post(`/posts/${testPostId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: `Comment ${i} with enough characters here` })
          .expect(201);
      }

      const response = await request(app)
        .get(`/posts/${testPostId}/comments`)
        .query({ pageSize: 2, pageNumber: 2 })
        .expect(200);

      expect(response.body.page).toBe(2);
      expect(response.body.pageSize).toBe(2);
      expect(response.body.totalCount).toBe(5);
      expect(response.body.items.length).toBe(2);
    });

    it('should support sorting parameters', async () => {
      // Create comments with delays
      await request(app)
        .post(`/posts/${testPostId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'First comment with enough characters' })
        .expect(201);

      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app)
        .post(`/posts/${testPostId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'Second comment with enough characters' })
        .expect(201);

      // Test desc sorting (default)
      const descResponse = await request(app)
        .get(`/posts/${testPostId}/comments`)
        .query({ sortDirection: 'desc' })
        .expect(200);

      expect(descResponse.body.items.length).toBe(2);

      // Test asc sorting
      const ascResponse = await request(app)
        .get(`/posts/${testPostId}/comments`)
        .query({ sortDirection: 'asc' })
        .expect(200);

      expect(ascResponse.body.items.length).toBe(2);
    });
  });

  describe('POST /posts/{postId}/comments', () => {
    let testPostId: string;
    let accessToken: string;

    const testUser = {
      login: 'commenter',
      password: 'password123',
      email: 'commenter@example.dev',
    };

    const getAccessToken = async (): Promise<string> => {
      const response = await request(app)
        .post('/auth/login')
        .send({ loginOrEmail: testUser.login, password: testUser.password })
        .expect(200);
      return response.body.accessToken;
    };

    beforeEach(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      // Create blog
      const blogResponse = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      const newBlogId = blogResponse.body.id;

      // Create post
      const postResponse = await request(app)
        .post('/posts')
        .set('authorization', VALID_AUTH_HEADER)
        .send({ ...testPost, blogId: newBlogId })
        .expect(201);

      testPostId = postResponse.body.id;

      // Create user and get token
      await request(app)
        .post('/users')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testUser)
        .expect(201);

      accessToken = await getAccessToken();
    });

    it('should return 401 when not authorized', async () => {
      await request(app)
        .post(`/posts/${testPostId}/comments`)
        .send({ content: 'This is a comment with enough characters' })
        .expect(401);
    });

    it('should return 404 when post does not exist', async () => {
      await request(app)
        .post('/posts/507f1f77bcf86cd799439011/comments')
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'This is a comment with enough characters' })
        .expect(404);
    });

    it('should return 201 and created comment when valid data provided', async () => {
      const commentContent =
        'This is a valid test comment with enough characters';

      const response = await request(app)
        .post(`/posts/${testPostId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: commentContent })
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        content: commentContent,
        commentatorInfo: {
          userId: expect.any(String),
          userLogin: testUser.login,
        },
        createdAt: expect.any(String),
      });

      // Verify createdAt is valid ISO date
      expect(new Date(response.body.createdAt).toISOString()).toBe(
        response.body.createdAt,
      );
    });

    describe('Validation tests', () => {
      it('should return 400 when content is missing', async () => {
        const response = await request(app)
          .post(`/posts/${testPostId}/comments`)
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
          .post(`/posts/${testPostId}/comments`)
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
          .post(`/posts/${testPostId}/comments`)
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
          .post(`/posts/${testPostId}/comments`)
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

      it('should accept content with exactly 20 characters', async () => {
        const response = await request(app)
          .post(`/posts/${testPostId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content: '12345678901234567890' })
          .expect(201);

        expect(response.body.content).toBe('12345678901234567890');
      });

      it('should accept content with exactly 300 characters', async () => {
        const content = 'a'.repeat(300);
        const response = await request(app)
          .post(`/posts/${testPostId}/comments`)
          .set('authorization', `Bearer ${accessToken}`)
          .send({ content })
          .expect(201);

        expect(response.body.content).toBe(content);
        expect(response.body.content.length).toBe(300);
      });
    });

    it('should allow creating multiple comments for same post', async () => {
      const comment1 = await request(app)
        .post(`/posts/${testPostId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'First comment with enough characters' })
        .expect(201);

      const comment2 = await request(app)
        .post(`/posts/${testPostId}/comments`)
        .set('authorization', `Bearer ${accessToken}`)
        .send({ content: 'Second comment with enough characters' })
        .expect(201);

      expect(comment1.body.id).not.toBe(comment2.body.id);

      // Verify both comments exist for the post
      const commentsResponse = await request(app)
        .get(`/posts/${testPostId}/comments`)
        .expect(200);

      expect(commentsResponse.body.totalCount).toBe(2);
      expect(commentsResponse.body.items.length).toBe(2);
    });
  });
});
