import { inject, injectable } from 'inversify';
import { RecoveryRepository } from '../domain/ports/recovery-repository.interface';
import { Recovery } from '../domain/types';
import { RECOVERY_MODEL } from './recovery-model';
import { Model } from 'mongoose';
import { RecoveryDocument, RecoveryInput } from './types';

@injectable()
export class MongoRecoveryRepository implements RecoveryRepository {
  constructor(
    @inject(RECOVERY_MODEL)
    protected readonly recoveryModel: Model<RecoveryInput>,
  ) {}

  private mapToDomainModel(recovery: RecoveryDocument): Recovery {
    return {
      id: recovery.id,
      userId: recovery.userId.toString(),
      email: recovery.email,
      code: recovery.code.toString(),
      expiresAt: recovery.expiresAt,
    };
  }

  public async findByCode(code: string): Promise<Recovery | null> {
    const result = await this.recoveryModel.findOne({
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
    const result = await this.recoveryModel.create({
      code: input.code,
      email: input.email,
      userId: input.userId,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    return result.id;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.recoveryModel.findByIdAndDelete(id);
    return result !== null;
  }
}
