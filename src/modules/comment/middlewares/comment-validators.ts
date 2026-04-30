import { body, param, query } from 'express-validator';
import { CommentSortField } from '../api/types';
import { SortQueryKey } from '../../../core/types/sort-query-key';
import { SortDirection } from '../../../core/types/sort-deriction';
import { PaginationQueryKey } from '../../../core/types/pagiation-query-key';

export const idValidation = param('id')
  .isString()
  .withMessage('Comment id must be a string')
  .notEmpty()
  .withMessage('Comment id is required')
  .isMongoId()
  .withMessage('Comment id must be a valid MongoDB ObjectId');

export const postIdValidation = param('postId')
  .isString()
  .withMessage('Post id must be a string')
  .notEmpty()
  .withMessage('Post id is required')
  .isMongoId()
  .withMessage('Post id must be a valid MongoDB ObjectId');

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

export const commentContentValidation = body('content')
  .exists()
  .withMessage('Content is required')
  .isString()
  .withMessage('Content must be a string')
  .trim()
  .isLength({ min: 20, max: 300 })
  .withMessage('Content must be between 20 and 300 characters');
