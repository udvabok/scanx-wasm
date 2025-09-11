/*
 * Copyright 2016 Nu-book Inc.
 * Copyright 2023 Axel Waggershauser
 * Copyright 2023 Ze-Zheng Wu
 */
// SPDX-License-Identifier: Apache-2.0
#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <memory>
#include <stdexcept>
#include <string>

// ------------------------------start my include import-------------------------------
// this for isDateValid
#include <ctime>
// this 2 for decode accessToken
#include <iomanip>
#include <iostream>
#include <sstream>
// this for isValidDataFormat
#include <regex>
//------------------------------- env my include or import---------------------------------

#if defined(READER)
  #include "ReadBarcode.h"
  #define STB_IMAGE_IMPLEMENTATION
  #include <stb_image.h>
#endif

#if defined(WRITER)
  #include "WriteBarcode.h"
  #define STB_IMAGE_WRITE_IMPLEMENTATION
  #include <stb_image_write.h>
#endif

using namespace emscripten;

thread_local const val Uint8Array = val::global("Uint8Array");
thread_local const val Uint8ClampedArray = val::global("Uint8ClampedArray");

struct Symbol {
  val data;
  int width;
  int height;
};

// Helper function to create a Symbol object
Symbol createSymbolFromBarcodeSymbol(const ZXing::ImageView &barcodeSymbol) {
  return Symbol{
    .data = std::move(Uint8ClampedArray.new_(
      val(typed_memory_view(static_cast<std::size_t>(barcodeSymbol.rowStride()) * barcodeSymbol.height(), barcodeSymbol.data()))
    )),
    .width = barcodeSymbol.width(),
    .height = barcodeSymbol.height()
  };
}

#if defined(READER)

struct JsReaderOptions {
  int formats;
  bool tryHarder;
  bool tryRotate;
  bool tryInvert;
  bool tryDownscale;
  bool tryDenoise;
  uint8_t binarizer;
  bool isPure;
  uint16_t downscaleThreshold;
  uint8_t downscaleFactor;
  uint8_t minLineCount;
  uint8_t maxNumberOfSymbols;
  bool tryCode39ExtendedMode;
  bool returnErrors;
  uint8_t eanAddOnSymbol;
  uint8_t textMode;
  uint8_t characterSet;
  std::string accessToken; // add `accessToken`
};

struct JsReadResult {
  bool isValid;
  std::string error;
  int format;
  val bytes;
  val bytesECI;
  std::string text;
  std::string ecLevel;
  int contentType;
  bool hasECI;
  ZXing::Position position;
  int orientation;
  bool isMirrored;
  bool isInverted;
  std::string symbologyIdentifier;
  int sequenceSize;
  int sequenceIndex;
  std::string sequenceId;
  bool readerInit;
  int lineCount;
  std::string version;
  Symbol symbol;
  std::string extra;
  std::string message;
  int status;
};

// ------------------------------------------start my types------------------
// Define the struct to hold the response
struct AuthResponse {
  int status; // Status code
};
struct DecryptedResponse {
  int status; // Status code
  std::string decrypted;
};

// ------------------------------------------end my types------------------
// ------------------------------------------------start my custom functions----------------------------------------------------------------
// Status Codes for isValidDateFormat
// Code	Description
// 103	Date format is not supported.
// Status Codes for isDateValidToday
// Code	Description
// 200	Date matches today's date.
// Status Code for Timeout
// Code	Description
// 408	Request or operation timed out.
// 400	Invalid key provided.

std::string statusToMessage(const int &status) {
  switch (status) {
    case 103:
      return "Date format is not supported.";
    case 200:
      return "Date matches today's date.";
    case 408:
      return "Request or operation timed out.";
    case 400:
      return "Invalid key provided.";
    case 403:
      return "Forbidden.";
    default:
      return "Unknown Error.";
  }
}

