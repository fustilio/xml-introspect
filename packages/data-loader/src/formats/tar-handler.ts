import tar from "tar-stream";

export interface TarExtractionResult {
  success: boolean;
  xmlContent?: string;
  error?: string;
  extractedFiles: string[];
  xmlFile?: string;
  xmlFiles: ExtractedFile[];
  processingTime: number;
}

export interface ExtractedFile {
  name: string;
  content: Uint8Array;
  size: number;
}

/**
 * Handles tar archive extraction to find XML files
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
   * Extract tar archive and find XML files
   */
  async extractTarArchive(tarBuffer: ArrayBuffer): Promise<TarExtractionResult> {
    const startTime = Date.now();

    return new Promise((resolve, reject) => {
      // Set a timeout to prevent hanging on large/complex tar files
      const timeout = setTimeout(() => {
        if (extractedFiles.length > 0 && xmlFile) {
          console.log(`Tar extraction timeout but found ${extractedFiles.length} files, using ${xmlFile}`);
          const xmlContent = new TextDecoder().decode(
            extractedFiles.find(f => f.name === xmlFile)!.content
          );
          
          const xmlFiles = extractedFiles.filter(f => f.name.endsWith('.xml'));
          console.log(`Found ${xmlFiles.length} XML files in archive:`);
          xmlFiles.forEach(f => {
            const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
            console.log(`  - ${f.name} (${sizeMB} MB)`);
          });
          
          resolve({
            success: true,
            xmlContent,
            extractedFiles: extractedFiles.map(f => f.name),
            xmlFile,
            xmlFiles,
            processingTime: Date.now() - startTime
          });
        } else {
          resolve({
            success: false,
            error: "Tar extraction timeout",
            extractedFiles: extractedFiles.map(f => f.name),
            xmlFiles: [],
            processingTime: Date.now() - startTime
          });
        }
      }, 30000); // 30 second timeout
      const extract = tar.extract();
      const extractedFiles: ExtractedFile[] = [];
      let xmlFile: string | null = null;

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


          // Check if this is an XML file
          if (header.name.endsWith(".xml")) {
            if (!xmlFile) {
              // Use the first XML file we find
              xmlFile = header.name;
            }
          }

          next();
        });
      });

      extract.on("finish", () => {
        clearTimeout(timeout);

        if (xmlFile) {
          const xmlContent = new TextDecoder().decode(
            extractedFiles.find(f => f.name === xmlFile)!.content
          );
          
          const endTime = Date.now();
          const processingTime = endTime - startTime;

          // Log information about all XML files found
          const xmlFiles = extractedFiles.filter(f => f.name.endsWith('.xml'));
          console.log(`Found ${xmlFiles.length} XML files in archive:`);
          xmlFiles.forEach(f => {
            const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
            console.log(`  - ${f.name} (${sizeMB} MB)`);
          });

          resolve({
            success: true,
            xmlContent,
            extractedFiles: extractedFiles.map(f => f.name),
            xmlFile,
            xmlFiles,
            processingTime
          });
        } else {
          // Look for any XML file and check its content
          const foundXmlFiles = extractedFiles.filter((file) =>
            file.name.endsWith(".xml")
          );
          
          if (foundXmlFiles.length > 0) {
            // Check if the XML content is valid
            const xmlContent = new TextDecoder().decode(foundXmlFiles[0].content);
            if (
              xmlContent.includes("<?xml") ||
              xmlContent.includes("<")
            ) {
              const endTime = Date.now();
              const processingTime = endTime - startTime;

              resolve({
                success: true,
                xmlContent,
                extractedFiles: extractedFiles.map(f => f.name),
                xmlFile: foundXmlFiles[0].name,
                xmlFiles: foundXmlFiles,
                processingTime
              });
            } else {
              const endTime = Date.now();
              const processingTime = endTime - startTime;

              resolve({
                success: false,
                error: "XML file found but content does not appear to be valid XML",
                extractedFiles: extractedFiles.map(f => f.name),
                xmlFiles: [],
                processingTime
              });
            }
          } else {
            const endTime = Date.now();
            const processingTime = endTime - startTime;

            resolve({
              success: false,
              error: "No XML files found in tar archive",
              extractedFiles: extractedFiles.map(f => f.name),
              xmlFiles: [],
              processingTime
            });
          }
        }
      });

      extract.on("error", (err: any) => {
        clearTimeout(timeout);
        const endTime = Date.now();
        const processingTime = endTime - startTime;

        // If we have successfully extracted some files, try to use them
        if (extractedFiles.length > 0 && xmlFile) {
          console.log(`Tar extraction hit error but found ${extractedFiles.length} files, using ${xmlFile}`);
          const xmlContent = new TextDecoder().decode(
            extractedFiles.find(f => f.name === xmlFile)!.content
          );
          
          const xmlFiles = extractedFiles.filter(f => f.name.endsWith('.xml'));
          console.log(`Found ${xmlFiles.length} XML files in archive:`);
          xmlFiles.forEach(f => {
            const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
            console.log(`  - ${f.name} (${sizeMB} MB)`);
          });
          
          resolve({
            success: true,
            xmlContent,
            extractedFiles: extractedFiles.map(f => f.name),
            xmlFile,
            xmlFiles,
            processingTime
          });
        } else {
          resolve({
            success: false,
            error: err instanceof Error ? err.message : String(err),
            extractedFiles: extractedFiles.map(f => f.name),
            xmlFiles: [],
            processingTime
          });
        }
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
          xmlFiles: [],
          processingTime
        });
      });
    });
  }
}
