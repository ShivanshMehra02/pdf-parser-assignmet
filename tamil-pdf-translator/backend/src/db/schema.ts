import { pgTable, serial, varchar, text, decimal, timestamp, date } from 'drizzle-orm/pg-core';

// Transactions table schema
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  documentNumber: varchar('document_number', { length: 50 }),
  documentYear: varchar('document_year', { length: 10 }),
  documentDate: date('document_date'),
  executionDate: date('execution_date'),
  presentationDate: date('presentation_date'),
  natureOfDocument: varchar('nature_of_document', { length: 100 }),
  
  // Buyer/Claimant details
  buyerName: varchar('buyer_name', { length: 255 }),
  buyerNameTamil: varchar('buyer_name_tamil', { length: 255 }),
  
  // Seller/Executant details
  sellerName: varchar('seller_name', { length: 255 }),
  sellerNameTamil: varchar('seller_name_tamil', { length: 255 }),
  
  // Property details
  houseNumber: varchar('house_number', { length: 100 }),
  surveyNumber: varchar('survey_number', { length: 100 }),
  plotNumber: varchar('plot_number', { length: 100 }),
  propertyType: varchar('property_type', { length: 100 }),
  propertyExtent: varchar('property_extent', { length: 100 }),
  village: varchar('village', { length: 255 }),
  street: varchar('street', { length: 255 }),
  
  // Financial details
  considerationValue: decimal('consideration_value', { precision: 15, scale: 2 }),
  marketValue: decimal('market_value', { precision: 15, scale: 2 }),
  
  // Additional details
  volumeNumber: varchar('volume_number', { length: 50 }),
  pageNumber: varchar('page_number', { length: 50 }),
  boundaryDetails: text('boundary_details'),
  scheduleRemarks: text('schedule_remarks'),
  documentRemarks: text('document_remarks'),
  previousDocumentNumber: varchar('previous_document_number', { length: 100 }),
  
  // Metadata
  pdfFileName: varchar('pdf_file_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Users table for authentication
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
});

// Type exports
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
