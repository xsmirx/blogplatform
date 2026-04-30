import { randomUUID } from 'node:crypto';
import type { BcryptService } from '../../../core/adapters/bcript-service';
import type { UserRepository } from './user-repository.interface';
import { NotFoundError, ValidationError } from '../../../core/errors/errors';
import type { CreateUserInput } from './types';

export class UserService {
  private readonly userRepository: UserRepository;
  private readonly bcryptService: BcryptService;

  constructor(deps: {
    userRepository: UserRepository;
    bcryptService: BcryptService;
  }) {
    this.userRepository = deps.userRepository;
    this.bcryptService = deps.bcryptService;
  }

  public async createUser(user: CreateUserInput): Promise<string> {
    const byLoginResult = await this.userRepository.findByLogin(user.login);
    if (byLoginResult)
      throw new ValidationError('login', 'Login already exists');

    const byEmailResult = await this.userRepository.findByEmail(user.email);
    if (byEmailResult)
      throw new ValidationError('email', 'Email already exists');

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
