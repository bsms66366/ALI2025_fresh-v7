#!/bin/bash

# Xcode Cloud Pre-Build Script for Expo React Native Project
# This script runs before the Xcode build process

set -e

echo "🚀 Starting Xcode Cloud pre-build for ALI2025..."

# Check Node.js version
echo "📦 Node.js version:"
node --version

# Check npm version  
echo "📦 npm version:"
npm --version

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm ci

# Install global Expo CLI if needed
echo "📦 Installing Expo CLI..."
npm install -g @expo/cli

# Navigate to iOS directory and install CocoaPods
echo "🍎 Installing CocoaPods dependencies..."
cd ios
pod install --repo-update
cd ..

echo "✅ Pre-build setup completed successfully!"

# Additional environment setup for ViroReact if needed
echo "🥽 Setting up ViroReact environment..."
# Any additional ViroReact specific setup can go here

echo "🎯 Ready for Xcode build process..."
