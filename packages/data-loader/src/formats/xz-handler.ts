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
   * Check if binary data appears to be a tar archive without converting to string
   */
  private isTarArchiveInBinary(data: Uint8Array): boolean {
    // Check for tar magic bytes in the first few KB
    const sampleSize = Math.min(data.length, 10 * 1024); // First 10KB
    const sample = data.slice(0, sampleSize);
    
    // Convert sample to string for pattern matching
    const sampleText = new TextDecoder().decode(sample);
    
    return (
      sampleText.includes("ustar") ||
      sampleText.includes("PaxHeader") ||
      sampleText.includes("GlobalHeader") ||
      // Check for tar file entries (e.g., "omw-fr/0000755...")
      /^[a-zA-Z0-9_-]+\/0000[0-7]{3}[0-9]{6}[0-9]{6}[0-9]{6}[0-9]{6}[0-9]{6}/m.test(sampleText)
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
        try {
          // For very large files, use streaming to avoid string length limits
          console.log('Large file detected, using streaming decompression to avoid memory limits...');
          return await this.decompressStreaming(data, startTime, originalSize);
        } catch (error) {
          // If streaming fails, try in-memory as fallback
          console.log(`Streaming XZ decompression failed, falling back to in-memory: ${error instanceof Error ? error.message : String(error)}`);
          return await this.decompressInMemory(data, startTime, originalSize);
        }
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
    // Set a timeout for XZ decompression
    const decompressionTimeout = setTimeout(() => {
      console.log('XZ decompression timeout - this may indicate a very large or complex archive');
    }, 60000); // 60 second timeout
    
    try {
      // Create a streaming decompressor with timeout
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
      const maxSize = 1000 * 1024 * 1024; // 1GB limit for very large files
      
      try {
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
      } catch (error) {
        clearTimeout(decompressionTimeout);
        // If we hit an error during streaming but have some data, try to use it
        if (chunks.length > 0) {
          console.log(`XZ streaming hit error but got ${chunks.length} chunks, attempting to use partial data`);
          console.log(`Error was: ${error instanceof Error ? error.message : String(error)}`);
          // Continue with what we have
        } else {
          console.log(`XZ streaming failed completely: ${error instanceof Error ? error.message : String(error)}`);
          throw error;
        }
      }
      
      clearTimeout(decompressionTimeout);
      
      // Combine chunks
      const result = new Uint8Array(totalSize);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      
      // For very large files, avoid converting to string to prevent memory issues
      // Instead, check for tar archive indicators in the binary data
      const isTarArchive = this.isTarArchiveInBinary(result);
      
      if (isTarArchive) {
        // For tar archives, return binary data and a truncated string for analysis
        const truncatedText = new TextDecoder().decode(result.slice(0, Math.min(result.length, 10 * 1024 * 1024))); // First 10MB as text
        return {
          success: true,
          data: truncatedText,
          binaryData: result,
          originalSize,
          decompressedSize: result.length,
          processingTime: Date.now() - startTime
        };
      }

      // For non-tar files, convert to string but truncate if too large
      const maxStringLength = 100 * 1024 * 1024; // 100MB string limit
      const textToConvert = result.length > maxStringLength ? result.slice(0, maxStringLength) : result;
      const xmlText = new TextDecoder().decode(textToConvert);
      
      return {
        success: true,
        data: xmlText,
        originalSize,
        decompressedSize: result.length,
        processingTime: Date.now() - startTime
      };

    } catch (err) {
      clearTimeout(decompressionTimeout);
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
