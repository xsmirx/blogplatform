import express, { Express } from 'express';
import { blogRouter } from './modules/blog/blog-router';
import { postRouter } from './modules/post/post-router';
import { testingRouter } from './modules/testing/testing-router';
import { errorHandler } from './core/errors/error.handler';
import { userRouter } from './modules/user/user-router';

export const setupApp = (app: Express) => {
  app.use(express.json()); // middleware для парсинга JSON в теле запроса

  // основной роут
  app.get('/', (req, res) => {
    res.status(200).send('Hello world!');
  });

  app.use('/users', userRouter);
  app.use('/blogs', blogRouter);
  app.use('/posts', postRouter);

  app.use('/testing/all-data', testingRouter);

  app.use(errorHandler);

  return app;
};
