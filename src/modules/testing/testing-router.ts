import { Router } from 'express';
import { DatabaseConnection } from '../../bd/mongo.db';
import { Container } from 'inversify';

export const createTestingRouter = (container: Container) => {
  const databaseConnection = container.get(DatabaseConnection);
  const testingRouter: Router = Router();

  testingRouter.delete('/', async (req, res) => {
    await databaseConnection.drop();
    await databaseConnection.initIndexes();
    res.sendStatus(204);
  });

  return testingRouter;
};
