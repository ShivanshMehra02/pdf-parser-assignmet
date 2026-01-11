import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { RawTransaction } from './pdf-parser.service';
import * as dotenv from 'dotenv';

dotenv.config();

export interface TranslatedTransaction extends RawTransaction {
  buyerName?: string;
  sellerName?: string;
}

@Injectable()
export class TranslationService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async translateTransactions(transactions: RawTransaction[]): Promise<TranslatedTransaction[]> {
    const translatedTransactions: TranslatedTransaction[] = [];

    // Process in batches to avoid rate limits
    const batchSize = 10;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      const translatedBatch = await Promise.all(
        batch.map(txn => this.translateSingleTransaction(txn))
      );
      
      translatedTransactions.push(...translatedBatch);
      
      // Small delay between batches to avoid rate limits
      if (i + batchSize < transactions.length) {
        await this.delay(500);
      }
    }

    return translatedTransactions;
  }

  private async translateSingleTransaction(txn: RawTransaction): Promise<TranslatedTransaction> {
    const translatedTxn: TranslatedTransaction = { ...txn };

    try {
      // Translate seller name (Tamil to English)
      if (txn.sellerNameTamil) {
        translatedTxn.sellerName = await this.translateText(txn.sellerNameTamil, 'seller name');
      }

      // Translate buyer name (Tamil to English)
      if (txn.buyerNameTamil) {
        translatedTxn.buyerName = await this.translateText(txn.buyerNameTamil, 'buyer name');
      }

      // Translate boundary details if present
      if (txn.boundaryDetails && this.containsTamil(txn.boundaryDetails)) {
        translatedTxn.boundaryDetails = await this.translateText(txn.boundaryDetails, 'property boundary details');
      }

      // Translate schedule remarks if present
      if (txn.scheduleRemarks && this.containsTamil(txn.scheduleRemarks)) {
        translatedTxn.scheduleRemarks = await this.translateText(txn.scheduleRemarks, 'property schedule remarks');
      }

      // Translate village name if in Tamil
      if (txn.village && this.containsTamil(txn.village)) {
        translatedTxn.village = await this.translateText(txn.village, 'village name');
      }

    } catch (error) {
      console.error('Translation error:', error);
      // Return original with partial translations on error
      translatedTxn.sellerName = txn.sellerNameTamil ? this.transliterate(txn.sellerNameTamil) : undefined;
      translatedTxn.buyerName = txn.buyerNameTamil ? this.transliterate(txn.buyerNameTamil) : undefined;
    }

    return translatedTxn;
  }

  private async translateText(text: string, context: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      return text;
    }

    // Check if text contains Tamil characters
    if (!this.containsTamil(text)) {
      return text; // Already in English
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a Tamil to English translator specializing in Indian real estate documents. 
            Translate the given Tamil text to English. 
            For names, use transliteration that preserves the original pronunciation.
            For places and common terms, use standard English equivalents.
            Context: This is a ${context} from a Tamil Nadu property transaction document.
            Return ONLY the translated text, nothing else.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content?.trim() || this.transliterate(text);
    } catch (error) {
      console.error('OpenAI translation error:', error);
      // Fallback to basic transliteration
      return this.transliterate(text);
    }
  }

  // Batch translate for efficiency
  async translateBatch(texts: string[], context: string): Promise<string[]> {
    if (texts.length === 0) return [];

    const tamilTexts = texts.filter(t => this.containsTamil(t));
    
    if (tamilTexts.length === 0) {
      return texts;
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a Tamil to English translator specializing in Indian real estate documents.
            Translate each Tamil text to English, preserving names through transliteration.
            Context: These are ${context} from Tamil Nadu property transaction documents.
            Return translations as a JSON array of strings in the same order.`
          },
          {
            role: 'user',
            content: JSON.stringify(tamilTexts)
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices[0]?.message?.content?.trim();
      if (content) {
        try {
          return JSON.parse(content);
        } catch {
          return texts.map(t => this.containsTamil(t) ? this.transliterate(t) : t);
        }
      }
    } catch (error) {
      console.error('Batch translation error:', error);
    }

    return texts.map(t => this.containsTamil(t) ? this.transliterate(t) : t);
  }

  private containsTamil(text: string): boolean {
    // Tamil Unicode range: \u0B80-\u0BFF
    return /[\u0B80-\u0BFF]/.test(text);
  }

  // Basic Tamil to English transliteration map
  private transliterate(tamil: string): string {
    const tamilToEnglish: { [key: string]: string } = {
      'அ': 'a', 'ஆ': 'aa', 'இ': 'i', 'ஈ': 'ee', 'உ': 'u', 'ஊ': 'oo',
      'எ': 'e', 'ஏ': 'ae', 'ஐ': 'ai', 'ஒ': 'o', 'ஓ': 'oo', 'ஔ': 'au',
      'க': 'ka', 'ங': 'nga', 'ச': 'sa', 'ஞ': 'nya', 'ட': 'ta', 'ண': 'na',
      'த': 'tha', 'ந': 'na', 'ப': 'pa', 'ம': 'ma', 'ய': 'ya', 'ர': 'ra',
      'ல': 'la', 'வ': 'va', 'ழ': 'zha', 'ள': 'la', 'ற': 'ra', 'ன': 'na',
      'ஜ': 'ja', 'ஷ': 'sha', 'ஸ': 'sa', 'ஹ': 'ha',
      'ா': 'a', 'ி': 'i', 'ீ': 'ee', 'ு': 'u', 'ூ': 'oo',
      'ெ': 'e', 'ே': 'ae', 'ை': 'ai', 'ொ': 'o', 'ோ': 'oo', 'ௌ': 'au',
      '்': '', 'ஃ': 'h',
      // Common patterns
      'செ': 'se', 'ல்': 'l', 'வ': 'v', 'மு': 'mu', 'த்': 'th', 'து': 'thu',
      'கு': 'ku', 'மா': 'ma', 'ரா': 'ra', 'சா': 'sa', 'மி': 'mi',
    };

    let result = tamil;
    
    // Replace Tamil characters with English equivalents
    for (const [tamil_char, english] of Object.entries(tamilToEnglish)) {
      result = result.replace(new RegExp(tamil_char, 'g'), english);
    }

    // Clean up any remaining Tamil characters
    result = result.replace(/[\u0B80-\u0BFF]/g, '');
    
    // Clean up extra spaces
    result = result.replace(/\s+/g, ' ').trim();

    return result || tamil;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
