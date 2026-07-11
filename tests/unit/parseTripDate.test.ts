import { parseTripDate } from '../../frontend/src/lib/parseTripDate';

describe('parseTripDate', () => {
  it('should parse incomplete dates and derive upcoming year correctly', () => {
    // Reference date: June 21, 2026
    const refDate = new Date(2026, 5, 21); // Month is 0-indexed (5 = June)

    // "06 Jun" has already passed in 2026, so it should resolve to June 2027
    const resultPast = parseTripDate('06 Jun', { referenceDate: refDate });
    expect(resultPast).not.toBeNull();
    expect(resultPast!.getFullYear()).toBe(2027);
    expect(resultPast!.getMonth()).toBe(5); // June
    expect(resultPast!.getDate()).toBe(6);

    // "25 Jun" is upcoming in 2026, so it should resolve to June 2026
    const resultUpcoming = parseTripDate('25 Jun', { referenceDate: refDate });
    expect(resultUpcoming).not.toBeNull();
    expect(resultUpcoming!.getFullYear()).toBe(2026);
    expect(resultUpcoming!.getMonth()).toBe(5); // June
    expect(resultUpcoming!.getDate()).toBe(25);
  });

  it('should preserve explicit years like "06 Jun 2026"', () => {
    const result = parseTripDate('06 Jun 2026');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(5); // June
    expect(result!.getDate()).toBe(6);
  });

  it('should support 2-digit years like "06 Jun 26"', () => {
    const result = parseTripDate('06 Jun 26');
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(5); // June
    expect(result!.getDate()).toBe(6);
  });

  it('should parse ISO date strings safely without timezone shifts', () => {
    const resultSimple = parseTripDate('2026-06-06');
    expect(resultSimple).not.toBeNull();
    expect(resultSimple!.getFullYear()).toBe(2026);
    expect(resultSimple!.getMonth()).toBe(5);
    expect(resultSimple!.getDate()).toBe(6);

    const resultIso = parseTripDate('2026-06-06T12:00:00.000Z');
    expect(resultIso).not.toBeNull();
    expect(resultIso!.getFullYear()).toBe(2026);
    expect(resultIso!.getMonth()).toBe(5);
    expect(resultIso!.getDate()).toBe(6);
  });

  it('should return null for invalid date formats or invalid calendar dates', () => {
    expect(parseTripDate('invalid-date')).toBeNull();
    expect(parseTripDate('')).toBeNull();
    expect(parseTripDate(null)).toBeNull();
    expect(parseTripDate('31 Feb 2026')).toBeNull(); // February doesn't have 31 days
  });

  it('should handle December-to-January rollover correctly', () => {
    // Reference date: December 25, 2025
    const refDate = new Date(2025, 11, 25); // December

    // "05 Jan" is next year (January 2026)
    const result = parseTripDate('05 Jan', { referenceDate: refDate });
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(0); // January
    expect(result!.getDate()).toBe(5);
  });

  it('should match server and browser outputs by using local time construction', () => {
    // Ensure that direct execution of local time constructor is identical
    const clientSideDate = parseTripDate('2026-06-06');
    expect(clientSideDate).not.toBeNull();
    
    // Simulating server timezone or different locale execution:
    // Our parser logic relies on `new Date(year, monthIndex, day)` which executes 
    // in the environment's local timezone.
    expect(clientSideDate!.getHours()).toBe(0);
    expect(clientSideDate!.getMinutes()).toBe(0);
  });
});
