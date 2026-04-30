import { query } from 'express-validator';
import { SortQueryKey } from '../../../core/types/sort-query-key';
import { UserSortField } from '../api/types';

const allowedSortFields = Object.values(UserSortField);
export const sortByValidation = query(SortQueryKey.sortBy)
  .default(UserSortField.createdAt)
  .isIn(allowedSortFields)
  .withMessage(
    `Invalid sort field. Allowed values: ${allowedSortFields.join(', ')}`,
  );
