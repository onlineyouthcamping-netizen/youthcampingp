function calculatePagination(pageQuery: any, limitQuery: any, maxLimit = 100, defaultLimit = 25) {
  let page = parseInt(pageQuery, 10);
  let limit = parseInt(limitQuery, 10);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

describe('Unit Tests: Pagination calculations', () => {
  it('should calculate standard page 1 and limit 25 correctly', () => {
    const res = calculatePagination('1', '25');
    expect(res.page).toBe(1);
    expect(res.limit).toBe(25);
    expect(res.skip).toBe(0);
  });

  it('should calculate page 2 and limit 25 correctly', () => {
    const res = calculatePagination('2', '25');
    expect(res.page).toBe(2);
    expect(res.limit).toBe(25);
    expect(res.skip).toBe(25);
  });

  it('should fall back to defaults for invalid strings', () => {
    const res = calculatePagination('abc', 'xyz');
    expect(res.page).toBe(1);
    expect(res.limit).toBe(25);
    expect(res.skip).toBe(0);
  });

  it('should clamp page to minimum 1', () => {
    const res = calculatePagination('0', '25');
    expect(res.page).toBe(1);
    expect(res.skip).toBe(0);

    const resNegative = calculatePagination('-5', '25');
    expect(resNegative.page).toBe(1);
    expect(resNegative.skip).toBe(0);
  });

  it('should clamp limit between 1 and 100', () => {
    const resUnder = calculatePagination('1', '0');
    expect(resUnder.limit).toBe(25); // falls back to default

    const resOver = calculatePagination('1', '150');
    expect(resOver.limit).toBe(100);

    const resMax = calculatePagination('1', '100');
    expect(resMax.limit).toBe(100);
  });
  
  it('should calculate totalPages, hasNextPage and hasPreviousPage metadata correctly', () => {
    const calculateMetadata = (totalCount: number, page: number, limit: number) => {
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;
      return { totalPages, hasNextPage, hasPreviousPage };
    };

    expect(calculateMetadata(0, 1, 25)).toEqual({ totalPages: 0, hasNextPage: false, hasPreviousPage: false });
    expect(calculateMetadata(50, 1, 25)).toEqual({ totalPages: 2, hasNextPage: true, hasPreviousPage: false });
    expect(calculateMetadata(50, 2, 25)).toEqual({ totalPages: 2, hasNextPage: false, hasPreviousPage: true });
  });
});
