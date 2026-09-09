import { ObjectId, type WithId } from 'mongodb';
import { DatabaseConnection } from '../../../db/mongo.db';
import type { User } from '../domain/types';
import type { UserDB } from './types';
import type { UserRepository } from '../domain/user-repository.interface';
import { AuthUserAccessor } from '../../auth/domain/ports/auth-user-accessor.interface';
import { RegistrationUserAccessor } from '../../registration/domain/ports/reistration-user-accessor.interface';
import { inject, injectable } from 'inversify';
import { RecoveryUserAccessor } from '../../recovery/domain/ports/recovery-user-repository.interface';

@injectable()
export class MongoUserRepository
  implements
    UserRepository,
    AuthUserAccessor,
    RegistrationUserAccessor,
    RecoveryUserAccessor
{
  constructor(
    @inject(DatabaseConnection)
    protected readonly databaseConnection: DatabaseConnection,
  ) {}

  private get collection() {
    return this.databaseConnection.getCollections().usersCollection;
  }

  private mapToDomainModel(user: WithId<UserDB>): User {
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      emailConfirmation: {
        confirmationCode: user.emailConfirmation.confirmationCode,
        expirationDate: user.emailConfirmation.expirationDate,
        isConfirmed: user.emailConfirmation.isConfirmed,
      },
    };
  }

  public async findById(userId: string): Promise<User | null> {
    const user = await this.collection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return null;
    }
    return this.mapToDomainModel(user);
  }

  public async findByLogin(login: string): Promise<User | null> {
    const user = await this.collection.findOne({ login });
    if (!user) {
      return null;
    }
    return this.mapToDomainModel(user);
  }

  public async findByEmail(email: string): Promise<User | null> {
    const user = await this.collection.findOne({ email });
    if (!user) {
      return null;
    }
    return this.mapToDomainModel(user);
  }

  public async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    const user = await this.collection.findOne({
      $or: [{ login: loginOrEmail }, { email: loginOrEmail }],
    });
    if (!user) {
      return null;
    }
    return this.mapToDomainModel(user);
  }

  public async findByCode(code: string): Promise<User | null> {
    const user = await this.collection.findOne({
      'emailConfirmation.confirmationCode': code,
    });
    if (!user) {
      return null;
    }
    return this.mapToDomainModel(user);
  }

  public async create(user: Omit<User, 'id'>): Promise<string> {
    const result = await this.collection.insertOne({
      login: user.login,
      email: user.email,
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      emailConfirmation: {
        confirmationCode: user.emailConfirmation.confirmationCode,
        expirationDate: user.emailConfirmation.expirationDate,
        isConfirmed: user.emailConfirmation.isConfirmed,
      },
    });
    return result.insertedId.toString();
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

    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: setFields,
      },
    );

    return result.matchedCount > 0;
  }

  public async updatePasswordHash(
    id: string,
    passwordHash: string,
  ): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { passwordHash } },
    );
    return result.matchedCount > 0;
  }

  public async delete(userId: string): Promise<boolean> {
    const result = await this.collection.deleteOne({
      _id: new ObjectId(userId),
    });
    return result.deletedCount > 0;
  }
}
