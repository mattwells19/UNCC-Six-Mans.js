// 🐧 - Can we move this to `utils.ts`

/**
 * Helper function that splits an array of items into two different arrays based on some condition.
 * @param arr The array of values to split
 * @param splitFn Function to determine which array the object should be added to
 * @returns An array containing two arrays where the first contains objects where the splitFn evaluated to
 * true and the second containing all objects that evaluated to false.
 */
export function splitArray<T>(arr: Array<T>, splitFn: (e: T) => boolean): T[][] {
  const a1: Array<T> = [];
  const a2: Array<T> = [];

  for (const e of arr) {
    if (splitFn(e)) {
      a1.push(e);
    } else {
      a2.push(e);
    }
  }

  return [a1, a2];
}
