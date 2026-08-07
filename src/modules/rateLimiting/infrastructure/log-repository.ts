import { inject, injectable } from 'inversify';
import { DatabaseConnection } from '../../../bd/mongo.db';
import { LogRepository } from '../domain/log-repository.interface';

@injectable()
export class MongoLogRepository implements LogRepository {
  constructor(
    @inject(DatabaseConnection)
    protected readonly databaseConnection: DatabaseConnection,
  ) {}

  private get collection() {
    return this.databaseConnection.getCollections().logCollection;
  }

  public async createLog(input: { url: string; ip: string }): Promise<string> {
    const result = await this.collection.insertOne({
      url: input.url,
      ip: input.ip,
      date: new Date(),
    });

    return result.insertedId.toString();
  }

  public async countLogs(input: {
    url: string;
    ip: string;
    sinceDate: Date;
  }): Promise<number> {
    return this.collection.countDocuments({
      url: input.url,
      ip: input.ip,
      date: { $gte: input.sinceDate },
    });
  }
}
