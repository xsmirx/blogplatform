import { PaginationQueryKey } from './pagiation-query-key';
import { SortDirection } from './sort-deriction';
import { SortQueryKey } from './sort-query-key';

export type PaginationAndSorting<S> = {
  [PaginationQueryKey.pageNumber]: number;
  [PaginationQueryKey.pageSize]: number;
  [SortQueryKey.sortBy]: S;
  [SortQueryKey.sortDirection]: SortDirection;
};
