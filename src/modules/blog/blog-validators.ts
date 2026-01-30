import { body, param, query } from 'express-validator';
import { PaginationQueryKey } from '../../core/types/pagiation-query-key';
import { SortQueryKey } from '../../core/types/sort-query-key';
import { BlogSortField } from './types';
import { SortDirection } from '../../core/types/sort-deriction';

export const idValidation = param('id')
  .exists()
  .withMessage('ID is required')
  .isString()
  .trim()
  .withMessage('ID must be a string')
  .isLength({ min: 1 })
  .withMessage('ID must not be empty')
  .isMongoId()
  .withMessage('ID must be a valid Mongo ID');

export const blogIdValidation = param('blogId')
  .exists()
  .withMessage('Blog ID is required')
  .isString()
  .trim()
  .withMessage('Blog ID must be a string')
  .isLength({ min: 1 })
  .withMessage('Blog ID must not be empty')
  .isMongoId()
  .withMessage('Blog ID must be a valid Mongo ID');

export const searchNameTermValidation = query('searchNameTerm')
  .optional()
  .default(null);

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

const allowedSortFields = Object.values(BlogSortField);
export const sortByValidation = query(SortQueryKey.sortBy)
  .default(BlogSortField.createdAt)
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

export const nameValidation = body('name')
  .exists()
  .withMessage('Name is required')
  .isString()
  .trim()
  .withMessage('Name must be a string')
  .isLength({ min: 1, max: 15 })
  .withMessage('Name must be between 1 and 15 characters');

export const descriptionValidation = body('description')
  .exists()
  .withMessage('Description is required')
  .isString()
  .trim()
  .withMessage('Description must be a string')
  .isLength({ min: 1, max: 500 })
  .withMessage('Description must be between 1 and 500 characters');

export const websiteUrlValidation = body('websiteUrl')
  .exists()
  .withMessage('Website URL is required')
  .isString()
  .trim()
  .withMessage('Website URL must be a string')
  .isLength({ min: 1, max: 100 })
  .withMessage('Website URL must be between 1 and 100 characters')
  .isURL({ protocols: ['https'], require_protocol: true })
  .withMessage('Website URL must be a valid URL');

export const blogDTOValidation = [
  nameValidation,
  descriptionValidation,
  websiteUrlValidation,
];