AuthResponse isDateValidToday(const std::string &inputDate) {
  // Get today's date
  time_t t = time(0);
  tm *currentDate = localtime(&t);

  // Convert inputDate to tm structure
  int day, month, year;
  sscanf(inputDate.c_str(), ":__%d-%d-%d__:", &day, &month, &year);
  // Extract day, month, and year
  int c_day = currentDate->tm_mday; // Day of the month (1-31)
  int c_month = currentDate->tm_mon + 1; // Month (0-11, so add 1 to get 1-12)
  int c_year = currentDate->tm_year + 1900; // Year since 1900, so add 1900

  AuthResponse response;
  if (day == c_day && month == c_month && year == c_year) {
    response.status = 200;

    return response;
  } else {
    // std::cout << "day: " << c_day << std::endl;
    // std::cout << "month: " << c_month << std::endl;
    // std::cout << "year: " << c_year << std::endl;
    // std::cout << "not pass date" << std::endl;
    std::cout << "scanx-core-151" << std::endl;

    response.status = 408;

    return response;
  }
}

// Function to calculate the checksum of the key (in hex format)
std::string calculateHexSumOfKey(const std::string &key) {
  int sum = 0;
  for (char c : key) {
    sum += static_cast<int>(c);
  }
  std::ostringstream hexSum;
  hexSum << std::hex << std::setw(4) << std::setfill('0') << sum;
  return hexSum.str();
}
// Decrypt a message
// Function to decrypt the input using the correct key
DecryptedResponse customDecrypt(const std::string &encrypted, const std::string &key) {
  try {
    std::string decrypted;
    std::string hexSumOfKey = calculateHexSumOfKey(key);

    // Loop through the encrypted string, processing each character segment
    for (size_t i = 0; i < encrypted.length(); i += 8) {
      if (encrypted.length() < i + 8) {
        throw std::runtime_error("Encrypted string too short");
      }

      std::string xorHex = encrypted.substr(i, 2);
      std::string keyHex = encrypted.substr(i + 2, 2);
      std::string checksum = encrypted.substr(i + 4, 4);

      // Validate that the checksum matches
      if (checksum != hexSumOfKey) {
        throw std::runtime_error("Invalid key or corrupted data");
      }

      // Convert the hex to an integer and perform the XOR operation
      int xorCharCode = std::stoi(xorHex, nullptr, 16);
      int keyCharCode = std::stoi(keyHex, nullptr, 16);
      char charCode = xorCharCode ^ keyCharCode;

      decrypted += charCode;
    }
    DecryptedResponse response;
    response.status = 200;
    response.decrypted = decrypted;
    return response;
  } catch (const std::exception &e) {
    std::cerr << e.what() << '\n';
    DecryptedResponse response;
    response.status = 401;
    response.decrypted = "";
    return response;
  }
}

bool isValidDateFormat(const std::string &date) {
  try {
    // Regular expression for the format __DD-MM-YYYY__
    std::regex datePattern("^:__([0-2][0-9]|3[0-1])-(0[1-9]|1[0-2])-(\\d{4})__:$");

    // Check if the date matches the pattern
    return std::regex_match(date, datePattern);
  } catch (const std::regex_error &e) {
    // Handle regular expression errors
    std::cerr << "Regex error: " << e.what() << std::endl;
    return false; // Return false if regex fails
  }
}
AuthResponse isAccessTokenIsValidToday(const std::string &accessToken) {
  try {
    if (accessToken.empty()) {
      throw std::invalid_argument("Access token -> is empty");
    }
    std::string key = accessToken.substr(0, 36); // First 2 letters
    std::string encrypted = accessToken.substr(36); // Rest of the string after skipping first 2 letters

    if (encrypted.empty()) {
      throw std::invalid_argument("Access token -> encrypted is empty");
    }
    if (key.empty()) {
      throw std::invalid_argument("Access token -> key is empty");
    }
    // Decrypt with the correct key
    if (encrypted.length() < 8) {
      throw std::runtime_error("Encrypted string too short");
    }
    DecryptedResponse decryptedRes = customDecrypt(encrypted, key);
    if (decryptedRes.status != 200) {
      AuthResponse response;
      response.status = decryptedRes.status;
      return response;
    }
    std::string decrypted = decryptedRes.decrypted;
    if (isValidDateFormat(decrypted)) {
      return isDateValidToday(decrypted);
    } else {
      AuthResponse response;
      response.status = 103;
      return response;
    }
  } catch (const std::runtime_error &e) {
    std::cout << "Runtime Error: " << e.what() << std::endl;
    AuthResponse response;
    response.status = 400;
    return response;
  } catch (const std::logic_error &e) {
    std::cout << "Logic Error: " << e.what() << std::endl;
    AuthResponse response;
    response.status = 400;
    return response;
  } catch (const std::exception &e) {
    std::cout << "Standard Exception: " << e.what() << std::endl;
    AuthResponse response;
    response.status = 400;
    return response;
  } catch (...) {
    std::cout << "Unknown Exception Caught" << std::endl;
    AuthResponse response;
    response.status = 400;
    return response;
  }
}
//---------------------------------------------------------- env my custom functions-----------------------------------------------

