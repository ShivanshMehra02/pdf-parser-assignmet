import { Injectable, Inject } from '@nestjs/common';
import { eq, and, ilike, SQL } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
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
    private readonly pdfParserService: PdfParserService,
    private readonly translationService: TranslationService,
    @Inject('DATABASE')
    private readonly db: NodePgDatabase<typeof import('../db/schema')>,
  ) {}

  /**
   * Parses the uploaded PDF, translates extracted data,
   * and stores the resulting transactions in the database.
   */
  async processAndStorePdf(
    fileBuffer: Buffer,
    fileName: string,
  ): Promise<Transaction[]> {
    console.log(`Processing PDF: ${fileName}`);

    const rawTransactions =
      await this.pdfParserService.parsePdf(fileBuffer);
    console.log(
      `Extracted ${rawTransactions.length} transactions from PDF`,
    );

    const translatedTransactions =
      await this.translationService.translateTransactions(rawTransactions);
    console.log(
      `Translated ${translatedTransactions.length} transactions`,
    );

    const insertedTransactions: Transaction[] = [];

    for (const txn of translatedTransactions) {
      // Map parsed and translated data to the DB schema
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

      const [inserted] = await this.db
        .insert(transactions)
        .values(newTransaction)
        .returning();

      insertedTransactions.push(inserted);
    }

    console.log(
      `Inserted ${insertedTransactions.length} transactions into database`,
    );
    return insertedTransactions;
  }

  /**
   * Returns transactions matching the provided search filters.
   * Filters are applied dynamically based on user input.
   */
  async findAll(filters: SearchFilters): Promise<Transaction[]> {
    const conditions: SQL<unknown>[] = [];

    if (filters.buyerName) {
      conditions.push(
        ilike(transactions.buyerName, `%${filters.buyerName}%`),
      );
    }
    if (filters.sellerName) {
      conditions.push(
        ilike(transactions.sellerName, `%${filters.sellerName}%`),
      );
    }
    if (filters.houseNumber) {
      conditions.push(
        ilike(transactions.houseNumber, `%${filters.houseNumber}%`),
      );
    }
    if (filters.surveyNumber) {
      conditions.push(
        ilike(transactions.surveyNumber, `%${filters.surveyNumber}%`),
      );
    }
    if (filters.documentNumber) {
      conditions.push(
        ilike(
          transactions.documentNumber,
          `%${filters.documentNumber}%`,
        ),
      );
    }

    // If no filters are provided, return all records
    if (conditions.length === 0) {
      return this.db
        .select()
        .from(transactions)
        .orderBy(transactions.id);
    }

    return this.db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(transactions.id);
  }

  /**
   * Fetches a single transaction by its primary key.
   */
  async findById(id: number): Promise<Transaction | null> {
    const [transaction] = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);

    return transaction ?? null;
  }

  /**
   * Deletes all transactions from the table.
   * Intended for development or reset operations.
   */
  async deleteAll(): Promise<void> {
    await this.db.delete(transactions);
  }
}
