import type { Merge } from "type-fest";
import {
  defaultReaderOptions,
  defaultWriterOptions,
  type ReaderOptions,
  readerOptionsToScanXReaderOptions,
  type ReadResult,
  type ScanXReaderOptions,
  type ScanXReadResult,
  ScanXReadResultToReadResult,
  type ScanXVector,
  type ScanXWriteResult,
  ScanXWriteResultToWriteResult,
  type ScanXWriterOptions,
  type WriterOptions,
  writerOptionsToScanXWriterOptions,
} from "./bindings/index.js";

export type ScanXModuleType = "reader" | "writer" | "full";

/**
 * @internal
 */
export interface ScanXReaderModule extends EmscriptenModule {
  readBarcodesFromImage(
    bufferPtr: number,
    bufferLength: number,
    ScanXReaderOptions: ScanXReaderOptions,
  ): ScanXVector<ScanXReadResult>;

  readBarcodesFromPixmap(
    bufferPtr: number,
    imgWidth: number,
    imgHeight: number,
    ScanXReaderOptions: ScanXReaderOptions,
  ): ScanXVector<ScanXReadResult>;
}

/**
 * @internal
 */
export interface ScanXWriterModule extends EmscriptenModule {
  writeBarcodeFromText(
    text: string,
    ScanXWriterOptions: ScanXWriterOptions,
  ): ScanXWriteResult;

  writeBarcodeFromBytes(
    bufferPtr: number,
    bufferLength: number,
    ScanXWriterOptions: ScanXWriterOptions,
  ): ScanXWriteResult;
}

/**
 * @internal
 */
export interface ScanXFullModule extends ScanXReaderModule, ScanXWriterModule {}

export type ScanXReaderModuleFactory =
  EmscriptenModuleFactory<ScanXReaderModule>;

export type ScanXWriterModuleFactory =
  EmscriptenModuleFactory<ScanXWriterModule>;

export type ScanXFullModuleFactory = EmscriptenModuleFactory<ScanXFullModule>;

interface TypeModuleMap {
  reader: [ScanXReaderModule, ScanXReaderModuleFactory];
  writer: [ScanXWriterModule, ScanXWriterModuleFactory];
  full: [ScanXFullModule, ScanXFullModuleFactory];
}

export type ScanXModule<T extends ScanXModuleType = ScanXModuleType> =
  TypeModuleMap[T][0];

export type ScanXModuleFactory<T extends ScanXModuleType = ScanXModuleType> =
  TypeModuleMap[T][1];

export type ScanXModuleOverrides = Partial<EmscriptenModule>;

export const SCANX_WASM_VERSION = NPM_PACKAGE_VERSION;

export const SCANX_CPP_COMMIT = SUBMODULE_COMMIT;

const DEFAULT_MODULE_OVERRIDES: ScanXModuleOverrides =
  import.meta.env.MODE === "miniprogram"
    ? {
        instantiateWasm() {
          throw Error(
            `To use scanx-wasm in a WeChat Mini Program, you must provide a custom "instantiateWasm" function, e.g.:

prepareScanXModule({
  overrides: {
    instantiateWasm(imports, successCallback) {
      WXWebAssembly.instantiate("path/to/scanx_full.wasm", imports).then(({ instance }) =>
        successCallback(instance),
      );
      return {};
    },
  }
});

Learn more:
- https://developers.weixin.qq.com/miniprogram/dev/framework/performance/wasm.html
- https://emscripten.org/docs/api_reference/module.html#Module.instantiateWasm
- https://github.com/Sec-ant/scanx-wasm#integrating-in-non-web-runtimes
`,
          );
        },
      }
    : import.meta.env.PROD
      ? {
          locateFile: (path, prefix) => {
            const match = path.match(/_(.+?)\.wasm$/);
            if (match) {
              return `https://fastly.jsdelivr.net/npm/scanx-wasm@${NPM_PACKAGE_VERSION}/dist/${match[1]}/${path}`;
            }
            return prefix + path;
          },
        }
      : {
          locateFile: (path, prefix) => {
            const match = path.match(/_(.+?)\.wasm$/);
            if (match) {
              return `/src/${match[1]}/${path}`;
            }
            return prefix + path;
          },
        };

