/**
 * @internal
 */
export interface ScanXPoint {
  x: number;
  y: number;
}

/**
 * @internal
 */
export interface ScanXPosition {
  topLeft: ScanXPoint;
  topRight: ScanXPoint;
  bottomLeft: ScanXPoint;
  bottomRight: ScanXPoint;
}

/**
 * X, Y coordinates to describe a point.
 *
 * @property x X coordinate.
 * @property y Y coordinate.
 *
 * @see {@link Position | `Position`}
 */
export interface Point extends ScanXPoint {}

/**
 * Position of the decoded barcode.
 */
export interface Position {
  /**
   * Top-left point of the decoded barcode.
   *
   * @see {@link Point | `Point`}
   */
  topLeft: Point;
  /**
   * Top-right point of the decoded barcode.
   *
   * @see {@link Point | `Point`}
   */
  topRight: Point;
  /**
   * Bottom-left point of the decoded barcode.
   *
   * @see {@link Point | `Point`}
   */
  bottomLeft: Point;
  /**
   * Bottom-right point of the decoded barcode.
   *
   * @see {@link Point | `Point`}
   */
  bottomRight: Point;
}
