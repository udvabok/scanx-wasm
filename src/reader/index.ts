import type { Merge } from "type-fest";
import type { ReaderOptions } from "../bindings/index.js";
import {
  type PrepareScanXModuleOptions,
  prepareScanXModuleWithFactory,
  purgeScanXModuleWithFactory,
  readBarcodesWithFactory,
  readSingleBarcodeWithFactory,
  type ScanXModuleOverrides,
  type ScanXReaderModule,
} from "../share.js";
import ScanXModuleFactory from "./scanx_reader.js";

export function prepareScanXModule(
  options?: Merge<PrepareScanXModuleOptions, { fireImmediately?: false }>,
): void;

export function prepareScanXModule(
  options: Merge<PrepareScanXModuleOptions, { fireImmediately: true }>,
): Promise<ScanXReaderModule>;

export function prepareScanXModule(
  options?: PrepareScanXModuleOptions,
): void | Promise<ScanXReaderModule>;

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
  cdnHost?: string,
) {
  return readBarcodesWithFactory(
    ScanXModuleFactory,
    input,
    readerOptions,
    cdnHost,
  );
}
export async function readSingleBarcode(
  input: Blob | ArrayBuffer | Uint8Array | ImageData,
  readerOptions?: ReaderOptions,
  cdnHost?: string,
) {
  return readSingleBarcodeWithFactory(
    ScanXModuleFactory,
    input,
    readerOptions,
    cdnHost,
  );
}
/**
 * @deprecated Use {@link readBarcodes | `readBarcodes`} instead.
 */
export async function readBarcodesFromImageFile(
  imageFile: Blob,
  readerOptions?: ReaderOptions,
  cdnHost?: string,
) {
  return readBarcodes(imageFile, readerOptions, cdnHost);
}

/**
 * @deprecated Use {@link readBarcodes | `readBarcodes`} instead.
 */
export async function readBarcodesFromImageData(
  imageData: ImageData,
  readerOptions?: ReaderOptions,
  cdnHost?: string,
) {
  return readBarcodes(imageData, readerOptions, cdnHost);
}

export * from "../bindings/exposedReaderBindings.js";
export {
  type PrepareScanXModuleOptions,
  SCANX_CPP_COMMIT,
  SCANX_WASM_VERSION,
  type ScanXModuleOverrides,
  type ScanXReaderModule,
} from "../share.js";
export const SCANX_WASM_SHA256 = READER_HASH;
