import { randomUUID } from 'node:crypto';
import { bcryptService } from '../../../core/adapters/bcript-service';
import { userRepository } from '../infrastructure/user-repository';

class UserService {
  public async createUser(user: {
    login: string;
    email: string;
    password: string;
  }): Promise<string> {
    await userRepository.checkUserExists({
      email: user.email,
      login: user.login,
    });

    const saltedHash = await bcryptService.generateHash(user.password);

    return await userRepository.create({
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
    await userRepository.delete(userId);
  }
}

export const userService = new UserService();
