import { Router } from 'express';
import { loginUserHandler } from './auth-handlers';

export const authRouter: Router = Router();

authRouter.post('/login', loginUserHandler);
