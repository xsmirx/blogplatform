import express, { Express } from 'express';
import { blogRouter } from './modules/blog';

export const setupApp = (app: Express) => {
  app.use(express.json()); // middleware для парсинга JSON в теле запроса

  // основной роут
  app.get('/', (req, res) => {
    res.status(200).send('Hello world!');
  });

  app.use('/blogs', blogRouter);

  return app;
};
