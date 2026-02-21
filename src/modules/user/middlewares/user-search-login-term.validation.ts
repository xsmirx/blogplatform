import { query } from 'express-validator';

export const searchLoginTermValidation = query('searchLoginTerm').optional();
