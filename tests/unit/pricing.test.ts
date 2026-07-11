/**
 * Business Logic: Calculate total trip price
 */
export const calculateTotalPrice = (
  basePrice: number, 
  variantDelta: number = 0, 
  addonTotal: number = 0, 
  taxRate: number = 0.05
) => {
  const subtotal = basePrice + variantDelta + addonTotal;
  const tax = subtotal * taxRate;
  return Math.round(subtotal + tax);
};

describe('Unit Tests: Pricing Logic', () => {
  it('should calculate base price with default 5% tax', () => {
    expect(calculateTotalPrice(1000)).toBe(1050);
  });

  it('should include variant price adjustments', () => {
    // 1000 base + 500 variant = 1500. 1500 * 1.05 = 1575
    expect(calculateTotalPrice(1000, 500)).toBe(1575);
  });

  it('should include addons', () => {
    // 1000 base + 200 variant + 300 addons = 1500. 1500 * 1.05 = 1575
    expect(calculateTotalPrice(1000, 200, 300)).toBe(1575);
  });

  it('should handle custom tax rates', () => {
    // 1000 + 18% tax = 1180
    expect(calculateTotalPrice(1000, 0, 0, 0.18)).toBe(1180);
  });

  it('should handle zero price edge case', () => {
    expect(calculateTotalPrice(0)).toBe(0);
  });
});
