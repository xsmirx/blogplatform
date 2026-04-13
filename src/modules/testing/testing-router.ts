import { Router } from 'express';
import type { DatabaseConnection } from '../../bd/mongo.db';

export const createTestingRouter = ({
  databaseConnection,
}: {
  databaseConnection: DatabaseConnection;
}) => {
  const testingRouter: Router = Router();

  testingRouter.delete('/', async (req, res) => {
    await databaseConnection.drop();
    res.sendStatus(204);
  });

  return testingRouter;
};
