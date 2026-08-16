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
import { randomUUID } from 'crypto';
import { emailExamples } from '../../../core/adapters/email-adapter/email-examples';

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
    const isExist = await this.recoveryUserAcessor.findByEmail(email);
    if (!isExist) {
      return;
    }

    const recoveryCode = randomUUID();
    await this.recoveryRepository.create(recoveryCode);

    await this.mailAdapter
      .sendEmail(email, recoveryCode, emailExamples.passwordRecoveryEmail)
      .catch((e) => console.error(e));
  }
}
