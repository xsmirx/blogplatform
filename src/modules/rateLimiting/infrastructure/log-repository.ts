import { inject, injectable } from 'inversify';
import { LogRepository } from '../domain/log-repository.interface';
import { LOG_MODEL } from './log-model';
import { Model } from 'mongoose';
import { LogInput } from './types';

@injectable()
export class MongoLogRepository implements LogRepository {
  constructor(
    @inject(LOG_MODEL)
    protected readonly logModel: Model<LogInput>,
  ) {}

  public async createLog(input: { url: string; ip: string }): Promise<string> {
    const result = await this.logModel.create({
      url: input.url,
      ip: input.ip,
    });
    return result.id;
  }

  public async countLogs(input: {
    url: string;
    ip: string;
    sinceDate: Date;
  }): Promise<number> {
    return this.logModel.countDocuments({
      url: input.url,
      ip: input.ip,
      createdAt: { $gte: input.sinceDate },
    });
  }
}
