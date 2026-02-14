import { Router } from 'express';
import { databaseConnection } from '../../bd/mongo.db';
import {
  BLOGS_COLLECTION_NAME,
  COMMENTS_COLLECTION_NAME,
  POSTS_COLLECTION_NAME,
  USERS_COLLECTION_NAME,
} from '../../core/repositories/collections';

export const testingRouter: Router = Router();

testingRouter.delete('/', async (req, res) => {
  await databaseConnection
    .getDb()
    .collection(USERS_COLLECTION_NAME)
    .deleteMany({});
  await databaseConnection
    .getDb()
    .collection(BLOGS_COLLECTION_NAME)
    .deleteMany({});
  await databaseConnection
    .getDb()
    .collection(POSTS_COLLECTION_NAME)
    .deleteMany({});
  await databaseConnection
    .getDb()
    .collection(COMMENTS_COLLECTION_NAME)
    .deleteMany({});
  res.sendStatus(204);
});
