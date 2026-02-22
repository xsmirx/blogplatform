import { query } from 'express-validator';
import { SortQueryKey } from '../../../core/types/sort-query-key';
import { UserSortField } from '../infrastructure/types';

const allowedSortFields = Object.values(UserSortField);
export const sortByValidation = query(SortQueryKey.sortBy)
  .default(UserSortField.createdAt)
  .isIn(allowedSortFields)
  .withMessage(
    `Invalid sort field. Allowed values: ${allowedSortFields.join(', ')}`,
  );
