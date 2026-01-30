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
    it('should return 200 and paginator with empty items when no blogs exist', async () => {
      const response = await request(app).get('/blogs').expect(200);

      // Verify Paginator structure
      expect(response.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    it('should return 200 and paginator with blogs when blogs exist', async () => {
      // Create a blog first
      const createResponse = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      blogId = createResponse.body.id;

      // Get all blogs
      const response = await request(app).get('/blogs').expect(200);

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
            name: expect.any(String),
            description: expect.any(String),
            websiteUrl: expect.any(String),
            createdAt: expect.any(String),
            isMembership: expect.any(Boolean),
          }),
        ]),
      );

      // Verify createdAt is valid ISO date string
      const blog = response.body.items[0];
      expect(new Date(blog.createdAt).toISOString()).toBe(blog.createdAt);

      // Verify isMembership is false (as per OpenAPI spec)
      expect(blog.isMembership).toBe(false);
    });

    describe('Search by name tests', () => {
      beforeAll(async () => {
        await request(app).delete('/testing/all-data').expect(204);

        // Create multiple blogs with different names
        await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            name: 'JavaScript Blog',
            description: 'A blog about JavaScript',
            websiteUrl: 'https://jsblog.com',
          })
          .expect(201);

        await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            name: 'TypeScript News',
            description: 'Latest TypeScript updates',
            websiteUrl: 'https://tsnews.com',
          })
          .expect(201);

        await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            name: 'Python Guide',
            description: 'Python programming guide',
            websiteUrl: 'https://pyguide.com',
          })
          .expect(201);
      });

      it('should find blogs by partial name match (case insensitive)', async () => {
        const response = await request(app)
          .get('/blogs?searchNameTerm=script')
          .expect(200);

        expect(response.body.totalCount).toBe(2);
        expect(response.body.items.length).toBe(2);
        expect(
          response.body.items.every((blog: any) =>
            blog.name.toLowerCase().includes('script'),
          ),
        ).toBe(true);
      });

      it('should find blogs by name term at the beginning', async () => {
        const response = await request(app)
          .get('/blogs?searchNameTerm=Type')
          .expect(200);

        expect(response.body.totalCount).toBe(1);
        expect(response.body.items[0].name).toBe('TypeScript News');
      });

      it('should find blogs by name term at the end', async () => {
        const response = await request(app)
          .get('/blogs?searchNameTerm=Guide')
          .expect(200);

        expect(response.body.totalCount).toBe(1);
        expect(response.body.items[0].name).toBe('Python Guide');
      });

      it('should find blogs by name term in the middle', async () => {
        const response = await request(app)
          .get('/blogs?searchNameTerm=ava')
          .expect(200);

        expect(response.body.totalCount).toBe(1);
        expect(response.body.items[0].name).toBe('JavaScript Blog');
      });

      it('should return all blogs when searchNameTerm is not provided', async () => {
        const response = await request(app).get('/blogs').expect(200);

        expect(response.body.totalCount).toBe(3);
      });

      it('should return empty items when no blogs match searchNameTerm', async () => {
        const response = await request(app)
          .get('/blogs?searchNameTerm=NonExistentBlog')
          .expect(200);

        expect(response.body.totalCount).toBe(0);
        expect(response.body.items).toEqual([]);
      });

      it('should search case-insensitively', async () => {
        const response1 = await request(app)
          .get('/blogs?searchNameTerm=JAVASCRIPT')
          .expect(200);

        const response2 = await request(app)
          .get('/blogs?searchNameTerm=javascript')
          .expect(200);

        expect(response1.body.totalCount).toBe(response2.body.totalCount);
        expect(response1.body.totalCount).toBe(1);
      });
    });

    describe('Pagination tests', () => {
      beforeAll(async () => {
        await request(app).delete('/testing/all-data').expect(204);

        // Create 25 blogs for pagination testing
        for (let i = 1; i <= 25; i++) {
          await request(app)
            .post('/blogs')
            .set('authorization', VALID_AUTH_HEADER)
            .send({
              name: `Blog ${i.toString().padStart(2, '0')}`,
              description: `Description for blog ${i}`,
              websiteUrl: `https://blog${i}.com`,
            })
            .expect(201);
        }
      });

      it('should use default pageSize of 10', async () => {
        const response = await request(app).get('/blogs').expect(200);

        expect(response.body.pageSize).toBe(10);
        expect(response.body.items.length).toBe(10);
      });

      it('should use default pageNumber of 1', async () => {
        const response = await request(app).get('/blogs').expect(200);

        expect(response.body.page).toBe(1);
      });

      it('should return correct pageSize when specified', async () => {
        const response = await request(app)
          .get('/blogs?pageSize=5')
          .expect(200);

        expect(response.body.pageSize).toBe(5);
        expect(response.body.items.length).toBe(5);
      });

      it('should return correct page when pageNumber specified', async () => {
        const response = await request(app)
          .get('/blogs?pageNumber=2')
          .expect(200);

        expect(response.body.page).toBe(2);
        expect(response.body.items.length).toBe(10);
      });

      it('should correctly calculate pagesCount', async () => {
        const response = await request(app)
          .get('/blogs?pageSize=10')
          .expect(200);

        expect(response.body.totalCount).toBe(25);
        expect(response.body.pagesCount).toBe(3); // 25 / 10 = 3 pages
      });

      it('should handle pageSize of 1 correctly', async () => {
        const response = await request(app)
          .get('/blogs?pageSize=1')
          .expect(200);

        expect(response.body.pageSize).toBe(1);
        expect(response.body.items.length).toBe(1);
        expect(response.body.pagesCount).toBe(25);
      });

      it('should handle pageSize of 20 (maximum) correctly', async () => {
        const response = await request(app)
          .get('/blogs?pageSize=20')
          .expect(200);

        expect(response.body.pageSize).toBe(20);
        expect(response.body.items.length).toBe(20);
        expect(response.body.pagesCount).toBe(2); // 25 / 20 = 2 pages
      });

      it('should handle last page with fewer items', async () => {
        const response = await request(app)
          .get('/blogs?pageNumber=3&pageSize=10')
          .expect(200);

        expect(response.body.page).toBe(3);
        expect(response.body.items.length).toBe(5); // Last 5 items
        expect(response.body.totalCount).toBe(25);
      });

      it('should return empty items for page beyond available data', async () => {
        const response = await request(app)
          .get('/blogs?pageNumber=10&pageSize=10')
          .expect(200);

        expect(response.body.page).toBe(10);
        expect(response.body.items).toEqual([]);
        expect(response.body.totalCount).toBe(25);
      });

      it('should handle custom pageSize and pageNumber combination', async () => {
        const response = await request(app)
          .get('/blogs?pageNumber=2&pageSize=7')
          .expect(200);

        expect(response.body.page).toBe(2);
        expect(response.body.pageSize).toBe(7);
        expect(response.body.items.length).toBe(7);
      });
    });

    describe('Sorting tests', () => {
      beforeAll(async () => {
        await request(app).delete('/testing/all-data').expect(204);

        // Create blogs with specific names and delays to ensure different createdAt
        await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            name: 'Zebra Blog',
            description: 'Last alphabetically',
            websiteUrl: 'https://zebra.com',
          })
          .expect(201);

        await new Promise((resolve) => setTimeout(resolve, 100));

        await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            name: 'Apple Blog',
            description: 'First alphabetically',
            websiteUrl: 'https://apple.com',
          })
          .expect(201);

        await new Promise((resolve) => setTimeout(resolve, 100));

        await request(app)
          .post('/blogs')
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            name: 'Mango Blog',
            description: 'Middle alphabetically',
            websiteUrl: 'https://mango.com',
          })
          .expect(201);
      });

      it('should sort by createdAt desc by default', async () => {
        const response = await request(app).get('/blogs').expect(200);

        expect(response.body.items.length).toBe(3);
        expect(response.body.items[0].name).toBe('Mango Blog'); // Last created
        expect(response.body.items[2].name).toBe('Zebra Blog'); // First created
      });

      it('should sort by createdAt asc when specified', async () => {
        const response = await request(app)
          .get('/blogs?sortDirection=asc')
          .expect(200);

        expect(response.body.items[0].name).toBe('Zebra Blog'); // First created
        expect(response.body.items[2].name).toBe('Mango Blog'); // Last created
      });

      it('should sort by name desc', async () => {
        const response = await request(app)
          .get('/blogs?sortBy=name&sortDirection=desc')
          .expect(200);

        expect(response.body.items[0].name).toBe('Zebra Blog');
        expect(response.body.items[1].name).toBe('Mango Blog');
        expect(response.body.items[2].name).toBe('Apple Blog');
      });

      it('should sort by name asc', async () => {
        const response = await request(app)
          .get('/blogs?sortBy=name&sortDirection=asc')
          .expect(200);

        expect(response.body.items[0].name).toBe('Apple Blog');
        expect(response.body.items[1].name).toBe('Mango Blog');
        expect(response.body.items[2].name).toBe('Zebra Blog');
      });

      it('should sort by description desc', async () => {
        const response = await request(app)
          .get('/blogs?sortBy=description&sortDirection=desc')
          .expect(200);

        expect(response.body.items[0].description).toBe(
          'Middle alphabetically',
        );
        expect(response.body.items[1].description).toBe('Last alphabetically');
        expect(response.body.items[2].description).toBe('First alphabetically');
      });

      it('should sort by description asc', async () => {
        const response = await request(app)
          .get('/blogs?sortBy=description&sortDirection=asc')
          .expect(200);

        expect(response.body.items[0].description).toBe('First alphabetically');
        expect(response.body.items[1].description).toBe('Last alphabetically');
        expect(response.body.items[2].description).toBe(
          'Middle alphabetically',
        );
      });

      it('should combine sorting with pagination', async () => {
        const response = await request(app)
          .get('/blogs?sortBy=name&sortDirection=asc&pageSize=2')
          .expect(200);

        expect(response.body.items.length).toBe(2);
        expect(response.body.items[0].name).toBe('Apple Blog');
        expect(response.body.items[1].name).toBe('Mango Blog');
      });
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

  describe('POST /blogs/:blogId/posts', () => {
    let testBlogId: string;

    const blogPostInput = {
      title: 'Blog Post Title',
      shortDescription: 'Short description for blog post',
      content: 'Content for the blog post',
    };

    beforeAll(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      // Create a blog for testing
      const blogResponse = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      testBlogId = blogResponse.body.id;
    });

    it('should return 201 and create a new post for specific blog', async () => {
      const response = await request(app)
        .post(`/blogs/${testBlogId}/posts`)
        .set('authorization', VALID_AUTH_HEADER)
        .send(blogPostInput)
        .expect(201);

      // Verify response structure matches PostViewModel from OpenAPI
      expect(response.body).toEqual({
        id: expect.any(String),
        title: blogPostInput.title,
        shortDescription: blogPostInput.shortDescription,
        content: blogPostInput.content,
        blogId: testBlogId,
        blogName: testBlog.name,
        createdAt: expect.any(String),
      });

      // Verify blogId matches the blogId in URL
      expect(response.body.blogId).toBe(testBlogId);

      // Verify blogName is included
      expect(response.body.blogName).toBe(testBlog.name);

      // Verify createdAt is valid ISO 8601 date-time format
      expect(new Date(response.body.createdAt).toISOString()).toBe(
        response.body.createdAt,
      );
    });

    describe('Authorization tests', () => {
      it('should return 401 when authorization header is missing', async () => {
        await request(app)
          .post(`/blogs/${testBlogId}/posts`)
          .send(blogPostInput)
          .expect(401);
      });

      it('should return 401 when authorization credentials are invalid', async () => {
        await request(app)
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', INVALID_AUTH_HEADER)
          .send(blogPostInput)
          .expect(401);
      });
    });

    describe('Validation - title field', () => {
      it('should return 400 if title is missing', async () => {
        const response = await request(app)
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            shortDescription: blogPostInput.shortDescription,
            content: blogPostInput.content,
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
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...blogPostInput,
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

      it('should return 400 if title exceeds maxLength of 30 characters', async () => {
        const response = await request(app)
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...blogPostInput,
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
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...blogPostInput,
            title: 'a'.repeat(30),
          })
          .expect(201);
      });
    });

    describe('Validation - shortDescription field', () => {
      it('should return 400 if shortDescription is missing', async () => {
        const response = await request(app)
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            title: blogPostInput.title,
            content: blogPostInput.content,
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
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...blogPostInput,
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

      it('should return 400 if shortDescription exceeds maxLength of 100 characters', async () => {
        const response = await request(app)
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...blogPostInput,
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
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...blogPostInput,
            shortDescription: 'a'.repeat(100),
          })
          .expect(201);
      });
    });

    describe('Validation - content field', () => {
      it('should return 400 if content is missing', async () => {
        const response = await request(app)
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            title: blogPostInput.title,
            shortDescription: blogPostInput.shortDescription,
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
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...blogPostInput,
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

      it('should return 400 if content exceeds maxLength of 1000 characters', async () => {
        const response = await request(app)
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...blogPostInput,
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
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            ...blogPostInput,
            content: 'a'.repeat(1000),
          })
          .expect(201);
      });
    });

    describe('Not found tests', () => {
      it('should return 404 if specified blog does not exist', async () => {
        await request(app)
          .post('/blogs/507f1f77bcf86cd799439011/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send(blogPostInput)
          .expect(404);
      });

      it('should return 404 for non-existent blog with valid id format', async () => {
        await request(app)
          .post('/blogs/000000000000000000000001/posts')
          .set('authorization', VALID_AUTH_HEADER)
          .send(blogPostInput)
          .expect(404);
      });
    });

    describe('Multiple field validation', () => {
      it('should return 400 with multiple errors for multiple invalid fields', async () => {
        const response = await request(app)
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            title: '',
            shortDescription: '',
            content: '',
          })
          .expect(400);

        expect(response.body.errorsMessages).toHaveLength(3);
        expect(response.body.errorsMessages).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ field: 'title' }),
            expect.objectContaining({ field: 'shortDescription' }),
            expect.objectContaining({ field: 'content' }),
          ]),
        );
      });
    });
  });

  describe('GET /blogs/:blogId/posts', () => {
    let testBlogId: string;

    beforeAll(async () => {
      await request(app).delete('/testing/all-data').expect(204);

      // Create a blog
      const blogResponse = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send(testBlog)
        .expect(201);

      testBlogId = blogResponse.body.id;

      // Create multiple posts for the blog
      for (let i = 1; i <= 15; i++) {
        await request(app)
          .post(`/blogs/${testBlogId}/posts`)
          .set('authorization', VALID_AUTH_HEADER)
          .send({
            title: `Post ${i.toString().padStart(2, '0')}`,
            shortDescription: `Description ${i}`,
            content: `Content ${i}`,
          })
          .expect(201);
      }
    });

    it('should return 200 and paginator with posts for specified blog', async () => {
      const response = await request(app)
        .get(`/blogs/${testBlogId}/posts`)
        .expect(200);

      // Verify Paginator structure
      expect(response.body).toEqual({
        pagesCount: expect.any(Number),
        page: expect.any(Number),
        pageSize: expect.any(Number),
        totalCount: expect.any(Number),
        items: expect.any(Array),
      });

      expect(response.body.totalCount).toBe(15);
      expect(response.body.items.length).toBe(10); // Default pageSize

      // Verify all posts belong to the specified blog
      response.body.items.forEach((post: any) => {
        expect(post.blogId).toBe(testBlogId);
        expect(post.blogName).toBe(testBlog.name);
      });
    });

    it('should return empty items for blog without posts', async () => {
      // Create another blog without posts
      const emptyBlogResponse = await request(app)
        .post('/blogs')
        .set('authorization', VALID_AUTH_HEADER)
        .send({
          name: 'Empty Blog',
          description: 'Blog without posts',
          websiteUrl: 'https://emptyblog.com',
        })
        .expect(201);

      const response = await request(app)
        .get(`/blogs/${emptyBlogResponse.body.id}/posts`)
        .expect(200);

      expect(response.body).toEqual({
        pagesCount: 0,
        page: 1,
        pageSize: 10,
        totalCount: 0,
        items: [],
      });
    });

    describe('Pagination tests', () => {
      it('should use default pageSize of 10', async () => {
        const response = await request(app)
          .get(`/blogs/${testBlogId}/posts`)
          .expect(200);

        expect(response.body.pageSize).toBe(10);
        expect(response.body.items.length).toBe(10);
      });

      it('should return correct pageSize when specified', async () => {
        const response = await request(app)
          .get(`/blogs/${testBlogId}/posts?pageSize=5`)
          .expect(200);

        expect(response.body.pageSize).toBe(5);
        expect(response.body.items.length).toBe(5);
      });

      it('should return correct page when pageNumber specified', async () => {
        const response = await request(app)
          .get(`/blogs/${testBlogId}/posts?pageNumber=2`)
          .expect(200);

        expect(response.body.page).toBe(2);
        expect(response.body.items.length).toBe(5); // Remaining items
      });

      it('should correctly calculate pagesCount', async () => {
        const response = await request(app)
          .get(`/blogs/${testBlogId}/posts?pageSize=10`)
          .expect(200);

        expect(response.body.totalCount).toBe(15);
        expect(response.body.pagesCount).toBe(2); // 15 / 10 = 2 pages
      });

      it('should handle pageSize of 20 (maximum)', async () => {
        const response = await request(app)
          .get(`/blogs/${testBlogId}/posts?pageSize=20`)
          .expect(200);

        expect(response.body.pageSize).toBe(20);
        expect(response.body.items.length).toBe(15); // All 15 posts
        expect(response.body.pagesCount).toBe(1);
      });
    });

    describe('Sorting tests', () => {
      it('should sort by createdAt desc by default', async () => {
        const response = await request(app)
          .get(`/blogs/${testBlogId}/posts`)
          .expect(200);

        const titles = response.body.items.map((post: any) => post.title);
        expect(titles[0]).toBe('Post 15'); // Last created
      });

      it('should sort by createdAt asc when specified', async () => {
        const response = await request(app)
          .get(`/blogs/${testBlogId}/posts?sortDirection=asc`)
          .expect(200);

        const titles = response.body.items.map((post: any) => post.title);
        expect(titles[0]).toBe('Post 01'); // First created
      });

      it('should sort by title desc', async () => {
        const response = await request(app)
          .get(`/blogs/${testBlogId}/posts?sortBy=title&sortDirection=desc`)
          .expect(200);

        const titles = response.body.items.map((post: any) => post.title);
        // Titles should be in descending order
        for (let i = 0; i < titles.length - 1; i++) {
          expect(titles[i] >= titles[i + 1]).toBe(true);
        }
      });

      it('should sort by title asc', async () => {
        const response = await request(app)
          .get(`/blogs/${testBlogId}/posts?sortBy=title&sortDirection=asc`)
          .expect(200);

        const titles = response.body.items.map((post: any) => post.title);
        // Titles should be in ascending order
        for (let i = 0; i < titles.length - 1; i++) {
          expect(titles[i] <= titles[i + 1]).toBe(true);
        }
      });
    });

    describe('Not found tests', () => {
      it('should return 404 if specified blog does not exist', async () => {
        await request(app)
          .get('/blogs/507f1f77bcf86cd799439011/posts')
          .expect(404);
      });

      it('should return 404 for non-existent blog with valid id format', async () => {
        await request(app)
          .get('/blogs/000000000000000000000001/posts')
          .expect(404);
      });
    });
  });
});
