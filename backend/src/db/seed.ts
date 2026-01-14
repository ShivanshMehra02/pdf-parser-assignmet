import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { users, transactions } from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

async function seed() {
  console.log('🌱 Starting database seed...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  try {
    // Create demo user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await db.insert(users).values({
      email: 'demo@example.com',
      password: hashedPassword,
      name: 'Demo User',
    }).onConflictDoNothing();

    console.log('✅ Demo user created: demo@example.com / password123');

    // Add some sample transactions for testing
    const sampleTransactions = [
      {
        documentNumber: '200',
        documentYear: '2013',
        documentDate: '2013-02-06',
        natureOfDocument: 'Conveyance',
        buyerName: 'Nithya',
        buyerNameTamil: 'நித்யா',
        sellerName: 'A. Selvamuthukumarasamy',
        sellerNameTamil: 'ஏ. செல்வமுத்துகுமாரசாமி',
        surveyNumber: '329',
        plotNumber: '1',
        propertyType: 'House Site',
        propertyExtent: '1200 Sq.Ft',
        village: 'Thiruvennainallur',
        considerationValue: '314068',
        marketValue: '314068',
        pdfFileName: 'sample.pdf',
      },
      {
        documentNumber: '201',
        documentYear: '2013',
        documentDate: '2013-02-07',
        natureOfDocument: 'Conveyance',
        buyerName: 'Ramesh Kumar',
        buyerNameTamil: 'ரமேஷ் குமார்',
        sellerName: 'A. Selvamuthukumarasamy',
        sellerNameTamil: 'ஏ. செல்வமுத்துகுமாரசாமி',
        surveyNumber: '329',
        plotNumber: '2',
        propertyType: 'House Site',
        propertyExtent: '1500 Sq.Ft',
        village: 'Thiruvennainallur',
        considerationValue: '392585',
        marketValue: '392585',
        pdfFileName: 'sample.pdf',
      },
      {
        documentNumber: '202',
        documentYear: '2013',
        documentDate: '2013-02-10',
        natureOfDocument: 'Conveyance',
        buyerName: 'Lakshmi Devi',
        buyerNameTamil: 'லக்ஷ்மி தேவி',
        sellerName: 'V. Arunagiri',
        sellerNameTamil: 'வி. அருணகிரி',
        surveyNumber: '330',
        plotNumber: '5',
        propertyType: 'House Site',
        propertyExtent: '1000 Sq.Ft',
        village: 'Thiruvennainallur',
        considerationValue: '261723',
        marketValue: '275000',
        pdfFileName: 'sample.pdf',
      },
    ];

    for (const txn of sampleTransactions) {
      await db.insert(transactions).values(txn).onConflictDoNothing();
    }

    console.log('✅ Sample transactions created');
    console.log('🎉 Database seed completed successfully!');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
