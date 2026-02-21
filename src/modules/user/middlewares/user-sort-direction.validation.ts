import { query } from 'express-validator';
import { SortDirection } from '../../../core/types/sort-deriction';
import { SortQueryKey } from '../../../core/types/sort-query-key';

const allowedSortDirections = Object.values(SortDirection);
export const sortDirectionValidation = query(SortQueryKey.sortDirection)
  .default(SortDirection.desc)
  .isIn(allowedSortDirections)
  .withMessage(
    `Sort direction must be one of: ${allowedSortDirections.join(', ')}`,
  );
