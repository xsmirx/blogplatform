# GEMINI Report: Blog Platform

## Project Overview

This is a TypeScript-based Node.js project that implements a blog platform. It uses the Express framework to create a REST API and MongoDB for the database. The project is structured into modules for blogs and posts, following a clean, modular architecture.

## Building and Running

The following commands are available for building, running, and testing the project:

*   **`pnpm install`**: Install dependencies.
*   **`pnpm build`**: Compiles the TypeScript code to JavaScript.
*   **`pnpm watch`**: Compiles the TypeScript code in watch mode, automatically recompiling on changes.
*   **`pnpm dev`**: Starts the application in development mode with `nodemon`, which automatically restarts the server on file changes.
*   **`pnpm jest`**: Runs the test suite using Jest.
*   **`pnpm lint`**: Lints the codebase using ESLint to enforce code quality.
*   **`pnpm format`**: Formats the code using Prettier to maintain a consistent style.

## Development Conventions

*   **Language**: TypeScript
*   **Framework**: Express.js
*   **Database**: MongoDB
*   **Testing**: Jest
*   **Linting**: ESLint
*   **Formatting**: Prettier

The project follows a modular structure, with features like "blog" and "post" separated into their own directories. Each module contains its own router, service, repository, and validation logic. This separation of concerns makes the codebase easier to understand, maintain, and test.

## Code Examples for Reuse

This section provides code examples from the project to illustrate its architecture. You can use these examples as a template for creating new projects with a similar structure.

### 1. Application Entry Point (`src/index.ts`)

The `bootstrap` function initializes the database connection, creates the Express app, and starts the server.

```typescript
import express from 'express';
import { databaseConnection } from './bd/mongo.db';
import { settings } from './core/settings/settings';
import { setupApp } from './setup-app';

const bootstrap = async () => {
  // connect tot DB
  await databaseConnection.connect({
    mongoURL: settings.MONGO_URL,
    dbName: settings.MONGO_DB_NAME,
  });

  // создание приложения
  const app = express();
  setupApp(app);

  // запуск приложения
  app.listen(settings.PORT, settings.HOST, () => {
    console.log(`Example app listening on port ${settings.PORT}`);
  });
};

bootstrap();
```

### 2. Express App Setup (`src/setup-app.ts`)

The `setupApp` function configures middleware and registers the main application routes.

```typescript
import express, { Express } from 'express';
import { blogRouter } from './modules/blog/blog-router';
import { postRouter } from './modules/post/post-router';
import { testingRouter } from './modules/testing/testing-router';
import { errorHandler } from './core/errors/error.handler';

export const setupApp = (app: Express) => {
  app.use(express.json()); // middleware для парсинга JSON в теле запроса

  // основной роут
  app.get('/', (req, res) => {
    res.status(200).send('Hello world!');
  });

  app.use('/blogs', blogRouter);
  app.use('/posts', postRouter);

  app.use('/testing/all-data', testingRouter);

  app.use(errorHandler);

  return app;
};
```

### 3. Router (`src/modules/blog/blog-router.ts`)

The router defines the API endpoints for a module, chaining together middleware for validation, authorization, and the final request handler.

```typescript
import { Router } from 'express';
import {
  createBlogHandler,
  // ... other handlers
} from './blog-handlers';
import {
  blogDTOValidation,
  // ... other validators
} from './blog-validators';
import { inputValidationResultMiddleware } from '../../core/middleware/input-validation-result.middleware';
import { superAdminGuardMiddleware } from '../auth/super-admin-guard.middleware';

export const blogRouter: Router = Router();

blogRouter
  .get('/', /* ... */)
  .post(
    '/',
    superAdminGuardMiddleware,
    blogDTOValidation,
    inputValidationResultMiddleware,
    createBlogHandler,
  )
  // ... other routes
```

### 4. Service (`src/modules/blog/blog-service.ts`)

The service contains the core business logic, orchestrating calls to the repository and processing data.

```typescript
import { blogRepository } from './blog-repository';
import { Blog, BlogInputDTO, BlogListQueryInput } from './types';

class BlogService {
  public async findMany(query: BlogListQueryInput) {
    return blogRepository.findAll(query);
  }

  public async create(dto: BlogInputDTO) {
    const { name, description, websiteUrl } = dto;

    const newBlog: Blog = {
      name,
      description,
      websiteUrl,
      createdAt: new Date(),
      isMembership: false,
    };
    const id = await blogRepository.create(newBlog);
    return await blogRepository.findByIdOrFail(id.toString());
  }

  // ... other methods
}

export const blogService = new BlogService();
```

### 5. Repository (`src/modules/blog/blog-repository.ts`)

The repository handles all communication with the database, abstracting the data access logic from the rest of the application.

```typescript
import { Collection, ObjectId, WithId } from 'mongodb';
import { databaseConnection } from '../../bd';
import { Blog, BlogListQueryInput } from './types';

class BlogRepository {
  public getCollection(): Collection<Blog> {
    return databaseConnection.getDb().collection<Blog>('blogs');
  }

  public async findAll(query: BlogListQueryInput): Promise<{
    items: WithId<Blog>[];
    totalCount: number;
  }> {
    // ... implementation
  }

  public async create(blog: Blog): Promise<ObjectId> {
    const result = await this.getCollection().insertOne({ ...blog });
    return result.insertedId;
  }

  // ... other methods
}

export const blogRepository = new BlogRepository();
```

### 6. Validators (`src/modules/blog/blog-validators.ts`)

Validators use `express-validator` to define and enforce rules for incoming request data.

```typescript
import { body, param, query } from 'express-validator';
// ...

export const nameValidation = body('name')
  .exists()
  .withMessage('Name is required')
  .isString()
  .trim()
  .withMessage('Name must be a string')
  .isLength({ min: 1, max: 15 })
  .withMessage('Name must be between 1 and 15 characters');

export const blogDTOValidation = [
  nameValidation,
  descriptionValidation,
  websiteUrlValidation,
];
```

### 7. Error Handling (`src/core/errors/error.handler.ts`)

A centralized error handler catches specific error types and sends the appropriate HTTP response.

```typescript
import { ErrorRequestHandler } from 'express';
import { BlogNotFoundError } from '../../modules/blog/blog-errors';
import { PostNotFoundError } from '../../modules/post/post-errors';

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  if (error instanceof BlogNotFoundError) {
    res.status(404).send();
    return;
  }
  if (error instanceof PostNotFoundError) {
    res.status(404).send();
    return;
  }

  res.status(500).send('Internal Server Error');
  return;
};
```