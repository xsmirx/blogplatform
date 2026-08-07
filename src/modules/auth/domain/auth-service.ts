import { BcryptAdapter } from '../../../core/adapters/bcrypt-adapter';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter/jwt-adapter';
import { randomUUID } from 'crypto';
import { DeviceService } from '../../security/domain/device-service';
import type { LoginInput, RefreshInput } from './types';
import {
  AUTH_USER_ACCESSOR,
  type AuthUserAccessor,
} from './ports/auth-user-accessor.interface';
import { UnauthorizedError } from '../../../core/errors/domain-errors';
import { inject, injectable } from 'inversify';

@injectable()
export class AuthService {
  constructor(
    @inject(AUTH_USER_ACCESSOR)
    protected readonly userAccessor: AuthUserAccessor,
    @inject(DeviceService) protected readonly deviceService: DeviceService,
    @inject(JwtAdapter) protected readonly jwtAdapter: JwtAdapter,
    @inject(BcryptAdapter) protected readonly bcryptAdapter: BcryptAdapter,
  ) {}

  public async login({
    loginOrEmail,
    password,
    ip,
    deviceName,
  }: LoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.userAccessor.findByLoginOrEmail(loginOrEmail);

    if (!user) {
      throw new UnauthorizedError('Unauthorized');
    }

    const isPassCorrect = await this.bcryptAdapter.checkPassword(
      password,
      user.passwordHash,
    );

    if (!isPassCorrect) {
      throw new UnauthorizedError('Unauthorized');
    }

    const userId = user.id;
    const deviceId = randomUUID();
    const version = randomUUID();

    const {
      accessToken: { token: accessToken },
      refreshToken: { token: refreshToken, exp: generatedExp },
    } = this.jwtAdapter.generateTokenPair({
      userId,
      deviceId,
      version,
    });

    await this.deviceService.createDevice({
      deviceId,
      version,
      userId,
      ip,
      deviceName,
      createdAt: new Date(),
      expiresAt: new Date(generatedExp * 1000),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  public async refresh({
    deviceId,
    version: oldVersion,
    userId,
    ip,
    deviceName,
  }: RefreshInput): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const newVersion = randomUUID();
    const {
      accessToken: { token: accessToken },
      refreshToken: { token: refreshToken, exp: generatedExp },
    } = this.jwtAdapter.generateTokenPair({
      userId,
      deviceId,
      version: newVersion,
    });

    await this.deviceService.updateDevice(
      { id: deviceId, version: oldVersion },
      {
        userId,
        version: newVersion,
        ip,
        deviceName,
        createdAt: new Date(),
        expiresAt: new Date(generatedExp * 1000),
      },
    );

    return { accessToken, refreshToken };
  }

  public async logout({
    deviceId,
    version,
  }: {
    deviceId: string;
    version: string;
  }) {
    await this.deviceService.ensureActiveSession({ deviceId, version });
    await this.deviceService.terminateSession({ deviceId });
  }
}