using JsReadResults = std::vector<JsReadResult>;

JsReadResults readBarcodes(ZXing::ImageView imageView, const JsReaderOptions &jsReaderOptions) {
  try {
    auto barcodes = ZXing::ReadBarcodes(
      imageView,
      ZXing::ReaderOptions()
        .setFormats(static_cast<ZXing::BarcodeFormat>(jsReaderOptions.formats))
        .setTryHarder(jsReaderOptions.tryHarder)
        .setTryRotate(jsReaderOptions.tryRotate)
        .setTryInvert(jsReaderOptions.tryInvert)
        .setTryDownscale(jsReaderOptions.tryDownscale)
        .setTryDenoise(jsReaderOptions.tryDenoise)
        .setBinarizer(static_cast<ZXing::Binarizer>(jsReaderOptions.binarizer))
        .setIsPure(jsReaderOptions.isPure)
        .setDownscaleThreshold(jsReaderOptions.downscaleThreshold)
        .setDownscaleFactor(jsReaderOptions.downscaleFactor)
        .setMinLineCount(jsReaderOptions.minLineCount)
        .setMaxNumberOfSymbols(jsReaderOptions.maxNumberOfSymbols)
        .setTryCode39ExtendedMode(jsReaderOptions.tryCode39ExtendedMode)
        .setReturnErrors(jsReaderOptions.returnErrors)
        .setEanAddOnSymbol(static_cast<ZXing::EanAddOnSymbol>(jsReaderOptions.eanAddOnSymbol))
        .setTextMode(static_cast<ZXing::TextMode>(jsReaderOptions.textMode))
        .setCharacterSet(static_cast<ZXing::CharacterSet>(jsReaderOptions.characterSet))
    );

    JsReadResults jsReadResults;
    jsReadResults.reserve(barcodes.size());

    for (auto &barcode : barcodes) {

      auto barcodeSymbol = barcode.symbol();

      jsReadResults.push_back(
        {.isValid = barcode.isValid(),
         .error = ZXing::ToString(barcode.error()),
         .format = static_cast<int>(barcode.format()),
         .bytes = std::move(Uint8Array.new_(val(typed_memory_view(barcode.bytes().size(), barcode.bytes().data())))),
         .bytesECI = std::move(Uint8Array.new_(val(typed_memory_view(barcode.bytesECI().size(), barcode.bytesECI().data())))),
         .text = barcode.text(),
         .ecLevel = barcode.ecLevel(),
         .contentType = static_cast<int>(barcode.contentType()),
         .hasECI = barcode.hasECI(),
         .position = barcode.position(),
         .orientation = barcode.orientation(),
         .isMirrored = barcode.isMirrored(),
         .isInverted = barcode.isInverted(),
         .symbologyIdentifier = barcode.symbologyIdentifier(),
         .sequenceSize = barcode.sequenceSize(),
         .sequenceIndex = barcode.sequenceIndex(),
         .sequenceId = barcode.sequenceId(),
         .readerInit = barcode.readerInit(),
         .lineCount = barcode.lineCount(),
         .version = barcode.version(),
         .symbol = createSymbolFromBarcodeSymbol(barcodeSymbol),
         .extra = barcode.extra(),
         .message = "success",
         .status = 200}
      );
    }
    return jsReadResults;
  } catch (const std::exception &e) {
    return {{.error = e.what(), .message = "try again", .status = 403}};
  } catch (...) {
    return {{.error = "Unknown error", .message = "try again", .status = 403}};
  }
}

