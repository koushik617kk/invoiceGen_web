#!/bin/bash

# InvoiceGen Web - AWS Amplify Deployment Script
# This script helps prepare your project for Amplify deployment

echo "🚀 InvoiceGen Web - Amplify Deployment Preparation"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if amplify.yml exists
if [ ! -f "amplify.yml" ]; then
    echo "❌ Error: amplify.yml not found. Please ensure the file exists."
    exit 1
fi

echo "✅ Project structure verified"

# Check environment files
echo "📋 Checking environment files..."
if [ -f ".env.production" ]; then
    echo "✅ .env.production found"
    echo "   VITE_API_BASE: $(grep VITE_API_BASE .env.production)"
    echo "   VITE_ENVIRONMENT: $(grep VITE_ENVIRONMENT .env.production)"
else
    echo "⚠️  .env.production not found - will be created during build"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run build test
echo "🔨 Testing build process..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo "📊 Build output:"
    ls -la dist/
    echo ""
    echo "📏 Build size:"
    du -sh dist/
else
    echo "❌ Build failed! Please fix errors before deploying."
    exit 1
fi

# Check for common issues
echo "🔍 Checking for common deployment issues..."

# Check for hardcoded URLs
if grep -r "localhost" src/ --exclude-dir=node_modules; then
    echo "⚠️  Warning: Found 'localhost' references in source code"
fi

if grep -r "http://" src/ --exclude-dir=node_modules; then
    echo "⚠️  Warning: Found hardcoded HTTP URLs in source code"
fi

echo ""
echo "🎉 Project is ready for Amplify deployment!"
echo ""
echo "Next steps:"
echo "1. Push your code to GitHub/GitLab"
echo "2. Connect your repository to AWS Amplify"
echo "3. Set environment variables in Amplify Console:"
echo "   - VITE_API_BASE = https://api.invoiceGen.in"
echo "   - VITE_ENVIRONMENT = production"
echo "4. Deploy!"
echo ""
echo "📖 For detailed instructions, see AMPLIFY_DEPLOYMENT.md"
