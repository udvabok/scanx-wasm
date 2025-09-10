/**
 * The writer part API of this package is subject to change a lot.
 * Please track the status of [this issue](https://github.com/scanx-cpp/scanx-cpp/issues/332).
 *
 * @packageDocumentation
 */

import type { Merge } from "type-fest";
import type { WriterOptions } from "../bindings/index.js";
import {
  type PrepareScanXModuleOptions,
  prepareScanXModuleWithFactory,
  purgeScanXModuleWithFactory,
  type ScanXModuleOverrides,
  type ScanXWriterModule,
  writeBarcodeWithFactory,
} from "../share.js";
import ScanXModuleFactory from "./scanx_writer.js";

export function prepareScanXModule(
  options?: Merge<PrepareScanXModuleOptions, { fireImmediately?: false }>,
): void;

export function prepareScanXModule(
  options: Merge<PrepareScanXModuleOptions, { fireImmediately: true }>,
): Promise<ScanXWriterModule>;

export function prepareScanXModule(
  options?: PrepareScanXModuleOptions,
): void | Promise<ScanXWriterModule>;

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

export async function writeBarcode(
  input: string | Uint8Array,
  writerOptions?: WriterOptions,
) {
  return writeBarcodeWithFactory(ScanXModuleFactory, input, writerOptions);
}

export * from "../bindings/exposedWriterBindings.js";
export { SCANX_CPP_COMMIT, SCANX_WASM_VERSION, type PrepareScanXModuleOptions, type ScanXModuleOverrides, type ScanXWriterModule } from "../share.js";
export const SCANX_WASM_SHA256 = WRITER_HASH;
