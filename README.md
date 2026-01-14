# PDF Parser – Tamil Real Estate Transaction Processor

An application to ingest, parse, translate, and store Tamil real-estate
transaction data from PDF documents into a PostgreSQL database.

## Tech Stack

- **Frontend**: Next.js 14, Tailwind CSS, TypeScript
- **Backend**: Node.js, NestJS, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Translation**: Google Cloud Translation API

## Features

- Basic user authentication
- PDF upload and preview
- Tamil to English translation using Google Cloud Translation
- Searchable transaction table with filters
- Side-by-side PDF preview and parsed results

## Prerequisites

- Node.js 20+ (Use the Nodejs 20 LTS to work with the Drizzle)
- PostgreSQL 14+
- Google Cloud Translation API key
- npm

## Project Structure



## Project Structure

```
tamil-pdf-translator/
├── backend/                 # Nest.js Backend
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── transactions/   # Transaction processing module
│   │   ├── db/             # Database schema & migrations
│   │   └── main.ts         # Entry point
│   ├── drizzle/            # Drizzle migrations
│   └── package.json
├── frontend/               # Next.js Frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities
│   └── package.json
└── README.md
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd tamil-pdf-translator
```

### 2. Setup PostgreSQL Database

```bash
# Create database
psql -U postgres
CREATE DATABASE tamil_transactions;
\q
```

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
touch .env

# Edit .env with your credentials:
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/tamil_transactions
# GOOGLE_TRANSLATE_API_KEY=your_openai_api_key
# JWT_SECRET=your_jwt_secret

# Run database migrations
npm run db:migrate

# Start backend server
npm run start:dev
```

Backend will run on: http://localhost:3001

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local file
Touch .env.local

# Edit .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:3001

# Start frontend dev server
npm run dev
```

Frontend will run on: http://localhost:3000

## Demo Credentials

```
Email: demo@example.com
Password: password123
```

## API Endpoints

### Authentication
- `POST /auth/login` - Login with credentials

### Transactions
- `POST /transactions/upload` - Upload and process PDF
- `GET /transactions` - Get all transactions with filters
- `GET /transactions/:id` - Get single transaction

### Query Parameters for GET /transactions
- `buyerName` - Filter by buyer name
- `sellerName` - Filter by seller name
- `houseNumber` - Filter by house number
- `surveyNumber` - Filter by survey number
- `documentNumber` - Filter by document number

## Database Schema

```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  document_number VARCHAR(50),
  document_date DATE,
  buyer_name VARCHAR(255),
  buyer_name_tamil VARCHAR(255),
  seller_name VARCHAR(255),
  seller_name_tamil VARCHAR(255),
  house_number VARCHAR(100),
  survey_number VARCHAR(100),
  plot_number VARCHAR(100),
  property_type VARCHAR(100),
  property_extent VARCHAR(100),
  village VARCHAR(255),
  consideration_value DECIMAL(15,2),
  market_value DECIMAL(15,2),
  boundary_details TEXT,
  schedule_remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Assumptions

1. PDF documents follow the Tamil Nadu Registration Department format
2. PDFs contain structured tabular data for property transactions
3. Tamil text extraction may require OCR for scanned documents
4. Translation preserves proper nouns through transliteration
5. All monetary values are in Indian Rupees (INR)

## Architecture Overview

Next.js (Frontend)
        |
        v
NestJS API (Backend)
        |
        v
PostgreSQL (Database)
        |
        v
Google Cloud Translation API

## Libraries Used

### Backend
- @nestjs/core, @nestjs/common – NestJS framework
- drizzle-orm – Database ORM
- drizzle-kit – Migration toolkit
- pdf-parse – PDF text extraction
- @google-cloud/translate – Google Cloud Translation API client
- @nestjs/jwt – JWT authentication
- multer – File upload handling
- pg – PostgreSQL driver

### Frontend
- next – Next.js framework
- tailwindcss – CSS framework
- react-pdf – PDF preview
- axios – HTTP client
- react-hook-form – Form handling
- @tanstack/react-table – Data table
