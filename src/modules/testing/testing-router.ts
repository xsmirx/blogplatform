import { Router } from 'express';
import { Container } from 'inversify';
import mongoose from 'mongoose';

export const createTestingRouter = (_container: Container) => {
  const testingRouter: Router = Router();

  testingRouter.delete('/', async (req, res) => {
    await mongoose.connection.dropDatabase();
    res.sendStatus(204);
  });

  return testingRouter;
};