type CachedValue<T extends ScanXModuleType = ScanXModuleType> =
  | [ScanXModuleOverrides]
  | [ScanXModuleOverrides, Promise<ScanXModule<T>>];

const __CACHE__ = new WeakMap<ScanXModuleFactory, CachedValue>();

export interface PrepareScanXModuleOptions {
  /**
   * The Emscripten module overrides to be passed to the factory function.
   * The `locateFile` function is overridden by default to load the WASM file from the jsDelivr CDN.
   */
  overrides?: ScanXModuleOverrides;
  /**
   * A function to compare the cached overrides with the input overrides.
   * So that the module promise can be reused if the overrides are the same.
   * Defaults to a shallow equality function.
   */
  equalityFn?: (
    cachedOverrides: ScanXModuleOverrides,
    overrides: ScanXModuleOverrides,
  ) => boolean;
  /**
   * Whether to instantiate the module immediately.
   * If `true`, the module is eagerly instantiated and a promise of the module is returned.
   * If `false`, only the overrides are updated and module instantiation is deferred
   * to the first read/write operation.
   *
   * @default false
   */
  fireImmediately?: boolean;
}

/**
 * Performs a shallow equality comparison between two objects.
 *
 * @param a - First object to compare
 * @param b - Second object to compare
 * @returns `true` if objects are shallowly equal, `false` otherwise
 *
 * @remarks
 * Objects are considered shallowly equal if:
 * - They are the same reference (using Object.is)
 * - They have the same number of keys
 * - All keys in `a` exist in `b` with strictly equal values (===)
 *
 * Note: This comparison only checks the first level of properties.
 * Nested objects or arrays are compared by reference, not by value.
 *
 * @example
 * ```ts
 * shallow({ a: 1, b: 2 }, { a: 1, b: 2 }) // returns true
 * shallow({ a: 1 }, { a: 1, b: 2 }) // returns false
 * shallow({ a: {x: 1} }, { a: {x: 1} }) // returns false (different object references)
 * ```
 */
export function shallow<T extends Record<string, unknown>>(a: T, b: T) {
  return (
    Object.is(a, b) ||
    (Object.keys(a).length === Object.keys(b).length &&
      Object.keys(a).every(
        (key) =>
          Object.hasOwn(b, key) && a[key as keyof T] === b[key as keyof T],
      ))
  );
}

export function prepareScanXModuleWithFactory<T extends ScanXModuleType>(
  ScanXModuleFactory: ScanXModuleFactory<T>,
  options?: Merge<PrepareScanXModuleOptions, { fireImmediately?: false }>,
): void;

export function prepareScanXModuleWithFactory<T extends ScanXModuleType>(
  ScanXModuleFactory: ScanXModuleFactory<T>,
  options: Merge<PrepareScanXModuleOptions, { fireImmediately: true }>,
): Promise<ScanXModule<T>>;

export function prepareScanXModuleWithFactory<T extends ScanXModuleType>(
  ScanXModuleFactory: ScanXModuleFactory<T>,
  options?: PrepareScanXModuleOptions,
): void | Promise<ScanXModule<T>>;

/**
 * Prepares and caches a ScanX module instance with the specified factory and options.
 *
 * @param ScanXModuleFactory - Factory function to create the ScanX module
 * @param options - Configuration options for module preparation
 * @param options.overrides - Custom overrides for module initialization
 * @param options.equalityFn - Function to compare override equality (defaults to shallow comparison)
 * @param options.fireImmediately - Whether to instantiate the module immediately (defaults to false)
 * @returns Promise of the ScanX module instance if fireImmediately is true, otherwise void
 *
 * @remarks
 * This function implements a caching mechanism for ScanX module instances. It stores
 * both the module overrides and the instantiated module promise in a global cache.
 */
