import type { RequestHandler } from 'express';
import type { AuthService } from '../../domain/auth-service';

export const createLogoutHandler = ({
  authService,
}: {
  authService: AuthService;
}): RequestHandler => {
  return async (req, res) => {
    const refreshToken = req.cookies.refreshToken as string | undefined;
    if (!refreshToken) {
      return res.sendStatus(401);
    }

    const result = await authService.logout({ refreshToken });

    if (result.status !== 'Success') {
      return res.sendStatus(401);
    }

    res.clearCookie('refreshToken', { httpOnly: true, secure: true });
    return res.sendStatus(204);
  };
};
