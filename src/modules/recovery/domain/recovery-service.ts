import { inject, injectable } from 'inversify';
import {
  RECOVERY_REPOSITORY,
  type RecoveryRepository,
} from './ports/recovery-repository.interface';
import { MailAdapter } from '../../../core/adapters/email-adapter/mail-adapter';
import {
  RECOVERY_USER_REPOSITORY,
  type RecoveryUserAccessor,
} from './ports/recovery-user-repository.interface';

@injectable()
export class RecoveryService {
  constructor(
    @inject(RECOVERY_REPOSITORY)
    protected readonly recoveryRepository: RecoveryRepository,
    @inject(RECOVERY_USER_REPOSITORY)
    protected readonly recoveryUserAcessor: RecoveryUserAccessor,
    @inject(MailAdapter) protected readonly mailAdapter: MailAdapter,
  ) {}

  public async recoveryPassword(email: string): Promise<void> {
    const result = await this.recoveryUserAcessor.findByEmail(email);
    if (!result) {
      return;
    }
  }
}
