import { Router } from 'express';
import { db } from '../../bd';

export const testingRouter: Router = Router();

testingRouter.delete('', (req, res) => {
  db.blogs = [];
  db.posts = [];
  res.sendStatus(204);
});
