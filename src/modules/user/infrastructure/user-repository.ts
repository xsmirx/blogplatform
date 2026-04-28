import { ObjectId } from 'mongodb';
import { NotFoundError, ValidationError } from '../../../core/errors/errors';
import { DatabaseConnection } from '../../../bd/mongo.db';
import { User } from '../domain/types';
import { CheckUserExistsPayload, CreateUserPayload } from './types';

export class UserRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

  private get collection() {
    return this.databaseConnection.getCollections().usersCollection;
  }

  public async findById(userId: string): Promise<User | null> {
    const user = await this.collection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return null;
    }
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

  public async findByIdOrFail(userId: string): Promise<User> {
    const user = await this.collection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new NotFoundError('User not found');
    }
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

  public async findByLoginOrEmail(loginOrEmail: string): Promise<User | null> {
    const user = await this.collection.findOne({
      $or: [{ email: loginOrEmail.toLowerCase() }, { login: loginOrEmail }],
    });
    if (!user) {
      return null;
    }
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

  public async findByConfirmationCode(code: string): Promise<User | null> {
    const user = await this.collection.findOne({
      'emailConfirmation.confirmationCode': code,
    });
    if (!user) {
      return null;
    }
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

  public async checkUserExists(payload: CheckUserExistsPayload): Promise<void> {
    const userByEmail = await this.collection.findOne({ email: payload.email });
    if (userByEmail) {
      throw new ValidationError('email', 'email should be unique');
    }

    const userByLogin = await this.collection.findOne({ login: payload.login });
    if (userByLogin) {
      throw new ValidationError('login', 'login should be unique');
    }
  }

  async doesExistByLoginOrEmail({
    login,
    email,
  }: {
    login: string;
    email: string;
  }): Promise<'login' | 'email' | null> {
    const userByLogin = await this.collection.findOne({ login });
    if (userByLogin) return 'login';

    const userByEmail = await this.collection.findOne({ email });
    if (userByEmail) return 'email';

    return null;
  }

  public async create(payload: CreateUserPayload) {
    const result = await this.collection.insertOne({
      login: payload.login,
      email: payload.email,
      passwordHash: payload.passwordHash,
      createdAt: payload.createdAt,
      emailConfirmation: {
        confirmationCode: payload.emailConfirmation.confirmationCode,
        expirationDate: payload.emailConfirmation.expirationDate,
        isConfirmed: payload.emailConfirmation.isConfirmed,
      },
    });
    return result.insertedId.toString();
  }

  public async updateEmailConfirmation({
    userId,
    confirmationCode,
    expirationDate,
    isConfirmed,
  }: {
    userId: string;
    confirmationCode: string;
    expirationDate: Date;
    isConfirmed: boolean;
  }): Promise<void> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          'emailConfirmation.confirmationCode': confirmationCode,
          'emailConfirmation.expirationDate': expirationDate,
          'emailConfirmation.isConfirmed': isConfirmed,
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundError('User not found');
    }
  }

  public async delete(userId: string): Promise<void> {
    const result = await this.collection.deleteOne({
      _id: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError('User not found');
    }
  }
}
