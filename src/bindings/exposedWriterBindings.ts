import { type WriterOptions, defaultWriterOptions as wo } from "./index.js";

export const defaultWriterOptions: Required<WriterOptions> = { ...wo };

export {
  type BarcodeFormat,
  barcodeFormats,
  type CharacterSet,
  characterSets,
  type EcLevel,
  type LinearBarcodeFormat,
  type LooseBarcodeFormat,
  linearBarcodeFormats,
  type MatrixBarcodeFormat,
  matrixBarcodeFormats,
  type ScanXWriteResult,
  type ScanXWriterOptions,
  type WriteInputBarcodeFormat,
  type WriteResult,
  type WriterOptions,
} from "./index.js";
