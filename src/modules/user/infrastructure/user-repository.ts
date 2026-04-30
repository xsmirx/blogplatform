import { ObjectId, type WithId } from 'mongodb';
import { DatabaseConnection } from '../../../bd/mongo.db';
import type { User } from '../domain/types';
import type { UserDB } from './types';
import type { UserRepository } from '../domain/user-repository.interface';

export class MongoUserRepository implements UserRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

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

  // public async findByConfirmationCode(code: string): Promise<User | null> {
  //   const user = await this.collection.findOne({
  //     'emailConfirmation.confirmationCode': code,
  //   });
  //   if (!user) {
  //     return null;
  //   }
  //   return {
  //     id: user._id.toString(),
  //     login: user.login,
  //     email: user.email,
  //     passwordHash: user.passwordHash,
  //     createdAt: user.createdAt,
  //     emailConfirmation: {
  //       confirmationCode: user.emailConfirmation.confirmationCode,
  //       expirationDate: user.emailConfirmation.expirationDate,
  //       isConfirmed: user.emailConfirmation.isConfirmed,
  //     },
  //   };
  // }

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

  // public async updateEmailConfirmation({
  //   userId,
  //   confirmationCode,
  //   expirationDate,
  //   isConfirmed,
  // }: {
  //   userId: string;
  //   confirmationCode: string;
  //   expirationDate: Date;
  //   isConfirmed: boolean;
  // }): Promise<void> {
  //   const result = await this.collection.updateOne(
  //     { _id: new ObjectId(userId) },
  //     {
  //       $set: {
  //         'emailConfirmation.confirmationCode': confirmationCode,
  //         'emailConfirmation.expirationDate': expirationDate,
  //         'emailConfirmation.isConfirmed': isConfirmed,
  //       },
  //     },
  //   );

  //   if (result.matchedCount === 0) {
  //     throw new NotFoundError('User not found');
  //   }
  // }

  public async delete(userId: string): Promise<boolean> {
    const result = await this.collection.deleteOne({
      _id: new ObjectId(userId),
    });
    return result.deletedCount > 0;
  }
}
