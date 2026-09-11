import { Container } from 'inversify';
import { MongoUserRepository } from './modules/user/infrastructure/user-repository';
import { MongoBlogRepository } from './modules/blog/infrastucture/blog-repository';
import { MongoPostRepository } from './modules/post/infrastructure/post-repository';
import { MongoCommentRepository } from './modules/comment/infrastucture/comment-repository';
import { MongoDeviceRepository } from './modules/security/infrastructure/device-repository';
import { MongoLogRepository } from './modules/rateLimiting/infrastructure/log-repository';
import { MongoRecoveryRepository } from './modules/recovery/infrastuucture/recovery-repository';
import { DEVICE_REPOSITORY } from './modules/security/domain/ports/device-repository.interface';
import { USER_REPOSITORY } from './modules/user/domain/user-repository.interface';
import { BLOG_REPOSITORY } from './modules/blog/domain/blog-repository.interface';
import { POST_REPOSITORY } from './modules/post/domain/post-repository.interface';
import { COMMENT_REPOSITORY } from './modules/comment/domain/comment-repository.interface';
import { LOG_ROPOSITORY } from './modules/rateLimiting/domain/log-repository.interface';
import { REGISTATION_USER_ACESSOR } from './modules/registration/domain/ports/reistration-user-accessor.interface';
import { AUTH_USER_ACCESSOR } from './modules/auth/domain/ports/auth-user-accessor.interface';
import { RECOVERY_REPOSITORY } from './modules/recovery/domain/ports/recovery-repository.interface';
import { RECOVERY_USER_REPOSITORY } from './modules/recovery/domain/ports/recovery-user-repository.interface';
import { BLOG_MODEL, BlogModel } from './modules/blog/infrastucture/blog-model';
import {
  DEVICE_MODEL,
  DeviceModel,
} from './modules/security/infrastructure/device-model';
import {
  POST_MODEL,
  PostModel,
} from './modules/post/infrastructure/post-model';

export const container = new Container({
  autobind: true,
  defaultScope: 'Singleton',
});

container.bind(USER_REPOSITORY).to(MongoUserRepository);
container.bind(DEVICE_REPOSITORY).to(MongoDeviceRepository);
container.bind(BLOG_REPOSITORY).to(MongoBlogRepository);
container.bind(POST_REPOSITORY).to(MongoPostRepository);
container.bind(COMMENT_REPOSITORY).to(MongoCommentRepository);
container.bind(LOG_ROPOSITORY).to(MongoLogRepository);
container.bind(REGISTATION_USER_ACESSOR).to(MongoUserRepository);
container.bind(AUTH_USER_ACCESSOR).to(MongoUserRepository);
container.bind(RECOVERY_REPOSITORY).to(MongoRecoveryRepository);
container.bind(RECOVERY_USER_REPOSITORY).to(MongoUserRepository);

container.bind(BLOG_MODEL).toConstantValue(BlogModel);
container.bind(POST_MODEL).toConstantValue(PostModel);
container.bind(DEVICE_MODEL).toConstantValue(DeviceModel);
