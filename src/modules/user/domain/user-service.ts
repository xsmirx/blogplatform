import { randomUUID } from 'node:crypto';
import { BcryptAdapter } from '../../../core/adapters/bcrypt-adapter';
import {
  USER_REPOSITORY,
  type UserRepository,
} from './user-repository.interface';
import {
  NotFoundError,
  UniqueConstraintError,
} from '../../../core/errors/domain-errors';
import type { CreateUserInput } from './types';
import { inject, injectable } from 'inversify';

@injectable()
export class UserService {
  @inject(USER_REPOSITORY) private readonly userRepository: UserRepository;
  @inject(BcryptAdapter) private readonly bcryptService: BcryptAdapter;

  constructor(deps: {
    userRepository: UserRepository;
    bcryptAdapter: BcryptAdapter;
  }) {
    this.userRepository = deps.userRepository;
    this.bcryptService = deps.bcryptAdapter;
  }

  public async createUser(user: CreateUserInput): Promise<string> {
    const byLoginResult = await this.userRepository.findByLogin(user.login);
    if (byLoginResult)
      throw new UniqueConstraintError<CreateUserInput>('login', user.login);

    const byEmailResult = await this.userRepository.findByEmail(user.email);
    if (byEmailResult)
      throw new UniqueConstraintError<CreateUserInput>('email', user.email);

    const saltedHash = await this.bcryptService.generateHash(user.password);

    return await this.userRepository.create({
      login: user.login,
      email: user.email,
      passwordHash: saltedHash,
      createdAt: new Date(),
      emailConfirmation: {
        confirmationCode: randomUUID(),
        expirationDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        isConfirmed: false,
      },
    });
  }

  public async deleteUser(userId: string): Promise<void> {
    const result = await this.userRepository.delete(userId);
    if (!result) throw new NotFoundError('User', userId);
  }
}
