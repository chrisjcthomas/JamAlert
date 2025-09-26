#!/bin/bash

# JamAlert Frontend Vercel Deployment Script
# Bash script for Linux/macOS/WSL

echo "🚀 JamAlert Frontend - Vercel Deployment"
echo "======================================="

# Check if Vercel CLI is installed
echo "Checking Vercel CLI installation..."
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Vercel CLI. Please install manually:"
        echo "   npm install -g vercel"
        exit 1
    fi
    echo "✅ Vercel CLI installed successfully!"
else
    echo "✅ Vercel CLI found!"
fi

# Check if user is logged in to Vercel
echo "Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "❌ Not logged in to Vercel. Please login:"
    echo "   vercel login"
    echo ""
    echo "After logging in, run this script again."
    exit 1
fi

echo "✅ Vercel authentication verified!"

# Run build to check for errors
echo "Building project..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix build errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "Deploying to Vercel..."
echo "Note: You may be prompted to configure the project."
echo "Recommended settings:"
echo "  - Project name: jamalert-frontend-demo"
echo "  - Directory: ./ (current directory)"
echo ""

vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "======================================="
    echo "Your JamAlert demo is now live!"
    echo ""
    echo "Share this with your team:"
    echo "- Demo includes all UI components"
    echo "- Mock data for realistic testing"
    echo "- Responsive design for all devices"
    echo "- No backend required"
    echo ""
    echo "Perfect for reviewing the current application state!"
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
