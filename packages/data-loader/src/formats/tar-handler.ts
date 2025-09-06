import tar from "tar-stream";

export interface TarExtractionResult {
  success: boolean;
  xmlContent?: string;
  error?: string;
  extractedFiles: string[];
  lmfFile?: string;
  processingTime: number;
}

export interface ExtractedFile {
  name: string;
  content: Uint8Array;
  size: number;
}

/**
 * Handles tar archive extraction to find LMF XML files
 */
export class TarHandler {

  /**
   * Check if content appears to be a tar archive
   */
  isTarArchive(content: string): boolean {
    return (
      content.includes("ustar") ||
      content.includes("PaxHeader") ||
      content.includes("GlobalHeader") ||
      // Check for tar file entries (e.g., "omw-fr/0000755...")
      /^[a-zA-Z0-9_-]+\/0000[0-7]{3}[0-9]{6}[0-9]{6}[0-9]{6}[0-9]{6}[0-9]{6}/m.test(content)
    );
  }

  /**
   * Extract tar archive and find LMF XML files
   */
  async extractTarArchive(tarBuffer: ArrayBuffer): Promise<TarExtractionResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      const extract = tar.extract();
      const extractedFiles: ExtractedFile[] = [];
      let lmfFile: string | null = null;

      extract.on("entry", (header: any, stream: any, next: any) => {
        const chunks: Uint8Array[] = [];

        stream.on("data", (chunk: Uint8Array) => {
          chunks.push(chunk);
        });

        stream.on("end", () => {
          // Browser-compatible alternative to Buffer.concat(chunks)
          const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const content = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            content.set(chunk, offset);
            offset += chunk.length;
          }
          
          const extractedFile: ExtractedFile = {
            name: header.name,
            content,
            size: content.length
          };
          
          extractedFiles.push(extractedFile);


          // Check if this is an LMF XML file - be more flexible with naming
          if (header.name.endsWith(".xml")) {
            const fileName = header.name.toLowerCase();
            if (
              fileName.includes("wn-data-") ||
              fileName.includes("wordnet") ||
              fileName.includes("lmf") ||
              fileName.includes("omw") ||
              fileName.includes("wolf") ||
              fileName.includes("thai") ||
              fileName.includes("french")
            ) {
              lmfFile = header.name;
            }
          }

          next();
        });
      });

      extract.on("finish", () => {

        if (lmfFile) {
          const xmlContent = new TextDecoder().decode(
            extractedFiles.find(f => f.name === lmfFile)!.content
          );
          
          const endTime = Date.now();
          const processingTime = endTime - startTime;

          resolve({
            success: true,
            xmlContent,
            extractedFiles: extractedFiles.map(f => f.name),
            lmfFile,
            processingTime
          });
        } else {
          // Look for any XML file and check its content
          const xmlFiles = extractedFiles.filter((file) =>
            file.name.endsWith(".xml")
          );
          
          if (xmlFiles.length > 0) {
            // Check if the XML content looks like LMF
            const xmlContent = new TextDecoder().decode(xmlFiles[0].content);
            if (
              xmlContent.includes("<LexicalResource") ||
              xmlContent.includes("<lexicon")
            ) {
              const endTime = Date.now();
              const processingTime = endTime - startTime;

              resolve({
                success: true,
                xmlContent,
                extractedFiles: extractedFiles.map(f => f.name),
                lmfFile: xmlFiles[0].name,
                processingTime
              });
            } else {
              const endTime = Date.now();
              const processingTime = endTime - startTime;

              resolve({
                success: false,
                error: "XML file found but content does not appear to be LMF",
                extractedFiles: extractedFiles.map(f => f.name),
                processingTime
              });
            }
          } else {
            const endTime = Date.now();
            const processingTime = endTime - startTime;

            resolve({
              success: false,
              error: "No LMF or XML files found in tar archive",
              extractedFiles: extractedFiles.map(f => f.name),
              processingTime
            });
          }
        }
      });

      extract.on("error", (err: any) => {
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        resolve({
          success: false,
          error: err instanceof Error ? err.message : String(err),
          extractedFiles: extractedFiles.map(f => f.name),
          processingTime
        });
      });

      // Convert ArrayBuffer to ReadableStream for tar-stream
      const tarStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new Uint8Array(tarBuffer));
          controller.close();
        },
      });

      // Pipe the stream to the tar extractor
      tarStream.pipeTo(
        new WritableStream({
          write(chunk: Uint8Array) {
            extract.write(chunk);
          },
          close() {
            extract.end();
          },
        })
      ).catch((error) => {
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        resolve({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          extractedFiles: extractedFiles.map(f => f.name),
          processingTime
        });
      });
    });
  }
}
