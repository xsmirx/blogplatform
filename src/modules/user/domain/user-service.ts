import { randomUUID } from 'node:crypto';
import type { BcryptService } from '../../../core/adapters/bcript-service';
import type { UserRepository } from '../infrastructure/user-repository';

export class UserService {
  private readonly bcryptService: BcryptService;
  private readonly userRepository: UserRepository;

  constructor(deps: {
    bcryptService: BcryptService;
    userRepository: UserRepository;
  }) {
    this.bcryptService = deps.bcryptService;
    this.userRepository = deps.userRepository;
  }

  public async createUser(user: {
    login: string;
    email: string;
    password: string;
  }): Promise<string> {
    await this.userRepository.checkUserExists({
      email: user.email,
      login: user.login,
    });

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
    await this.userRepository.delete(userId);
  }
}
