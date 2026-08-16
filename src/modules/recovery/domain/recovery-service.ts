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
import { DomainValidationError } from '../../../core/errors/domain-errors';
import { BcryptAdapter } from '../../../core/adapters/bcrypt-adapter';

@injectable()
export class RecoveryService {
  constructor(
    @inject(RECOVERY_REPOSITORY)
    protected readonly recoveryRepository: RecoveryRepository,
    @inject(RECOVERY_USER_REPOSITORY)
    protected readonly recoveryUserAcessor: RecoveryUserAccessor,
    @inject(MailAdapter) protected readonly mailAdapter: MailAdapter,
    @inject(BcryptAdapter) protected readonly bcryptAdapter: BcryptAdapter,
  ) {}

  public async recoveryPassword(email: string): Promise<void> {
    const user = await this.recoveryUserAcessor.findByEmail(email);
    if (!user) {
      return;
    }

    const recoveryCode = randomUUID();
    await this.recoveryRepository.create({
      code: recoveryCode,
      email,
      userId: user.id,
    });

    await this.mailAdapter
      .sendEmail(email, recoveryCode, emailExamples.passwordRecoveryEmail)
      .catch((e) => console.error(e));
  }

  public async updatePassword(
    recoveryCode: string,
    newPassword: string,
  ): Promise<void> {
    const recovery = await this.recoveryRepository.findByCode(recoveryCode);
    if (!recovery) {
      throw new DomainValidationError(
        'newPasswrdEmail',
        newPassword,
        'recovery code has been expired',
      );
    }

    const passwordHash = await this.bcryptAdapter.generateHash(newPassword);

    await this.recoveryUserAcessor.updatePasswordHash(
      recovery.userId,
      passwordHash,
    );

    await this.recoveryRepository.delete(recovery.id);
  }
}
