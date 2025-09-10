import type { Merge } from "type-fest";
import type { ReaderOptions, WriterOptions } from "../bindings/index.js";
import {
  type PrepareScanXModuleOptions,
  prepareScanXModuleWithFactory,
  purgeScanXModuleWithFactory,
  readBarcodesWithFactory,
  readSingleBarcodeWithFactory,
  type ScanXFullModule,
  type ScanXModuleOverrides,
  writeBarcodeWithFactory,
} from "../share.js";
import ScanXModuleFactory from "./scanx_full.js";

export function prepareScanXModule(
  options?: Merge<PrepareScanXModuleOptions, { fireImmediately?: false }>,
): void;

export function prepareScanXModule(
  options: Merge<PrepareScanXModuleOptions, { fireImmediately: true }>,
): Promise<ScanXFullModule>;

export function prepareScanXModule(
  options?: PrepareScanXModuleOptions,
): void | Promise<ScanXFullModule>;

export function prepareScanXModule(options?: PrepareScanXModuleOptions) {
  return prepareScanXModuleWithFactory(ScanXModuleFactory, options);
}

export function purgeScanXModule() {
  return purgeScanXModuleWithFactory(ScanXModuleFactory);
}

/**
 * @deprecated Use {@link prepareScanXModule | `prepareScanXModule`} instead.
 * This function is equivalent to the following:
 *
 * ```ts
 * prepareScanXModule({
 *   overrides: ScanXModuleOverrides,
 *   equalityFn: Object.is,
 *   fireImmediately: true,
 * });
 * ```
 */
export function getScanXModule(ScanXModuleOverrides?: ScanXModuleOverrides) {
  return prepareScanXModule({
    overrides: ScanXModuleOverrides,
    equalityFn: Object.is,
    fireImmediately: true,
  });
}

/**
 * @deprecated Use {@link prepareScanXModule | `prepareScanXModule`} instead.
 * This function is equivalent to the following:
 *
 * ```ts
 * prepareScanXModule({
 *   overrides: ScanXModuleOverrides,
 *   equalityFn: Object.is,
 *   fireImmediately: false,
 * });
 * ```
 */
export function setScanXModuleOverrides(
  ScanXModuleOverrides: ScanXModuleOverrides,
) {
  prepareScanXModule({
    overrides: ScanXModuleOverrides,
    equalityFn: Object.is,
    fireImmediately: false,
  });
}

export async function readBarcodes(
  input: Blob | ArrayBuffer | Uint8Array | ImageData,
  readerOptions?: ReaderOptions,
) {
  return readBarcodesWithFactory(ScanXModuleFactory, input, readerOptions);
}
export async function readSingleBarcode(
  input: Blob | ArrayBuffer | Uint8Array | ImageData,
  readerOptions?: ReaderOptions,
) {
  return readSingleBarcodeWithFactory(ScanXModuleFactory, input, readerOptions);
}

/**
 * @deprecated Use {@link readBarcodes | `readBarcodes`} instead.
 */
export async function readBarcodesFromImageFile(
  imageFile: Blob,
  readerOptions?: ReaderOptions,
) {
  return readBarcodes(imageFile, readerOptions);
}

/**
 * @deprecated Use {@link readBarcodes | `readBarcodes`} instead.
 */
export async function readBarcodesFromImageData(
  imageData: ImageData,
  readerOptions?: ReaderOptions,
) {
  return readBarcodes(imageData, readerOptions);
}

export async function writeBarcode(
  input: string | Uint8Array,
  writerOptions?: WriterOptions,
) {
  return writeBarcodeWithFactory(ScanXModuleFactory, input, writerOptions);
}

export * from "../bindings/exposedReaderBindings.js";
export * from "../bindings/exposedWriterBindings.js";
export {
  type PrepareScanXModuleOptions,
  SCANX_CPP_COMMIT,
  SCANX_WASM_VERSION,
  type ScanXFullModule,
  type ScanXModuleOverrides,
} from "../share.js";
export const SCANX_WASM_SHA256 = FULL_HASH;
