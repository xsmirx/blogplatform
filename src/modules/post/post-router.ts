import { Router } from 'express';
import {
  createPostHandler,
  deletePostHandler,
  getPostHandler,
  getPostListHandler,
  updatePostHandler,
} from './post-handlers';

export const postRouter: Router = Router();

postRouter
  .get('/', getPostListHandler)
  .get('/:id', getPostHandler)
  .post('/', createPostHandler)
  .put('/:id', updatePostHandler)
  .delete('/:id', deletePostHandler);
