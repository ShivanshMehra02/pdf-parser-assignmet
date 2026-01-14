import { Injectable } from '@nestjs/common';
import pdfParse from 'pdf-parse';

/**
 * Represents a single registration/document entry
 * extracted from the PDF text.
 */
export interface RawTransaction {
  documentNumber?: string;
  documentYear?: string;

  documentDate?: string;
  executionDate?: string;
  presentationDate?: string;

  natureOfDocument?: string;

  buyerNameTamil?: string;
  sellerNameTamil?: string;
  buyerName?: string;
  sellerName?: string;

  houseNumber?: string;
  surveyNumber?: string;
  plotNumber?: string;

  propertyType?: string;
  propertyExtent?: string;

  village?: string;
  street?: string;

  considerationValue?: number;
  marketValue?: number;

  volumeNumber?: string;
  pageNumber?: string;

  boundaryDetails?: string;
  scheduleRemarks?: string;
  documentRemarks?: string;

  previousDocumentNumber?: string;
}

@Injectable()
export class PdfParserService {
  /**
   * Parses the uploaded PDF buffer and returns
   * structured transaction data extracted from it.
   */
  async parsePdf(buffer: Buffer): Promise<RawTransaction[]> {
    const pdfData = await pdfParse(buffer);
    const text = pdfData.text ?? '';

    console.log(`PDF pages: ${pdfData.numpages}`);
    return this.extractTransactions(text);
  }

  /**
   * Splits the raw PDF text into logical document blocks
   * and extracts fields from each block.
   */
  private extractTransactions(text: string): RawTransaction[] {
    if (!text) return [];

    // Documents are identified by patterns like "123/2013"
    const blocks = text
      .replace(/\r/g, '')
      .split(/\n(?=\d+\/\d{4})/)
      .map(b => b.trim())
      .filter(b => b.length > 80);

    const results: RawTransaction[] = [];

    for (const block of blocks) {
      const docMatch = block.match(/(\d+)\/(\d{4})/);
      if (!docMatch) continue;

      // Dates usually appear in a predictable order within a block
      const dates =
        block.match(/\d{1,2}-[A-Za-z]{3}-\d{4}|\d{1,2}\/\d{1,2}\/\d{4}/g) ?? [];

      // Extract Tamil text segments and remove duplicates/noise
      const tamilNamesRaw =
        block.match(/[\u0B80-\u0BFF][\u0B80-\u0BFF\s\.]{2,}/g) ?? [];

      const tamilNames = Array.from(
        new Set(
          tamilNamesRaw
            .map(n => n.replace(/\.+/g, '').trim())
            .filter(n => n.length > 3),
        ),
      );

      results.push({
        documentNumber: docMatch[1],
        documentYear: docMatch[2],

        documentDate: dates[0],
        executionDate: dates[1],

        natureOfDocument: block.includes('Conveyance')
          ? 'Conveyance'
          : undefined,

        propertyType: block.includes('House Site')
          ? 'House Site'
          : undefined,

        considerationValue: this.parseAmount(block),

        // Field-specific extraction helpers
        surveyNumber: this.extractSurveyNumber(block),
        plotNumber: this.extractPlotNumber(block),
        propertyExtent: this.extractPropertyExtent(block),
        village: this.extractVillage(block),

        // Based on observed ordering in sample documents
        sellerNameTamil: tamilNames[0],
        buyerNameTamil: tamilNames[1],

        // These fields are not reliably present in the PDF text
        buyerName: undefined,
        sellerName: undefined,
        houseNumber: undefined,
        street: undefined,
        volumeNumber: undefined,
        pageNumber: undefined,
        boundaryDetails: undefined,
        scheduleRemarks: undefined,
        documentRemarks: undefined,
        previousDocumentNumber: undefined,
      });
    }

    console.log(`Parsed ${results.length} transactions`);
    return results;
  }

  /**
   * Extracts the consideration value from the document text.
   * Handles both text-based and symbol-based currency formats.
   */
  private parseAmount(block: string): number | undefined {
    const match =
      block.match(/Consideration Value[\s\S]*?ரூ\.\s*([\d,]+)/) ||
      block.match(/₹\s*([\d,]+)/);

    if (!match) return undefined;

    const value = Number(match[1].replace(/,/g, ''));
    return Number.isFinite(value) && value > 0 ? value : undefined;
  }

  /**
   * Extracts survey numbers in either English or Tamil format.
   */
  private extractSurveyNumber(block: string): string | undefined {
    const match =
      block.match(/Survey No.*?:\s*([0-9,\/\s]+)/i) ||
      block.match(/புல எண்\s*:\s*([0-9,\/\s]+)/);

    return match ? match[1].trim() : undefined;
  }

  /**
   * Extracts plot number if present in the document.
   */
  private extractPlotNumber(block: string): string | undefined {
    const match =
      block.match(/Plot No.*?:\s*([0-9]+)/i) ||
      block.match(/மைன எண்\s*:\s*([0-9]+)/);

    return match ? match[1].trim() : undefined;
  }

  /**
   * Extracts property extent along with its unit.
   */
  private extractPropertyExtent(block: string): string | undefined {
    const match = block.match(
      /Property Extent.*?:\s*([\d\.]+\s*ச\.மீட்டர்)/,
    );
    return match ? match[1].trim() : undefined;
  }

  /**
   * Extracts village name from English or Tamil labels.
   */
  private extractVillage(block: string): string | undefined {
    const match =
      block.match(/Village.*?:\s*([A-Za-z\s]+)/i) ||
      block.match(/கிராமம்.*?:\s*([A-Za-z\s]+)/);

    return match ? match[1].trim() : undefined;
  }
}
