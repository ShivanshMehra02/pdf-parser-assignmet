#!/bin/bash

# Quick Start Script for Tamil PDF Translator
# This script helps you set up and run the project quickly

echo "🚀 Tamil PDF Translator - Quick Start"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL CLI not found. Make sure PostgreSQL is installed and running."
fi

# Setup Backend
echo ""
echo "📦 Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit backend/.env with your database credentials and OpenAI API key"
fi

echo "Installing backend dependencies..."
npm install

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
cd ../frontend

if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file from .env.example..."
    cp .env.example .env.local
fi

echo "Installing frontend dependencies..."
npm install

echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Create PostgreSQL database:"
echo "   psql -U postgres -c 'CREATE DATABASE tamil_transactions;'"
echo ""
echo "2. Update backend/.env with:"
echo "   - DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/tamil_transactions"
echo "   - OPENAI_API_KEY=your_openai_api_key"
echo "   - JWT_SECRET=your_random_secret_key"
echo ""
echo "3. Run database migrations:"
echo "   cd backend && npm run db:migrate"
echo ""
echo "4. (Optional) Seed sample data:"
echo "   cd backend && npx tsx src/db/seed.ts"
echo ""
echo "5. Start the backend (in one terminal):"
echo "   cd backend && npm run start:dev"
echo ""
echo "6. Start the frontend (in another terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "7. Open http://localhost:3000 in your browser"
echo ""
echo "Demo Credentials:"
echo "   Email: demo@example.com"
echo "   Password: password123"
echo ""
