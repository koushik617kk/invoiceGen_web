#!/bin/bash

# Frontend Deployment Script
# Usage: ./deploy.sh [dev|prod]

ENV=${1:-dev}

echo "🚀 Deploying Frontend - Environment: $ENV"
echo "========================================"

# Check if environment file exists
if [ "$ENV" = "prod" ]; then
    ENV_FILE=".env.production"
    echo "📦 Production deployment..."
else
    ENV_FILE=".env.development"
    echo "🔧 Development deployment..."
fi

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Environment file $ENV_FILE not found!"
    echo "   Please create it from .env.example"
    exit 1
fi

# Copy environment file
echo "📋 Copying environment configuration..."
cp "$ENV_FILE" .env

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ "$ENV" = "prod" ]; then
    echo "🏗️  Building for production..."
    npm run build
    echo "✅ Production build completed!"
    echo "   Build files are in 'dist' folder"
    echo "   Deploy these files to AWS Amplify"
else
    echo "🔧 Starting development server..."
    echo "   Frontend will be available at: http://localhost:5173"
    npm run dev
fi
