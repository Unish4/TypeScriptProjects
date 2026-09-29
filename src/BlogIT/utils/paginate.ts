export interface PaginateOptions {
  page?: number;
  limit?: number;
  maxLimit?: number; // safety cap (default 100)
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const paginate = <T>(
  items: T[],
  options: PaginateOptions = {},
): PaginatedResult<T> => {
  // Defaults — destructure with fallbacks
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(
    options.maxLimit ?? 100,
    Math.max(1, options.limit ?? 10),
  );

  const total = items.length;
  const totalPages = Math.ceil(total / limit);

  const start = (page - 1) * limit;
  const end = start + limit;

  return {
    items: items.slice(start, end),
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};
