import { Router } from 'express';
import { databaseConnection } from '../../bd/mongo.db';

export const testingRouter: Router = Router();

testingRouter.delete('/', async (req, res) => {
  await databaseConnection.drop();
  res.sendStatus(204);
});