export function prepareScanXModuleWithFactory<T extends ScanXModuleType>(
  ScanXModuleFactory: ScanXModuleFactory<T>,
  {
    overrides,
    equalityFn = shallow,
    fireImmediately = false,
  }: PrepareScanXModuleOptions = {},
) {
  // look up the cached overrides and module promise
  const [cachedOverrides, cachedPromise] = (__CACHE__.get(ScanXModuleFactory) as
    | CachedValue<T>
    | undefined) ?? [DEFAULT_MODULE_OVERRIDES];

  // resolve the input overrides
  const resolvedOverrides = overrides ?? cachedOverrides;

  let cacheHit: boolean | undefined;

  // if the module is to be instantiated immediately
  if (fireImmediately) {
    // if cache is hit and a cached promise is available,
    // return the cached promise directly
    if (
      cachedPromise &&
      (cacheHit = equalityFn(cachedOverrides, resolvedOverrides))
    ) {
      return cachedPromise;
    }
    // otherwise, instantiate the module
    const modulePromise = ScanXModuleFactory({
      ...resolvedOverrides,
    }) as Promise<ScanXModule<T>>;
    // cache the overrides and the promise
    __CACHE__.set(ScanXModuleFactory, [resolvedOverrides, modulePromise]);
    // and return the promise
    return modulePromise;
  }

  // otherwise only update the cache if the overrides have changed
  if (!(cacheHit ?? equalityFn(cachedOverrides, resolvedOverrides))) {
    __CACHE__.set(ScanXModuleFactory, [resolvedOverrides]);
  }
}

/**
 * Removes a ScanX module instance from the internal cache.
 *
 * @param ScanXModuleFactory - The factory function used to create the ScanX module instance
 *
 * @remarks
 * This function is used to clean up cached ScanX module instances when they are no longer needed.
 */
export function purgeScanXModuleWithFactory<T extends ScanXModuleType>(
  ScanXModuleFactory: ScanXModuleFactory<T>,
) {
  __CACHE__.delete(ScanXModuleFactory);
}

/**
 * Reads barcodes from an image using a ScanX module factory.
 *
 * @param ScanXModuleFactory - Factory function to create a ScanX module instance
 * @param input - Source image data as a Blob, ArrayBuffer, Uint8Array, or ImageData
 * @param readerOptions - Optional configuration options for barcode reading (defaults to defaultReaderOptions)
 * @returns An array of ReadResult objects containing decoded barcode information
 *
 * @remarks
 * The function manages memory allocation and deallocation for the ScanX module
 * and properly cleans up resources after processing.
 */
export async function readBarcodesWithFactory<T extends "reader" | "full">(
  ScanXModuleFactory: ScanXModuleFactory<T>,
  input: Blob | ArrayBuffer | Uint8Array | ImageData,
  readerOptions: ReaderOptions = defaultReaderOptions,
) {
  const requiredReaderOptions: Required<ReaderOptions> = {
    ...defaultReaderOptions,
    ...readerOptions,
  };
  const ScanXModule = await prepareScanXModuleWithFactory(ScanXModuleFactory, {
    fireImmediately: true,
  });
  let ScanXReadResultVector: ScanXVector<ScanXReadResult>;
  let bufferPtr: number;

  if ("width" in input && "height" in input && "data" in input) {
    /* ImageData */
    const {
      data: buffer,
      data: { byteLength: size },
      width,
      height,
    } = input;
    bufferPtr = ScanXModule._malloc(size);
    ScanXModule.HEAPU8.set(buffer, bufferPtr);
    ScanXReadResultVector = ScanXModule.readBarcodesFromPixmap(
      bufferPtr,
      width,
      height,
      readerOptionsToScanXReaderOptions(requiredReaderOptions),
    );
  } else {
    let size: number;
    let buffer: Uint8Array;
    if ("buffer" in input) {
      /* Uint8Array */
      [size, buffer] = [input.byteLength, input];
    } else if ("byteLength" in input) {
      /* ArrayBuffer */
      [size, buffer] = [input.byteLength, new Uint8Array(input)];
    } else if ("size" in input) {
      /* Blob */
      [size, buffer] = [input.size, new Uint8Array(await input.arrayBuffer())];
    } else {
      throw new TypeError("Invalid input type");
    }
    bufferPtr = ScanXModule._malloc(size);
    ScanXModule.HEAPU8.set(buffer, bufferPtr);
    ScanXReadResultVector = ScanXModule.readBarcodesFromImage(
      bufferPtr,
      size,
      readerOptionsToScanXReaderOptions(requiredReaderOptions),
    );
  }
  ScanXModule._free(bufferPtr);
  const readResults: ReadResult[] = [];
  for (let i = 0; i < ScanXReadResultVector.size(); ++i) {
    readResults.push(
      ScanXReadResultToReadResult(ScanXReadResultVector.get(i)!),
    );
  }
  return readResults;
}

