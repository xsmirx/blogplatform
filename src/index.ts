import express from 'express';
import { DatabaseConnection } from './bd/mongo.db';
import { settings } from './core/settings/settings';
import { setupApp } from './setup-app';
import { AuthService } from './modules/auth/domain/auth-service';
import { bcryptService } from './core/adapters/bcript-service';
import { jwtService } from './modules/auth/adapters/jwt-service';
import { mailService } from './modules/auth/adapters/mail-service';
import { UserRepository } from './modules/user/infrastructure/user-repository';
import { UserQueryRepository } from './modules/user/infrastructure/user-query-repository';
import { BlackListRefreshTokenRepository } from './modules/auth/infrastructure/black-list-refresk-token-repository';
import { UserService } from './modules/user/domain/user-service';
import { MongoBlogRepository } from './modules/blog/infrastucture/blog-repository';
import { BlogService } from './modules/blog/domain/blog-service';
import { PostRepository } from './modules/post/post-repository';
import { PostService } from './modules/post/post-service';
import { CommentRepository } from './modules/comment/comment-repository';
import { CommentQueryRepository } from './modules/comment/comment-query-repository';
import { CommentService } from './modules/comment/comment-service';

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
  const userQueryRepository = new UserQueryRepository(databaseConnection);
  const blogRepository = new MongoBlogRepository(databaseConnection);
  const postRepository = new PostRepository(databaseConnection);
  const commentRepository = new CommentRepository(databaseConnection);
  const commentQueryRepository = new CommentQueryRepository(databaseConnection);
  const blackListRefreshTokenRepository = new BlackListRefreshTokenRepository(
    databaseConnection,
  );

  // Services
  const userService = new UserService({ bcryptService, userRepository });
  const authService = new AuthService({
    bcryptService,
    jwtService,
    mailService,
    userRepository,
    blackListRefreshTokenRepository,
  });
  const blogService = new BlogService({ blogRepository });
  const postService = new PostService({ blogRepository, postRepository });
  const commentService = new CommentService({
    userRepository,
    commentRepository,
  });

  setupApp(app, {
    authService,
    userService,
    blogService,
    postService,
    commentService,
    userQueryRepository,
    commentQueryRepository,
    databaseConnection,
  });

  // запуск приложения
  app.listen(settings.PORT, settings.HOST, () => {
    console.log(`Example app listening on port ${settings.PORT}`);
  });
};

bootstrap();
