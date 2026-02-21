import { query } from 'express-validator';
import { PaginationQueryKey } from '../../../core/types/pagiation-query-key';

export const pageNumberValidation = query(PaginationQueryKey.pageNumber)
  .default(1)
  .isInt({ min: 1 })
  .withMessage('Page number must be an integer greater than 0')
  .toInt();
