import type { SessionRepository } from '../infrastructure/session-repository';

export class SessionService {
  constructor(protected readonly sessionRepository: SessionRepository) {}

  public async createSession() {}
  public async updateSession() {}
  public async deleteSession() {}
}