JsReadResults readBarcodesFromImage(int bufferPtr, int bufferLength, const JsReaderOptions &jsReaderOptions) {
  try {
    int width, height, channels;
    std::unique_ptr<stbi_uc, void (*)(void *)> buffer(
      stbi_load_from_memory(reinterpret_cast<const stbi_uc *>(bufferPtr), bufferLength, &width, &height, &channels, 1), stbi_image_free
    );
    if (!buffer) {
      return {{.error = "Failed to load image from memory"}};
    }
    // Check accessToken validity
    AuthResponse dateRes = isAccessTokenIsValidToday(jsReaderOptions.accessToken);
    if (dateRes.status == 200) {
      return readBarcodes({buffer.get(), width, height, ZXing::ImageFormat::Lum}, jsReaderOptions);
    } else {
      return {{.error = statusToMessage(dateRes.status), .message = statusToMessage(dateRes.status), .status = dateRes.status}};
    }
  } catch (const std::exception &e) {
    std::cerr << "AR:358:" << e.what() << '\n';
    return {{.error = statusToMessage(403), .message = statusToMessage(403), .status = 403}};
  }
}

JsReadResults readBarcodesFromPixmap(int bufferPtr, int width, int height, const JsReaderOptions &jsReaderOptions) {
  try {
    AuthResponse dateRes = isAccessTokenIsValidToday(jsReaderOptions.accessToken);
    if (dateRes.status == 200) {
      return readBarcodes({reinterpret_cast<const uint8_t *>(bufferPtr), width, height, ZXing::ImageFormat::RGBA}, jsReaderOptions);
    } else {
      return {{.error = statusToMessage(dateRes.status), .message = statusToMessage(dateRes.status), .status = dateRes.status}};
    }
  } catch (const std::exception &e) {
    return {{.error = statusToMessage(403), .message = statusToMessage(403), .status = 403}};
  }
}

// ------------------ New single barcode function ------------------
JsReadResult readSingleBarcodeFromPixmap(int dataPtr, int width, int height, const JsReaderOptions &options) {
  auto results = readBarcodes({reinterpret_cast<const uint8_t *>(dataPtr), width, height, ZXing::ImageFormat::RGBA}, options);
  if (!results.empty()) {
    return results.front();
  }
  return {.error = "No barcode found", .message = "No barcode found", .status = 404};
}

#endif

#if defined(WRITER)

struct JsWriterOptions {
  // ZXing::CreatorOptions
  int format;
  bool readerInit;
  std::string ecLevel;
  std::string options;
  // ZXing::WriterOptions
  int scale;
  int sizeHint;
  int rotate;
  bool withHRT;
  bool withQuietZones;
};

namespace {

  ZXing::CreatorOptions createCreatorOptions(const JsWriterOptions &jsWriterOptions) {
    return ZXing::CreatorOptions(static_cast<ZXing::BarcodeFormat>(jsWriterOptions.format))
      .readerInit(jsWriterOptions.readerInit)
      .ecLevel(jsWriterOptions.ecLevel)
      .options(jsWriterOptions.options);
  }

