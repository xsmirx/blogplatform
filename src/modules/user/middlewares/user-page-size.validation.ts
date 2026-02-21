import { query } from 'express-validator';
import { PaginationQueryKey } from '../../../core/types/pagiation-query-key';

export const pageSizeValidation = query(PaginationQueryKey.pageSize)
  .default(10)
  .toInt()
  .customSanitizer((value) => {
    if (value > 20) {
      return 20;
    }
    return value;
  });
