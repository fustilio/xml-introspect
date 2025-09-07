import { XzReadableStream } from "xz-decompress";

export interface XzDecompressionResult {
  success: boolean;
  data?: string; // Make optional to handle error cases
  binaryData?: Uint8Array; // Add binary data for tar archives
  originalSize: number;
  decompressedSize: number;
  processingTime: number;
  error?: string;
}

/**
 * Handles XZ decompression of downloaded data
 */
export class XzHandler {

  /**
   * Check if data appears to be XZ compressed
   */
  isXzCompressed(data: Uint8Array): boolean {
    // Check for XZ magic numbers: 0xfd 0x37 0x7a 0x58 0x5a 0x00
    return (
      data.length >= 6 &&
      data[0] === 0xfd &&
      data[1] === 0x37 &&
      data[2] === 0x7a &&
      data[3] === 0x58 &&
      data[4] === 0x5a &&
      data[5] === 0x00
    );
  }

  /**
   * Decompress XZ data with detailed logging and error handling
   * Uses streaming approach to handle large files without memory issues
   */
  async decompress(data: Uint8Array): Promise<XzDecompressionResult> {
    const startTime = Date.now();
    const originalSize = data.length;

    try {
      // For large files, we need to use streaming to avoid memory issues
      // First, let's try to detect if this is likely to be a large file
      // XZ compression can have very high compression ratios, so be conservative
      const isLikelyLarge = originalSize > 10 * 1024 * 1024; // 10MB threshold
      
      if (isLikelyLarge) {
        return await this.decompressStreaming(data, startTime, originalSize);
      }

      // For smaller files, use the original approach
      return await this.decompressInMemory(data, startTime, originalSize);

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

  /**
   * Decompress XZ data using streaming approach for large files
   */
  private async decompressStreaming(data: Uint8Array, startTime: number, originalSize: number): Promise<XzDecompressionResult> {
    try {
      // Create a streaming decompressor
      const inputStream = new ReadableStream({
        start(controller) {
          controller.enqueue(data);
          controller.close();
        },
      });

      const xzStream = new XzReadableStream(inputStream);
      
      // Collect chunks as they come
      const chunks: Uint8Array[] = [];
      const reader = xzStream.getReader();
      
      let totalSize = 0;
      const maxSize = 100 * 1024 * 1024; // 100MB limit for preview
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        if (totalSize + value.length > maxSize) {
          // Truncate if too large
          const remaining = maxSize - totalSize;
          chunks.push(value.slice(0, remaining));
          totalSize = maxSize;
          break;
        }
        
        chunks.push(value);
        totalSize += value.length;
      }
      
      // Combine chunks
      const result = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Convert to string for analysis
      const xmlText = new TextDecoder().decode(result);
      
      // Check if this is a tar archive
      const isTarArchive = xmlText.includes("ustar") ||
        xmlText.includes("PaxHeader") ||
        xmlText.includes("GlobalHeader");

      if (isTarArchive) {
        return {
          success: true,
          data: xmlText,
          binaryData: result,
          originalSize,
          decompressedSize: xmlText.length,
          processingTime: Date.now() - startTime
        };
      }

      return {
        success: true,
        data: xmlText,
        originalSize,
        decompressedSize: xmlText.length,
        processingTime: Date.now() - startTime
      };

    } catch (err) {
      return {
        success: false,
        error: `Streaming XZ decompression failed: ${err instanceof Error ? err.message : String(err)}`,
        originalSize,
        decompressedSize: 0,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Decompress XZ data in memory for smaller files
   */
  private async decompressInMemory(data: Uint8Array, startTime: number, originalSize: number): Promise<XzDecompressionResult> {
    try {
      // Get both text and binary data to handle tar archives properly
      // Create separate streams/responses to avoid "body stream already read" error
      const textStream = new ReadableStream({
        start(controller) {
          controller.enqueue(data);
          controller.close();
        },
      });
      const binaryStream = new ReadableStream({
        start(controller) {
          controller.enqueue(data);
          controller.close();
        },
      });
      
      const [textData, binaryData] = await Promise.all([
        new Response(new XzReadableStream(textStream)).text(),
        new Response(new XzReadableStream(binaryStream)).arrayBuffer()
      ]);

      let xmlText: string;
      if (typeof textData === "string") {
        xmlText = textData;
      } else {
        xmlText = new TextDecoder().decode(textData);
      }

      // Check if this is a tar archive after XZ decompression
      const isTarArchive = xmlText.includes("ustar") ||
        xmlText.includes("PaxHeader") ||
        xmlText.includes("GlobalHeader");

      if (isTarArchive) {
        // Return binary data for tar extraction to avoid corruption
        return {
          success: true,
          data: xmlText,
          binaryData: new Uint8Array(binaryData),
          originalSize,
          decompressedSize: xmlText.length,
          processingTime: Date.now() - startTime
        };
      }

      return {
        success: true,
        data: xmlText,
        originalSize,
        decompressedSize: xmlText.length,
        processingTime: Date.now() - startTime
      };

    } catch (err) {
      return {
        success: false,
        error: `In-memory XZ decompression failed: ${err instanceof Error ? err.message : String(err)}`,
        originalSize,
        decompressedSize: 0,
        processingTime: Date.now() - startTime
      };
    }
  }
}
