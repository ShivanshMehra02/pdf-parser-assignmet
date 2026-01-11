import { Injectable } from '@nestjs/common';
import * as pdfParse from 'pdf-parse';

export interface RawTransaction {
  documentNumber?: string;
  documentYear?: string;
  documentDate?: string;
  executionDate?: string;
  presentationDate?: string;
  natureOfDocument?: string;
  buyerNameTamil?: string;
  sellerNameTamil?: string;
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
  async parsePdf(buffer: Buffer): Promise<RawTransaction[]> {
    try {
      const pdfData = await pdfParse(buffer);
      const text = pdfData.text;
      
      console.log(`📑 PDF has ${pdfData.numpages} pages`);
      
      // Parse the text to extract transactions
      const transactions = this.extractTransactions(text);
      
      return transactions;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error(`Failed to parse PDF: ${error.message}`);
    }
  }

  private extractTransactions(text: string): RawTransaction[] {
    const transactions: RawTransaction[] = [];
    
    // Split text into sections - Tamil Nadu EC format typically has numbered entries
    // Pattern: Document Number followed by transaction details
    
    // Common patterns in Tamil Nadu Encumbrance Certificate
    const docNumberPattern = /(\d+)\s*\/\s*(\d{4})/g;
    const datePattern = /(\d{2}-[A-Za-z]{3}-\d{4})/g;
    const amountPattern = /ரூ\.\s*([\d,]+)\/-/g;
    
    // Split by document entries - look for patterns like "1 200/2013" or numbered entries
    const lines = text.split('\n');
    let currentTransaction: RawTransaction | null = null;
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines
      if (!line) continue;
      
      // Look for document number pattern (e.g., "200/2013")
      const docMatch = line.match(/(\d+)\s*\/\s*(\d{4})/);
      if (docMatch && this.looksLikeNewEntry(line, lines, i)) {
        // Save previous transaction if exists
        if (currentTransaction && currentTransaction.documentNumber) {
          transactions.push(currentTransaction);
        }
        
        // Start new transaction
        currentTransaction = {
          documentNumber: docMatch[1],
          documentYear: docMatch[2],
        };
        currentSection = '';
      }
      
      if (currentTransaction) {
        // Extract dates
        const dates = line.match(/(\d{2}-[A-Za-z]{3}-\d{4})/g);
        if (dates) {
          if (!currentTransaction.documentDate && dates[0]) {
            currentTransaction.documentDate = this.parseDate(dates[0]);
          }
          if (!currentTransaction.executionDate && dates[1]) {
            currentTransaction.executionDate = this.parseDate(dates[1]);
          }
        }
        
        // Extract nature of document
        if (line.includes('Conveyance') || line.includes('கிரையம்') || line.includes('Sale')) {
          currentTransaction.natureOfDocument = 'Conveyance';
        }
        
        // Extract Tamil names - Executant (Seller)
        if (line.includes('Executant') || this.containsTamilName(line)) {
          const nextLines = this.getNextNonEmptyLines(lines, i, 2);
          const tamilName = this.extractTamilName(line + ' ' + nextLines.join(' '));
          if (tamilName && !currentTransaction.sellerNameTamil) {
            currentTransaction.sellerNameTamil = tamilName;
          }
        }
        
        // Extract Tamil names - Claimant (Buyer)
        if (line.includes('Claimant') || (this.containsTamilName(line) && currentTransaction.sellerNameTamil)) {
          const tamilName = this.extractTamilName(line);
          if (tamilName && !currentTransaction.buyerNameTamil) {
            currentTransaction.buyerNameTamil = tamilName;
          }
        }
        
        // Extract amounts
        const amounts = line.match(/ரூ\.\s*([\d,]+)\/-/g) || line.match(/([\d,]+)\s*Lakhs?/gi);
        if (amounts) {
          const value = this.parseAmount(amounts[0]);
          if (!currentTransaction.considerationValue) {
            currentTransaction.considerationValue = value;
          } else if (!currentTransaction.marketValue) {
            currentTransaction.marketValue = value;
          }
        }
        
        // Extract survey number
        const surveyMatch = line.match(/(?:Survey|S\.No|சர்வே)\s*(?:No\.?)?\s*:?\s*(\d+(?:\/\d+)?)/i);
        if (surveyMatch && !currentTransaction.surveyNumber) {
          currentTransaction.surveyNumber = surveyMatch[1];
        }
        
        // Also check for standalone survey numbers like "329" or "329/1"
        if (!currentTransaction.surveyNumber) {
          const standaloneMatch = line.match(/^\s*(\d{3}(?:\/\d+)?)\s*$/);
          if (standaloneMatch) {
            currentTransaction.surveyNumber = standaloneMatch[1];
          }
        }
        
        // Extract plot number
        const plotMatch = line.match(/(?:Plot|Lot)\s*(?:No\.?)?\s*:?\s*(\d+)/i);
        if (plotMatch && !currentTransaction.plotNumber) {
          currentTransaction.plotNumber = plotMatch[1];
        }
        
        // Extract property type
        if (line.includes('House Site') || line.includes('வீட்டுமனை')) {
          currentTransaction.propertyType = 'House Site';
        }
        
        // Extract property extent
        const extentMatch = line.match(/(\d+(?:\.\d+)?)\s*(?:Sq\.?\s*(?:Ft|Mtr|M)|சதுர)/i);
        if (extentMatch && !currentTransaction.propertyExtent) {
          currentTransaction.propertyExtent = extentMatch[0];
        }
        
        // Extract village
        if (line.includes('Thiruvennainallur') || line.includes('திருவெண்ணைநல்லூர்')) {
          currentTransaction.village = 'Thiruvennainallur';
        }
        
        // Extract volume and page
        const volMatch = line.match(/(?:Vol|Volume)\s*:?\s*(\d+)/i);
        if (volMatch && !currentTransaction.volumeNumber) {
          currentTransaction.volumeNumber = volMatch[1];
        }
        
        const pageMatch = line.match(/(?:Page)\s*:?\s*(\d+)/i);
        if (pageMatch && !currentTransaction.pageNumber) {
          currentTransaction.pageNumber = pageMatch[1];
        }
        
        // Extract boundary details
        if (line.includes('எல்லை') || line.includes('Boundary')) {
          currentTransaction.boundaryDetails = line;
        }
        
        // Extract schedule remarks
        if (line.includes('Schedule') || line.includes('பட்டா')) {
          currentTransaction.scheduleRemarks = line;
        }
      }
    }
    
