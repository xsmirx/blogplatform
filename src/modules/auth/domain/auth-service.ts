import { BcryptAdapter } from '../../../core/adapters/bcrypt-adapter';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter/jwt-adapter';
import { randomUUID } from 'crypto';
import type { DeviceService } from '../../security/domain/device-service';
import type { LoginInput, RefreshInput } from './types';
import { AuthUserAccessor } from './ports/auth-user-accessor.interface';
import { UnauthorizedError } from '../../../core/errors/domain-errors';

export class AuthService {
  private readonly userAccessor: AuthUserAccessor;
  private readonly deviceService: DeviceService;
  private readonly jwtAdapter: JwtAdapter;
  private readonly bcryptAdapter: BcryptAdapter;

  constructor(deps: {
    userAccessor: AuthUserAccessor;
    deviceService: DeviceService;
    jwtAdapter: JwtAdapter;
    bcryptAdapter: BcryptAdapter;
  }) {
    this.userAccessor = deps.userAccessor;
    this.deviceService = deps.deviceService;
    this.jwtAdapter = deps.jwtAdapter;
    this.bcryptAdapter = deps.bcryptAdapter;
  }

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

    const {
      accessToken: { token: accessToken },
      refreshToken: {
        token: refreshToken,
        iat: generatedIat,
        exp: generatedExp,
      },
    } = this.jwtAdapter.generateTokenPair({
      userId,
      deviceId,
    });

    await this.deviceService.createDevice({
      deviceId,
      userId,
      ip,
      deviceName,
      createdAt: new Date(generatedIat * 1000),
      expiresAt: new Date(generatedExp * 1000),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  public async refresh({
    deviceId,
    iat,
    userId,
    ip,
    deviceName,
  }: RefreshInput): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const {
      accessToken: { token: accessToken },
      refreshToken: {
        token: refreshToken,
        iat: generatedIat,
        exp: generatedExp,
      },
    } = this.jwtAdapter.generateTokenPair({
      userId,
      deviceId,
    });

    await this.deviceService.updateDevice(
      { id: deviceId, iat },
      {
        userId,
        ip,
        deviceName,
        createdAt: new Date(generatedIat * 1000),
        expiresAt: new Date(generatedExp * 1000),
      },
    );

    return { accessToken, refreshToken };
  }

  public async logout({ deviceId }: { deviceId: string }) {
    await this.deviceService.terminateSession({ deviceId });
  }
}
