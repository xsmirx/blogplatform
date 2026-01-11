import express, { Express } from 'express';
import { blogRouter } from './modules/blog/blog-router';
import { postRouter } from './modules/post/post-router';
import { testingRouter } from './modules/testing/testing-router';

export const setupApp = (app: Express) => {
  app.use(express.json()); // middleware для парсинга JSON в теле запроса

  // основной роут
  app.get('/', (req, res) => {
    res.status(200).send('Hello world!');
  });

  app.use('/blogs', blogRouter);
  app.use('/posts', postRouter);

  app.use('/testing/all-data', testingRouter);

  return app;
};
