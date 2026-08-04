import { RateLimitError } from '../../../core/errors/api-errors';
import { LogRepository } from './log-repository.interface';
import { CheckAndRegisterRequestInput } from './types';

export class RateLimitingService {
  private readonly logRepository: LogRepository;
  constructor(deps: { logRepository: LogRepository }) {
    this.logRepository = deps.logRepository;
  }

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
