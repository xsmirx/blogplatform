import { Router } from 'express';

export const testingRouter: Router = Router();

testingRouter.delete('', (req, res) => {
  // db.blogs = [];
  // db.posts = [];
  res.sendStatus(204);
});
