import type { User } from '../domain/types';
import type { UserDocument, UserInput } from './types';
import type { UserRepository } from '../domain/user-repository.interface';
import { AuthUserAccessor } from '../../auth/domain/ports/auth-user-accessor.interface';
import { RegistrationUserAccessor } from '../../registration/domain/ports/reistration-user-accessor.interface';
import { inject, injectable } from 'inversify';
import { RecoveryUserAccessor } from '../../recovery/domain/ports/recovery-user-repository.interface';
import { USER_MODEL } from './user-model';
import { Model } from 'mongoose';

@injectable()
export class MongoUserRepository
  implements
    UserRepository,
    AuthUserAccessor,
    RegistrationUserAccessor,
    RecoveryUserAccessor
{
  constructor(
    @inject(USER_MODEL)
    protected readonly userModel: Model<UserInput>,
  ) {}

  private mapToDomainModel(user: UserDocument): User {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      emailConfirmation: {
        confirmationCode: user.emailConfirmation.confirmationCode.toString(),
        expirationDate: user.emailConfirmation.expirationDate,
        isConfirmed: user.emailConfirmation.isConfirmed,
      },
    };
  }

  public async findById(userId: string): Promise<User | null> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      return null;
    }
    return this.mapToDomainModel(user);
  }

  public async findByLogin(login: string): Promise<User | null> {
    const user = await this.userModel.findOne({ login });
    if (!user) {
      return null;
    }
    return this.mapToDomainModel(user);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      return null;
    }
    return this.mapToDomainModel(user);
  }

  public async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    const user = await this.userModel.findOne({
      $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
    });
    if (!user) {
      return null;
    }
    return this.mapToDomainModel(user);
  }

  public async findByCode(code: string): Promise<User | null> {
    const user = await this.userModel.findOne({
      'emailConfirmation.confirmationCode': code,
    });
    if (!user) {
      return null;
    }
    return this.mapToDomainModel(user);
  }

  public async create(user: Omit<User, 'id' | 'createdAt'>): Promise<string> {
    const result = await this.userModel.create({
      login: user.login,
      email: user.email,
      passwordHash: user.passwordHash,
      emailConfirmation: {
        confirmationCode: user.emailConfirmation.confirmationCode,
        expirationDate: user.emailConfirmation.expirationDate,
        isConfirmed: user.emailConfirmation.isConfirmed,
      },
    });
    return result.id;
  }

  public async updateEmailConfirmation(
    userId: string,
    confirmation: Partial<User['emailConfirmation']>,
  ): Promise<boolean> {
    const setFields: Record<string, unknown> = {};

    if (confirmation.confirmationCode !== undefined)
      setFields['emailConfirmation.confirmationCode'] =
        confirmation.confirmationCode;
    if (confirmation.expirationDate !== undefined)
      setFields['emailConfirmation.expirationDate'] =
        confirmation.expirationDate;
    if (confirmation.isConfirmed !== undefined)
      setFields['emailConfirmation.isConfirmed'] = confirmation.isConfirmed;

    const result = await this.userModel
      .findByIdAndUpdate(userId)
      .set(setFields);

    return result !== null;
  }

  public async updatePasswordHash(
    id: string,
    passwordHash: string,
  ): Promise<boolean> {
    const result = await this.userModel
      .findByIdAndUpdate(id)
      .set({ passwordHash });
    return result !== null;
  }

  public async delete(userId: string): Promise<boolean> {
    const result = await this.userModel.findByIdAndDelete(userId);
    return result !== null;
  }
}
