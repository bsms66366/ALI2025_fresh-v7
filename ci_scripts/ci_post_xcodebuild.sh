#!/bin/bash

# Xcode Cloud Post-Build Script for Expo React Native Project
# This script runs after the Xcode build process

set -e

echo "🎉 Xcode Cloud post-build for ALI2025..."

# Check if build was successful
if [ $CI_XCODEBUILD_EXIT_CODE -eq 0 ]; then
    echo "✅ Build completed successfully!"
    
    # Optional: Upload build artifacts or perform additional tasks
    echo "📦 Build artifacts ready for distribution"
    
    # You can add additional post-build tasks here:
    # - Upload to TestFlight
    # - Send notifications
    # - Update version tracking
    
else
    echo "❌ Build failed with exit code: $CI_XCODEBUILD_EXIT_CODE"
    exit $CI_XCODEBUILD_EXIT_CODE
fi

echo "🚀 Post-build process completed!"
