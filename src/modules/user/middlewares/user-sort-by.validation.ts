import { query } from 'express-validator';
import { UserSortField } from '../types/types';
import { SortQueryKey } from '../../../core/types/sort-query-key';

const allowedSortFields = Object.values(UserSortField);
export const sortByValidation = query(SortQueryKey.sortBy)
  .default(UserSortField.createdAt)
  .isIn(allowedSortFields)
  .withMessage(
    `Invalid sort field. Allowed values: ${allowedSortFields.join(', ')}`,
  );
