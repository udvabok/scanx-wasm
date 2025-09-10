import { type WriterOptions, defaultWriterOptions as wo } from "./index.js";

export const defaultWriterOptions: Required<WriterOptions> = { ...wo };

export {
  barcodeFormats, characterSets, linearBarcodeFormats, matrixBarcodeFormats, type BarcodeFormat, type CharacterSet, type EcLevel,
  type LinearBarcodeFormat,
  type LooseBarcodeFormat, type MatrixBarcodeFormat, type ScanXWriteResult, type ScanXWriterOptions, type WriteInputBarcodeFormat,
  type WriteResult,
  type WriterOptions
} from "./index.js";