  ZXing::WriterOptions createWriterOptions(const JsWriterOptions &jsWriterOptions) {
    return ZXing::WriterOptions()
      .scale(jsWriterOptions.scale)
      .sizeHint(jsWriterOptions.sizeHint)
      .rotate(jsWriterOptions.rotate)
      .withHRT(jsWriterOptions.withHRT)
      .withQuietZones(jsWriterOptions.withQuietZones);
  }

} // anonymous namespace

struct JsWriteResult {
  std::string error;
  std::string svg;
  std::string utf8;
  val image;
  Symbol symbol;
};

JsWriteResult writeBarcodeFromText(std::string text, const JsWriterOptions &jsWriterOptions) {
  try {
    auto barcode = ZXing::CreateBarcodeFromText(text, createCreatorOptions(jsWriterOptions));
    auto writerOptions = createWriterOptions(jsWriterOptions);

    auto image = ZXing::WriteBarcodeToImage(barcode, writerOptions);

    int len;
    uint8_t *bytes = stbi_write_png_to_mem(image.data(), image.rowStride(), image.width(), image.height(), ZXing::PixStride(image.format()), &len);

    // Wrap into JS typed array *before* freeing.
    val jsImage = Uint8Array.new_(val(typed_memory_view(len, bytes)));

    free(bytes); // Prevent leak – STBI allocates with malloc

    auto barcodeSymbol = barcode.symbol();

    return {
      .svg = ZXing::WriteBarcodeToSVG(barcode, writerOptions),
      .utf8 = ZXing::WriteBarcodeToUtf8(barcode, writerOptions),
      .image = std::move(jsImage),
      .symbol = createSymbolFromBarcodeSymbol(barcodeSymbol)
    };
  } catch (const std::exception &e) {
    return {.error = e.what()};
  } catch (...) {
    return {.error = "Unknown error"};
  }
}

JsWriteResult writeBarcodeFromBytes(int bufferPtr, int bufferLength, const JsWriterOptions &jsWriterOptions) {
  try {
    auto barcode = ZXing::CreateBarcodeFromBytes(reinterpret_cast<const void *>(bufferPtr), bufferLength, createCreatorOptions(jsWriterOptions));
    auto writerOptions = createWriterOptions(jsWriterOptions);

    auto image = ZXing::WriteBarcodeToImage(barcode, writerOptions);

    int len;
    uint8_t *bytes = stbi_write_png_to_mem(image.data(), image.rowStride(), image.width(), image.height(), ZXing::PixStride(image.format()), &len);

    // Wrap into JS typed array *before* freeing.
    val jsImage = Uint8Array.new_(val(typed_memory_view(len, bytes)));

    free(bytes); // Prevent leak – STBI allocates with malloc

    auto barcodeSymbol = barcode.symbol();

    return {
      .svg = ZXing::WriteBarcodeToSVG(barcode, writerOptions),
      .utf8 = ZXing::WriteBarcodeToUtf8(barcode, writerOptions),
      .image = std::move(jsImage),
      .symbol = createSymbolFromBarcodeSymbol(barcodeSymbol)
    };
  } catch (const std::exception &e) {
    return {.error = e.what()};
  } catch (...) {
    return {.error = "Unknown error"};
  }
}

#endif

