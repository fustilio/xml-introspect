import pako from "pako";

export interface GzipDecompressionResult {
  success: boolean;
  data?: string;
  binaryData?: Uint8Array; // Add binary data for tar archives
  error?: string;
  originalSize: number;
  decompressedSize: number;
  processingTime: number;
}

/**
 * Handles gzip decompression of downloaded data
 */
export class GzipHandler {

  /**
   * Check if data appears to be gzip compressed
   */
  isGzipCompressed(data: Uint8Array): boolean {
    return data.length > 2 && data[0] === 0x1f && data[1] === 0x8b;
  }

  /**
   * Decompress gzip data with detailed logging and error handling
   */
  async decompress(data: Uint8Array): Promise<GzipDecompressionResult> {
    const startTime = Date.now();
    const originalSize = data.length;


    try {
      // Use pako for gzip decompression
      let workingView = data;

      if (data[data.length - 1] === 0x3b) {
        workingView = data.slice(0, -1);
      }


      const decompressed = pako.inflate(workingView);


      const xmlText = new TextDecoder().decode(decompressed);


      // Check if this is a tar archive after gzip decompression
      const isTarArchive = xmlText.includes("ustar") ||
        xmlText.includes("PaxHeader") ||
        xmlText.includes("GlobalHeader");

      if (isTarArchive) {
        // Return binary data for tar extraction to avoid corruption
        return {
          success: true,
          data: xmlText,
          binaryData: decompressed,
          originalSize,
          decompressedSize: xmlText.length,
          processingTime: Date.now() - startTime
        };
      }

      // Yield to UI thread after decompression to prevent freezing
      await new Promise((resolve) => setTimeout(resolve, 1));

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      return {
        success: true,
        data: xmlText,
        originalSize,
        decompressedSize: xmlText.length,
        processingTime
      };

    } catch (err) {
      const endTime = Date.now();
      const processingTime = endTime - startTime;


      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
        originalSize,
        decompressedSize: 0,
        processingTime
      };
    }
  }
}
