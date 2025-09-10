#!/bin/bash
echo "🔄 Switching to DEVELOPMENT mode..."
cp .env.development .env
echo "✅ Development environment activated!"
echo "📱 Mobile can now connect to: http://192.168.0.9:8000"
echo "💻 Run: npm run dev"