EMSCRIPTEN_BINDINGS(ZXingWasm) {

  value_object<Symbol>("Symbol").field("data", &Symbol::data).field("width", &Symbol::width).field("height", &Symbol::height);

#if defined(READER)

  value_object<JsReaderOptions>("ReaderOptions")
    .field("formats", &JsReaderOptions::formats)
    .field("tryHarder", &JsReaderOptions::tryHarder)
    .field("tryRotate", &JsReaderOptions::tryRotate)
    .field("tryInvert", &JsReaderOptions::tryInvert)
    .field("tryDownscale", &JsReaderOptions::tryDownscale)
    .field("tryDenoise", &JsReaderOptions::tryDenoise)
    .field("binarizer", &JsReaderOptions::binarizer)
    .field("isPure", &JsReaderOptions::isPure)
    .field("downscaleThreshold", &JsReaderOptions::downscaleThreshold)
    .field("downscaleFactor", &JsReaderOptions::downscaleFactor)
    .field("minLineCount", &JsReaderOptions::minLineCount)
    .field("maxNumberOfSymbols", &JsReaderOptions::maxNumberOfSymbols)
    .field("tryCode39ExtendedMode", &JsReaderOptions::tryCode39ExtendedMode)
    .field("returnErrors", &JsReaderOptions::returnErrors)
    .field("eanAddOnSymbol", &JsReaderOptions::eanAddOnSymbol)
    .field("textMode", &JsReaderOptions::textMode)
    .field("characterSet", &JsReaderOptions::characterSet)
    .field("accessToken", &JsReaderOptions::accessToken); // add accessToken

  value_object<ZXing::PointI>("Point").field("x", &ZXing::PointI::x).field("y", &ZXing::PointI::y);

  value_object<ZXing::Position>("Position")
    .field("topLeft", emscripten::index<0>())
    .field("topRight", emscripten::index<1>())
    .field("bottomRight", emscripten::index<2>())
    .field("bottomLeft", emscripten::index<3>());

  value_object<JsReadResult>("ReadResult")
    .field("isValid", &JsReadResult::isValid)
    .field("error", &JsReadResult::error)
    .field("format", &JsReadResult::format)
    .field("bytes", &JsReadResult::bytes)
    .field("bytesECI", &JsReadResult::bytesECI)
    .field("text", &JsReadResult::text)
    .field("ecLevel", &JsReadResult::ecLevel)
    .field("contentType", &JsReadResult::contentType)
    .field("hasECI", &JsReadResult::hasECI)
    .field("position", &JsReadResult::position)
    .field("orientation", &JsReadResult::orientation)
    .field("isMirrored", &JsReadResult::isMirrored)
    .field("isInverted", &JsReadResult::isInverted)
    .field("symbologyIdentifier", &JsReadResult::symbologyIdentifier)
    .field("sequenceSize", &JsReadResult::sequenceSize)
    .field("sequenceIndex", &JsReadResult::sequenceIndex)
    .field("sequenceId", &JsReadResult::sequenceId)
    .field("readerInit", &JsReadResult::readerInit)
    .field("lineCount", &JsReadResult::lineCount)
    .field("version", &JsReadResult::version)
    .field("symbol", &JsReadResult::symbol)
    .field("extra", &JsReadResult::extra)
    .field("message", &JsReadResult::message)
    .field("status", &JsReadResult::status);

  register_vector<JsReadResult>("ReadResults");

  function("readBarcodesFromImage", &readBarcodesFromImage);
  function("readBarcodesFromPixmap", &readBarcodesFromPixmap);
  function("readSingleBarcodeFromPixmap", &readSingleBarcodeFromPixmap);

#endif

#if defined(WRITER)

  value_object<JsWriterOptions>("WriterOptions")
    .field("format", &JsWriterOptions::format)
    .field("readerInit", &JsWriterOptions::readerInit)
    .field("ecLevel", &JsWriterOptions::ecLevel)
    .field("scale", &JsWriterOptions::scale)
    .field("sizeHint", &JsWriterOptions::sizeHint)
    .field("rotate", &JsWriterOptions::rotate)
    .field("withHRT", &JsWriterOptions::withHRT)
    .field("withQuietZones", &JsWriterOptions::withQuietZones)
    .field("options", &JsWriterOptions::options);

  value_object<JsWriteResult>("WriteResult")
    .field("error", &JsWriteResult::error)
    .field("svg", &JsWriteResult::svg)
    .field("utf8", &JsWriteResult::utf8)
    .field("image", &JsWriteResult::image)
    .field("symbol", &JsWriteResult::symbol);

  function("writeBarcodeFromText", &writeBarcodeFromText);
  function("writeBarcodeFromBytes", &writeBarcodeFromBytes);

#endif
};
