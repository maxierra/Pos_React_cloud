type PageResult<T> = {
  data: T[] | null;
  error: { message: string } | null;
};

type FetchPage<T> = (from: number, to: number) => Promise<PageResult<T>>;

const DEFAULT_PAGE_SIZE = 1000;

export async function fetchAllPages<T>(
  fetchPage: FetchPage<T>,
  pageSize = DEFAULT_PAGE_SIZE
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const to = from + pageSize - 1;
    const { data, error } = await fetchPage(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const page = data ?? [];
    rows.push(...page);

    if (page.length < pageSize) {
      return rows;
    }

    from += pageSize;
  }
}
