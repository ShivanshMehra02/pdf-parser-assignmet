import { Injectable } from '@nestjs/common';
import { v2 as Translate } from '@google-cloud/translate';
import { RawTransaction } from './pdf-parser.service';

export interface TranslatedTransaction extends RawTransaction {
  buyerName?: string;
  sellerName?: string;
}

@Injectable()
export class TranslationService {
  private translate: Translate.Translate;

  constructor() {
    // Initialize Google Translate client using API key
    this.translate = new Translate.Translate({
      key: process.env.GOOGLE_TRANSLATE_API_KEY,
    });
  }

  /**
   * Translates all eligible Tamil fields for a list of transactions.
   * A small delay is added between requests to avoid rate limiting.
   */
  async translateTransactions(
    transactions: RawTransaction[],
  ): Promise<TranslatedTransaction[]> {
    const results: TranslatedTransaction[] = [];

    for (const txn of transactions) {
      results.push(await this.translateSingle(txn));
      await this.delay(100);
    }

    return results;
  }

  /**
   * Translates individual fields of a single transaction
   * only if Tamil text is detected.
   */
  private async translateSingle(
    txn: RawTransaction,
  ): Promise<TranslatedTransaction> {
    const translated: TranslatedTransaction = { ...txn };

    try {
      if (txn.sellerNameTamil && this.containsTamil(txn.sellerNameTamil)) {
        translated.sellerName = await this.translateText(
          txn.sellerNameTamil,
        );
      }

      if (txn.buyerNameTamil && this.containsTamil(txn.buyerNameTamil)) {
        translated.buyerName = await this.translateText(
          txn.buyerNameTamil,
        );
      }

      if (txn.village && this.containsTamil(txn.village)) {
        translated.village = await this.translateText(txn.village);
      }

      if (txn.boundaryDetails && this.containsTamil(txn.boundaryDetails)) {
        translated.boundaryDetails = await this.translateText(
          txn.boundaryDetails,
        );
      }

      if (txn.scheduleRemarks && this.containsTamil(txn.scheduleRemarks)) {
        translated.scheduleRemarks = await this.translateText(
          txn.scheduleRemarks,
        );
      }
    } catch (err) {
      // Translation failures should not block processing
      console.error('Translation error, skipping:', err);
    }

    return translated;
  }

  /**
   * Translates Tamil text into English using Google Translate API.
   */
  private async translateText(text: string): Promise<string> {
    const [translated] = await this.translate.translate(text, {
      from: 'ta',
      to: 'en',
    });

    return translated;
  }

  /**
   * Checks whether the given text contains Tamil characters.
   */
  private containsTamil(text: string): boolean {
    return /[\u0B80-\u0BFF]/.test(text);
  }

  /**
   * Simple delay utility to control request rate.
   */
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
