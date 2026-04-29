import express from 'express';
import { DatabaseConnection } from './bd/mongo.db';
import { settings } from './core/settings/settings';
import { setupApp } from './setup-app';
import { UserRepository } from './modules/user/infrastructure/user-repository';
import { MongoBlogRepository } from './modules/blog/infrastucture/blog-repository';
import { BlogService } from './modules/blog/domain/blog-service';
import { PostService } from './modules/post/domain/post-service';
import { CommentRepository } from './modules/comment/comment-repository';
import { CommentQueryRepository } from './modules/comment/comment-query-repository';
import { CommentService } from './modules/comment/comment-service';
import { BlogQueryRepository } from './modules/blog/infrastucture/blog-query-repository';
import { PostQueryRepository } from './modules/post/infrastructure/post-query-repository';
import { MongoPostRepository } from './modules/post/infrastructure/post-repository';

const bootstrap = async () => {
  // connect to DB
  const databaseConnection = new DatabaseConnection({
    mongoURL: settings.MONGO_URL,
    dbName: settings.MONGO_DB_NAME,
  });
  await databaseConnection.connect();

  // создание приложения
  const app = express();

  // Repositories
  const userRepository = new UserRepository(databaseConnection);
  // const userQueryRepository = new UserQueryRepository(databaseConnection);
  const blogRepository = new MongoBlogRepository(databaseConnection);
  const blogQueryRepository = new BlogQueryRepository(databaseConnection);
  const postRepository = new MongoPostRepository(databaseConnection);
  const postQueryRepository = new PostQueryRepository(databaseConnection);
  const commentRepository = new CommentRepository(databaseConnection);
  const commentQueryRepository = new CommentQueryRepository(databaseConnection);

  // Services
  // const userService = new UserService({ bcryptService, userRepository });
  // const authService = new AuthService({
  //   bcryptService,
  //   jwtService,
  //   mailService,
  //   userRepository,
  // });
  const blogService = new BlogService(blogRepository);
  const postService = new PostService({ blogRepository, postRepository });
  const commentService = new CommentService({
    userRepository,
    commentRepository,
  });

  setupApp(app, {
    // authService,
    // userService,
    // userQueryRepository,
    blogService,
    blogQueryRepository,
    postService,
    postQueryRepository,
    commentService,
    commentQueryRepository,
    databaseConnection,
  });

  // запуск приложения
  app.listen(settings.PORT, settings.HOST, () => {
    console.log(`Example app listening on port ${settings.PORT}`);
  });
};

bootstrap();
