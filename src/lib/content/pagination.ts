export type PaginatedResult<T> = Readonly<{
  items: readonly T[];
  currentPage: number;
  totalPages: number;
}>;

export function paginate<T>(
  items: readonly T[],
  requestedPage: number,
  pageSize: number,
): PaginatedResult<T> | null {
  if (
    !Number.isInteger(requestedPage) ||
    requestedPage < 1 ||
    !Number.isInteger(pageSize) ||
    pageSize < 1
  ) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  if (requestedPage > totalPages) {
    return null;
  }

  const start = (requestedPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    currentPage: requestedPage,
    totalPages,
  };
}

export function parsePathPage(pageSegments: readonly string[] | undefined) {
  if (!pageSegments || pageSegments.length === 0) {
    return 1;
  }

  if (pageSegments.length !== 1 || !/^[1-9]\d*$/.test(pageSegments[0])) {
    return null;
  }

  return Number(pageSegments[0]);
}
