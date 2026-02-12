import { body, param, query } from 'express-validator';
import { PaginationQueryKey } from '../../core/types/pagiation-query-key';
import { PostSortField } from './types';
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

export const pageNumberValidation = query(PaginationQueryKey.pageNumber)
  .default(1)
  .isInt({ min: 1 })
  .withMessage('Page number must be an integer greater than 0')
  .toInt();

export const pageSizeValidation = query(PaginationQueryKey.pageSize)
  .default(10)
  .toInt()
  .customSanitizer((value) => {
    if (value > 20) {
      return 20;
    }
    return value;
  });

const allowedSortFields = Object.values(PostSortField);
export const sortByValidation = query(SortQueryKey.sortBy)
  .default(PostSortField.createdAt)
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

export const titleValidation = body('title')
  .exists()
  .withMessage('Title is required')
  .isString()
  .trim()
  .withMessage('Title must be a string')
  .isLength({ min: 1, max: 30 })
  .withMessage('Title must be between 1 and 30 characters');

export const shortDescriptionValidation = body('shortDescription')
  .exists()
  .withMessage('Short description is required')
  .isString()
  .trim()
  .withMessage('Short description must be a string')
  .isLength({ min: 1, max: 100 })
  .withMessage('Short description must be between 1 and 100 characters');

export const contentValidation = body('content')
  .exists()
  .withMessage('Content is required')
  .isString()
  .trim()
  .withMessage('Content must be a string')
  .isLength({ min: 1, max: 1000 })
  .withMessage('Content must be between 1 and 1000 characters');

export const blogIdValidation = body('blogId')
  .exists()
  .withMessage('Blog ID is required')
  .isString()
  .trim()
  .withMessage('Blog ID must be a string')
  .isLength({ min: 1 })
  .withMessage('Blog ID must not be empty')
  .isMongoId()
  .withMessage('Blog ID must be a valid Mongo ID');

export const postDTOValidation = [
  titleValidation,
  shortDescriptionValidation,
  contentValidation,
  blogIdValidation,
];
