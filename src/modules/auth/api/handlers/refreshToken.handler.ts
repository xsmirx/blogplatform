import type { RequestHandler } from 'express';
import type { AuthService } from '../../domain/auth-service';
import type { LoginOutputDTO } from '../types';

export const createRefreshTokenHandler = ({
  authService,
}: {
  authService: AuthService;
}): RequestHandler<object, LoginOutputDTO> => {
  return async (req, res) => {
    const userId = req.appContext?.user?.userId as string;
    const deviceId = req.appContext?.device?.deviceId as string;
    const version = req.appContext?.device?.version as string;
    const ip = req.ip as string;
    const deviceName = req.headers['user-agent'] || 'unidentified device';

    const { accessToken, refreshToken } = await authService.refresh({
      deviceId,
      version,
      userId,
      ip,
      deviceName,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return res.status(200).send({ accessToken: accessToken });
  };
};
