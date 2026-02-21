import { query } from 'express-validator';

export const searchEmailTermValidation = query('searchEmailTerm').optional();
