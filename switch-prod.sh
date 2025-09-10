#!/bin/bash
echo "🔄 Switching to PRODUCTION mode..."
cp .env.production .env
echo "✅ Production environment activated!"
echo "🌐 Will connect to: https://api.invoiceGen.in"
echo "💻 Run: npm run build"
