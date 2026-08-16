import { inject, injectable } from 'inversify';
import { RecoveryRepository } from '../domain/ports/recovery-repository.interface';
import { DatabaseConnection } from '../../../bd/mongo.db';
import { Recovery } from '../domain/types';
import { WithId } from 'mongodb';
import { RecoveryDB } from './types';

@injectable()
export class MongoRecoveryRepository implements RecoveryRepository {
  constructor(
    @inject(DatabaseConnection)
    protected readonly databaseConnection: DatabaseConnection,
  ) {}

  private get collection() {
    return this.databaseConnection.getCollections().recoveryCollection;
  }

  private mapToDomainModel(recovery: WithId<RecoveryDB>): Recovery {
    return {
      id: recovery._id.toString(),
      userId: recovery.userId,
      email: recovery.email,
      code: recovery.code,
      expiresAt: recovery.expiresAt,
    };
  }

  public async findByCode(code: string): Promise<Recovery | null> {
    const result = await this.collection.findOne({
      code,
      expiresAt: { $gte: new Date() },
    });
    if (!result) {
      return null;
    }
    return this.mapToDomainModel(result);
  }

  public async create(input: {
    code: string;
    userId: string;
    email: string;
  }): Promise<string> {
    const result = await this.collection.insertOne({
      code: input.code,
      email: input.email,
      userId: input.userId,
      expiresAt: new Date(),
    });
    return result.insertedId.toString();
  }
}
