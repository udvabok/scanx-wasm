import { type ReaderOptions, defaultReaderOptions as ro } from "./index.js";

export const defaultReaderOptions: Required<ReaderOptions> = {
  ...ro,
  formats: [...ro.formats],
};

export {
  barcodeFormats,
  binarizers, characterSets,
  contentTypes, eanAddOnSymbols, linearBarcodeFormats, matrixBarcodeFormats, textModes, type BarcodeFormat,
  type Binarizer, type CharacterSet,
  type ContentType, type EanAddOnSymbol,
  type EcLevel, type LinearBarcodeFormat,
  type LooseBarcodeFormat, type MatrixBarcodeFormat, type Point,
  type Position,
  type ReaderOptions,
  type ReadInputBarcodeFormat,
  type ReadOutputBarcodeFormat,
  type ReadResult, type ScanXPoint, type ScanXPosition, type ScanXReaderOptions, type ScanXReadResult, type ScanXVector, type TextMode
} from "./index.js";

