import { inject, injectable } from 'inversify';
import { RateLimitError } from '../../../core/errors/api-errors';
import { LOG_ROPOSITORY, type LogRepository } from './log-repository.interface';
import { CheckAndRegisterRequestInput } from './types';

@injectable()
export class RateLimitingService {
  constructor(
    @inject(LOG_ROPOSITORY) protected readonly logRepository: LogRepository,
  ) {}

  public async checkAndRegisterRequest({
    ip,
    url,
    maxRequests = 5,
    windowMs = 10000,
  }: CheckAndRegisterRequestInput) {
    const sinceDate = new Date(Date.now() - windowMs);
    const count = await this.logRepository.countLogs({ url, ip, sinceDate });

    if (count >= maxRequests) {
      throw new RateLimitError('Too many attemps');
    }

    await this.logRepository.createLog({ url, ip });
  }
}
