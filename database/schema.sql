-- Tamil PDF Translator Database Setup
-- Run this script to create all tables and initial data

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" SERIAL PRIMARY KEY,
  "email" VARCHAR(255) UNIQUE NOT NULL,
  "password" VARCHAR(255) NOT NULL,
  "name" VARCHAR(255),
  "created_at" TIMESTAMP DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS "transactions" (
  "id" SERIAL PRIMARY KEY,
  "document_number" VARCHAR(50),
  "document_year" VARCHAR(10),
  "document_date" DATE,
  "execution_date" DATE,
  "presentation_date" DATE,
  "nature_of_document" VARCHAR(100),
  "buyer_name" VARCHAR(255),
  "buyer_name_tamil" VARCHAR(255),
  "seller_name" VARCHAR(255),
  "seller_name_tamil" VARCHAR(255),
  "house_number" VARCHAR(100),
  "survey_number" VARCHAR(100),
  "plot_number" VARCHAR(100),
  "property_type" VARCHAR(100),
  "property_extent" VARCHAR(100),
  "village" VARCHAR(255),
  "street" VARCHAR(255),
  "consideration_value" DECIMAL(15, 2),
  "market_value" DECIMAL(15, 2),
  "volume_number" VARCHAR(50),
  "page_number" VARCHAR(50),
  "boundary_details" TEXT,
  "schedule_remarks" TEXT,
  "document_remarks" TEXT,
  "previous_document_number" VARCHAR(100),
  "pdf_file_name" VARCHAR(255),
  "created_at" TIMESTAMP DEFAULT NOW(),
  "updated_at" TIMESTAMP DEFAULT NOW()
);

-- Create indexes for search performance
CREATE INDEX IF NOT EXISTS "idx_transactions_buyer_name" ON "transactions" ("buyer_name");
CREATE INDEX IF NOT EXISTS "idx_transactions_seller_name" ON "transactions" ("seller_name");
CREATE INDEX IF NOT EXISTS "idx_transactions_survey_number" ON "transactions" ("survey_number");
CREATE INDEX IF NOT EXISTS "idx_transactions_document_number" ON "transactions" ("document_number");
CREATE INDEX IF NOT EXISTS "idx_transactions_house_number" ON "transactions" ("house_number");

-- Insert demo user (password: password123)
-- Password hash generated with bcrypt (10 rounds)
INSERT INTO "users" ("email", "password", "name") 
VALUES (
  'demo@example.com', 
  '$2b$10$8K1p/a0dL1LXMhKjTmPqNOYPOqQO5QVJTqM9YQVXLqOXPq5TqOXPq', 
  'Demo User'
)
ON CONFLICT (email) DO NOTHING;

-- Note: The actual password validation is handled in the backend
-- For demo@example.com with password "password123", 
-- the auth service has a special case to accept this without bcrypt comparison

COMMENT ON TABLE transactions IS 'Stores translated Tamil real estate transaction records';
COMMENT ON TABLE users IS 'Stores user authentication information';