/**
 * Generates a barcode image using a ScanX module factory with support for text and binary input.
 *
 * @param ScanXModuleFactory - The factory function that creates a ScanX module instance
 * @param input - The data to encode in the barcode, either as a string or Uint8Array
 * @param writerOptions - Optional configuration options for barcode generation
 * @returns A promise that resolves to the barcode write result
 *
 * @remarks
 * The function handles memory management automatically when processing binary input,
 * ensuring proper allocation and deallocation of memory in the ScanX module.
 */
export async function writeBarcodeWithFactory<T extends "writer" | "full">(
  ScanXModuleFactory: ScanXModuleFactory<T>,
  input: string | Uint8Array,
  writerOptions: WriterOptions = defaultWriterOptions,
) {
  const requiredWriterOptions: Required<WriterOptions> = {
    ...defaultWriterOptions,
    ...writerOptions,
  };
  const ScanXWriterOptions = writerOptionsToScanXWriterOptions(
    requiredWriterOptions,
  );
  const ScanXModule = await prepareScanXModuleWithFactory(ScanXModuleFactory, {
    fireImmediately: true,
  });
  if (typeof input === "string") {
    return ScanXWriteResultToWriteResult(
      ScanXModule.writeBarcodeFromText(input, ScanXWriterOptions),
    );
  }
  const { byteLength } = input;
  const bufferPtr = ScanXModule._malloc(byteLength);
  ScanXModule.HEAPU8.set(input, bufferPtr);
  const ScanXWriteResult = ScanXModule.writeBarcodeFromBytes(
    bufferPtr,
    byteLength,
    ScanXWriterOptions,
  );
  ScanXModule._free(bufferPtr);
  return ScanXWriteResultToWriteResult(ScanXWriteResult);
}

if (import.meta.env.MODE === "miniprogram") {
  /* A bare minimum Blob polyfill */
  globalThis.Blob ??= class {
    #blobParts;
    #options;
    #zeroUint8Array = new Uint8Array();
    constructor(blobParts?: BlobPart[], options?: BlobPropertyBag) {
      console.error(
        "For the sake of robustness, a properly implemented Blob polyfill is required.",
      );
      this.#blobParts = blobParts as Uint8Array[];
      this.#options = options;
    }
    get size() {
      return this.#blobParts?.[0]?.byteLength ?? 0;
    }
    get type() {
      return this.#options?.type ?? "";
    }
    async arrayBuffer() {
      return (
        (this.#blobParts?.[0]?.buffer as ArrayBuffer) ??
        this.#zeroUint8Array.buffer
      );
    }
    async bytes() {
      return this.#blobParts?.[0] ?? this.#zeroUint8Array;
    }
    slice(): ReturnType<Blob["slice"]> {
      throw new Error("Not implemented");
    }
    stream(): ReturnType<Blob["stream"]> {
      throw new Error("Not implemented");
    }
    text(): ReturnType<Blob["text"]> {
      throw new Error("Not implemented");
    }
    get [Symbol.toStringTag]() {
      return "Blob";
    }
  };
}
