import { Router } from 'express';
import { db } from '../../bd';

export const testingRouter: Router = Router();

testingRouter.delete('/all-data', (req, res) => {
  db.blogs = [];
  db.posts = [];
  res.sendStatus(204);
});
