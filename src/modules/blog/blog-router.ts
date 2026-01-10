import { Router } from 'express';
import {
  createBlogHandler,
  deleteBlogHandler,
  getBlogHandler,
  getBlogListHandler,
  updateBlogHandler,
} from './blog-handlers';

export const blogRouter: Router = Router();

blogRouter
  .get('/', getBlogListHandler)
  .get('/:id', getBlogHandler)
  .post('/', createBlogHandler)
  .put('/:id', updateBlogHandler)
  .delete('/:id', deleteBlogHandler);
