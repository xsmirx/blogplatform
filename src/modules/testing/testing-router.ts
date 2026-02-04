import { Router } from 'express';
import { blogRepository } from '../blog/blog-repository';
import { postRepository } from '../post/post-repository';
import { userRepository } from '../user/user-repository';

export const testingRouter: Router = Router();

testingRouter.delete('/', async (req, res) => {
  await userRepository.collection.deleteMany();
  await blogRepository.getCollection().deleteMany();
  await postRepository.getCollection().deleteMany();
  res.sendStatus(204);
});
