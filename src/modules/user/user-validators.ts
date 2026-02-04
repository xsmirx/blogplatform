import { body, param, query } from 'express-validator';
import { PaginationQueryKey } from '../../core/types/pagiation-query-key';
import { UserSortField } from './types';
import { SortQueryKey } from '../../core/types/sort-query-key';
import { SortDirection } from '../../core/types/sort-deriction';

export const idValidation = param('id')
  .exists()
  .withMessage('ID is required')
  .isString()
  .trim()
  .withMessage('ID must be a string')
  .isLength({ min: 1 })
  .withMessage('ID must not be empty')
  .isMongoId();

export const searchLoginTermValidation = query('searchLoginTerm').optional();

export const searchEmailTermValidation = query('searchEmailTerm').optional();

export const pageNumberValidation = query(PaginationQueryKey.pageNumber)
  .default(1)
  .isInt({ min: 1 })
  .withMessage('Page number must be an integer greater than 0')
  .toInt();

export const pageSizeValidation = query(PaginationQueryKey.pageSize)
  .default(10)
  .isInt({ min: 1, max: 100 })
  .withMessage('Page size must be between 1 and 100')
  .toInt();

const allowedSortFields = Object.values(UserSortField);
export const sortByValidation = query(SortQueryKey.sortBy)
  .default(UserSortField.createdAt)
  .isIn(allowedSortFields)
  .withMessage(
    `Invalid sort field. Allowed values: ${allowedSortFields.join(', ')}`,
  );

const allowedSortDirections = Object.values(SortDirection);
export const sortDirectionValidation = query(SortQueryKey.sortDirection)
  .default(SortDirection.desc)
  .isIn(allowedSortDirections)
  .withMessage(
    `Sort direction must be one of: ${allowedSortDirections.join(', ')}`,
  );

export const loginValidation = body('login')
  .isString()
  .withMessage('Login must be a string')
  .trim()
  .isLength({ min: 3, max: 10 })
  .withMessage('Login must be between 3 and 10 characters long')
  .matches(/^[a-zA-Z0-9_-]*$/)
  .withMessage(
    'Login must contain only letters, numbers, underscores, or hyphens',
  );

export const passwordValidation = body('password')
  .isString()
  .withMessage('Password must be a string')
  .trim()
  .isLength({ min: 6, max: 20 })
  .withMessage('Password must be between 6 and 20 characters long');

export const emailValidation = body('email')
  .isString()
  .withMessage('Email must be a string')
  .isEmail()
  .withMessage('Email must be a valid email address');
