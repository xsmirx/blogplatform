import type { RequestHandler } from 'express';
import type { AuthService } from '../../domain/auth-service';

export const createLogoutHandler = ({
  authService,
}: {
  authService: AuthService;
}): RequestHandler => {
  return async (req, res) => {
    const deviceId = req.appContext?.device?.deviceId as string;

    await authService.logout({ deviceId });

    res.clearCookie('refreshToken', { httpOnly: true, secure: true });
    return res.sendStatus(204);
  };
};
