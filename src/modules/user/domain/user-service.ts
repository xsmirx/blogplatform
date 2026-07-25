import { randomUUID } from 'node:crypto';
import type { BcryptAdapter } from '../../../core/adapters/bcrypt-adapter';
import type { UserRepository } from './user-accessor.interface';
import {
  NotFoundError,
  UniqueConstraintError,
} from '../../../core/errors/domain-errors';
import type { CreateUserInput } from './types';

export class UserService {
  private readonly userRepository: UserRepository;
  private readonly bcryptService: BcryptAdapter;

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