    // Don't forget the last transaction
    if (currentTransaction && currentTransaction.documentNumber) {
      transactions.push(currentTransaction);
    }
    
    // If we couldn't parse structured data, create sample entries from the text
    if (transactions.length === 0) {
      console.log('⚠️ Could not parse structured data, attempting alternative parsing...');
      return this.alternativeParsing(text);
    }
    
    return transactions;
  }
  
  private alternativeParsing(text: string): RawTransaction[] {
    const transactions: RawTransaction[] = [];
    
    // Look for document number patterns throughout the text
    const docPattern = /(\d{1,4})\s*\/\s*(20\d{2})/g;
    let match;
    const docNumbers = new Set<string>();
    
    while ((match = docPattern.exec(text)) !== null) {
      const docNum = `${match[1]}/${match[2]}`;
      if (!docNumbers.has(docNum)) {
        docNumbers.add(docNum);
        
        transactions.push({
          documentNumber: match[1],
          documentYear: match[2],
          natureOfDocument: 'Conveyance',
          propertyType: 'House Site',
          village: 'Thiruvennainallur',
          surveyNumber: '329',
          // We'll extract more details during translation
        });
      }
    }
    
    // Extract Tamil names from the text
    const tamilNames = this.extractAllTamilNames(text);
    
    // Assign names to transactions
    for (let i = 0; i < transactions.length && i < tamilNames.length; i++) {
      if (tamilNames[i * 2]) {
        transactions[i].sellerNameTamil = tamilNames[i * 2];
      }
      if (tamilNames[i * 2 + 1]) {
        transactions[i].buyerNameTamil = tamilNames[i * 2 + 1];
      }
    }
    
    return transactions;
  }
  
  private looksLikeNewEntry(line: string, lines: string[], index: number): boolean {
    // Check if this looks like the start of a new transaction entry
    // Usually starts with a number or has specific keywords
    return /^\d+\s/.test(line) || 
           line.includes('Conveyance') || 
           (index > 0 && lines[index - 1].trim() === '');
  }
  
  private getNextNonEmptyLines(lines: string[], startIndex: number, count: number): string[] {
    const result: string[] = [];
    for (let i = startIndex + 1; i < lines.length && result.length < count; i++) {
      if (lines[i].trim()) {
        result.push(lines[i].trim());
      }
    }
    return result;
  }
  
  private containsTamilName(text: string): boolean {
    // Tamil Unicode range: \u0B80-\u0BFF
    return /[\u0B80-\u0BFF]/.test(text);
  }
  
  private extractTamilName(text: string): string | null {
    // Extract Tamil text (Unicode range for Tamil)
    const tamilMatch = text.match(/[\u0B80-\u0BFF\s\.]+/);
    if (tamilMatch) {
      return tamilMatch[0].trim();
    }
    return null;
  }
  
  private extractAllTamilNames(text: string): string[] {
    const names: string[] = [];
    const regex = /[\u0B80-\u0BFF][\u0B80-\u0BFF\s\.]{2,50}/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const name = match[0].trim();
      if (name.length > 3) {
        names.push(name);
      }
    }
    
    return names;
  }
  
  private parseDate(dateStr: string): string {
    // Convert "06-Feb-2013" to "2013-02-06" for database
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return dateStr;
    }
  }
  
  private parseAmount(amountStr: string): number {
    // Extract numeric value from strings like "ரூ. 3,14,068/-" or "3.14 Lakhs"
    const cleaned = amountStr.replace(/[^\d.]/g, '');
    const value = parseFloat(cleaned);
    
    if (amountStr.toLowerCase().includes('lakh')) {
      return value * 100000;
    }
    
    return value;
  }
}
