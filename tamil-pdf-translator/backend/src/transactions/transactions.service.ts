import { Injectable } from '@nestjs/common';
import { eq, like, and, sql, ilike, or } from 'drizzle-orm';
import { db } from '../db/db.module';
import { transactions, NewTransaction, Transaction } from '../db/schema';
import { PdfParserService } from './pdf-parser.service';
import { TranslationService } from './translation.service';

export interface SearchFilters {
  buyerName?: string;
  sellerName?: string;
  houseNumber?: string;
  surveyNumber?: string;
  documentNumber?: string;
}

@Injectable()
export class TransactionsService {
  constructor(
    private pdfParserService: PdfParserService,
    private translationService: TranslationService,
  ) {}

  async processAndStorePdf(fileBuffer: Buffer, fileName: string): Promise<Transaction[]> {
    console.log(`📄 Processing PDF: ${fileName}`);
    
    // Step 1: Parse PDF to extract Tamil text
    const rawTransactions = await this.pdfParserService.parsePdf(fileBuffer);
    console.log(`📝 Extracted ${rawTransactions.length} transactions from PDF`);

    // Step 2: Translate Tamil fields to English
    const translatedTransactions = await this.translationService.translateTransactions(rawTransactions);
    console.log(`🌐 Translated ${translatedTransactions.length} transactions`);

    // Step 3: Store in database
    const insertedTransactions: Transaction[] = [];
    
    for (const txn of translatedTransactions) {
      const newTransaction: NewTransaction = {
        documentNumber: txn.documentNumber,
        documentYear: txn.documentYear,
        documentDate: txn.documentDate,
        executionDate: txn.executionDate,
        presentationDate: txn.presentationDate,
        natureOfDocument: txn.natureOfDocument,
        buyerName: txn.buyerName,
        buyerNameTamil: txn.buyerNameTamil,
        sellerName: txn.sellerName,
        sellerNameTamil: txn.sellerNameTamil,
        houseNumber: txn.houseNumber,
        surveyNumber: txn.surveyNumber,
        plotNumber: txn.plotNumber,
        propertyType: txn.propertyType,
        propertyExtent: txn.propertyExtent,
        village: txn.village,
        street: txn.street,
        considerationValue: txn.considerationValue?.toString(),
        marketValue: txn.marketValue?.toString(),
        volumeNumber: txn.volumeNumber,
        pageNumber: txn.pageNumber,
        boundaryDetails: txn.boundaryDetails,
        scheduleRemarks: txn.scheduleRemarks,
        documentRemarks: txn.documentRemarks,
        previousDocumentNumber: txn.previousDocumentNumber,
        pdfFileName: fileName,
      };

      const [inserted] = await db
        .insert(transactions)
        .values(newTransaction)
        .returning();
      
      insertedTransactions.push(inserted);
    }

    console.log(`✅ Inserted ${insertedTransactions.length} transactions into database`);
    return insertedTransactions;
  }

  async findAll(filters: SearchFilters): Promise<Transaction[]> {
    const conditions = [];

    if (filters.buyerName) {
      conditions.push(ilike(transactions.buyerName, `%${filters.buyerName}%`));
    }
    if (filters.sellerName) {
      conditions.push(ilike(transactions.sellerName, `%${filters.sellerName}%`));
    }
    if (filters.houseNumber) {
      conditions.push(ilike(transactions.houseNumber, `%${filters.houseNumber}%`));
    }
    if (filters.surveyNumber) {
      conditions.push(ilike(transactions.surveyNumber, `%${filters.surveyNumber}%`));
    }
    if (filters.documentNumber) {
      conditions.push(ilike(transactions.documentNumber, `%${filters.documentNumber}%`));
    }

    if (conditions.length === 0) {
      return db.select().from(transactions).orderBy(transactions.id);
    }

    return db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(transactions.id);
  }

  async findById(id: number): Promise<Transaction | null> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    
    return transaction || null;
  }

  async deleteAll(): Promise<void> {
    await db.delete(transactions);
  }
}
