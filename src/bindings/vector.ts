/**
 * @internal
 */
export interface ScanXVector<T> {
  size: () => number;
  get: (i: number) => T | undefined;
}
