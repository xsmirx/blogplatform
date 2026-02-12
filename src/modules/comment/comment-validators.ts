import { body, param, query } from 'express-validator';
import { CommentSortField } from './types';
import { SortQueryKey } from '../../core/types/sort-query-key';
import { SortDirection } from '../../core/types/sort-deriction';

export const commentIdValidation = param('id')
  .isString()
  .withMessage('Comment id must be a string')
  .notEmpty()
  .withMessage('Comment id is required')
  .isMongoId()
  .withMessage('Comment id must be a valid MongoDB ObjectId');

export const commentContentValidation = body('content')
  .exists()
  .withMessage('Content is required')
  .isString()
  .withMessage('Content must be a string')
  .trim()
  .isLength({ min: 20, max: 300 })
  .withMessage('Content must be between 20 and 300 characters');

const allowedSortFields = Object.values(CommentSortField);
export const sortByValidation = query(SortQueryKey.sortBy)
  .default(CommentSortField.createdAt)
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
