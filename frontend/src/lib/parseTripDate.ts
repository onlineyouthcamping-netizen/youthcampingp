/**
 * Reusable, local-timezone-safe date parser utility.
 * Accepts formats like: "06 Jun", "6 June", "06 Jun 2026", "2026-06-06", and ISO datetimes.
 * Never relies on browser-dependent new Date("incomplete-string") parsing.
 */
export function parseTripDate(
  dateStr: any,
  options?: { referenceDate?: Date; defaultYear?: number }
): Date | null {
  if (!dateStr || typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // 1. Try ISO/YYYY-MM-DD format (e.g., 2026-06-06, 2026-06-06T12:00:00Z)
  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const monthIndex = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);

    const parsedDate = new Date(year, monthIndex, day);
    if (
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === monthIndex &&
      parsedDate.getDate() === day
    ) {
      return parsedDate;
    }
    return null;
  }

  // 2. Try month name match (e.g., "06 Jun", "6 June", "06 Jun 2026", "06 Jun 26")
  const monthNames = [
    /jan/i, /feb/i, /mar/i, /apr/i, /may/i, /jun/i,
    /jul/i, /aug/i, /sep/i, /oct/i, /nov/i, /dec/i
  ];
  const monthIndex = monthNames.findIndex(rx => rx.test(trimmed));
  if (monthIndex !== -1) {
    const numbers = trimmed.match(/\d+/g);
    if (!numbers || numbers.length === 0) return null;

    let year: number;
    let day: number;

    if (numbers.length === 1) {
      day = parseInt(numbers[0], 10);

      if (options?.defaultYear !== undefined) {
        year = options.defaultYear;
      } else {
        // Derive year based on referenceDate
        const refDate = options?.referenceDate || new Date();
        const currentYear = refDate.getFullYear();
        const currentMonth = refDate.getMonth();
        const currentDay = refDate.getDate();

        year = currentYear;
        // December-to-January rollover: if we are in December, and the trip is January, it's next year.
        // Also more generally, if the trip month is in the past of the current year (or earlier in the same month),
        // we assume it is for the upcoming year.
        if (
          monthIndex < currentMonth ||
          (monthIndex === currentMonth && day < currentDay)
        ) {
          year = currentYear + 1;
        }
      }
    } else {
      // numbers.length >= 2
      // Find a 4-digit number first (year)
      const fourDigitYear = numbers.find(n => n.length === 4);
      if (fourDigitYear) {
        year = parseInt(fourDigitYear, 10);
        const dayStr = numbers.find(n => n !== fourDigitYear);
        day = dayStr ? parseInt(dayStr, 10) : 1;
      } else {
        // Check if there is a 2-digit number for year (assume last number is year, first is day)
        const first = parseInt(numbers[0], 10);
        const second = parseInt(numbers[1], 10);
        year = 2000 + second;
        day = first;
      }
    }

    const parsedDate = new Date(year, monthIndex, day);
    if (
      parsedDate.getFullYear() === year &&
      parsedDate.getMonth() === monthIndex &&
      parsedDate.getDate() === day
    ) {
      return parsedDate;
    }
    return null;
  }

  return null;
}
