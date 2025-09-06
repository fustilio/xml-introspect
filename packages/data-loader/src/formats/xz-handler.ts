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
   */
  async decompress(data: Uint8Array): Promise<XzDecompressionResult> {
    const startTime = Date.now();
    const originalSize = data.length;


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
