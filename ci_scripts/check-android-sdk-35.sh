#!/usr/bin/env bash
# Simple CI check script to verify Android SDK Platform 35 and build-tools 35.0.0 are installed.
# Exits with non-zero status if missing.

set -euo pipefail

echo "Checking for ANDROID_SDK_ROOT / ANDROID_HOME..."
if [[ -z "${ANDROID_SDK_ROOT:-}" && -z "${ANDROID_HOME:-}" ]]; then
  echo "ERROR: ANDROID_SDK_ROOT or ANDROID_HOME is not set."
  exit 2
fi
SDK_ROOT="${ANDROID_SDK_ROOT:-${ANDROID_HOME}}"

echo "Using SDK root: $SDK_ROOT"

if ! command -v sdkmanager >/dev/null 2>&1; then
  echo "sdkmanager not found in PATH. Please install Android SDK command-line tools or ensure sdkmanager is available."
  exit 2
fi

# Check installed platforms
PLATFORMS=$(sdkmanager --list_installed 2>/dev/null | tr -d '\r' || true)

if echo "$PLATFORMS" | grep -q "platforms;android-35"; then
  echo "Android platform 35 is installed."
else
  echo "Android platform 35 not found."
  echo "Attempting to install (requires sdkmanager and write access to SDK)."
  sdkmanager "platforms;android-35" || {
    echo "Failed to install platform 35. Please install it manually: sdkmanager 'platforms;android-35'"
    exit 3
  }
fi

# Check build-tools
if echo "$PLATFORMS" | grep -q "build-tools;35.0.0"; then
  echo "Build-tools 35.0.0 is installed."
else
  echo "Build-tools 35.0.0 not found. Attempting to install."
  sdkmanager "build-tools;35.0.0" || {
    echo "Failed to install build-tools 35.0.0. Please install manually: sdkmanager 'build-tools;35.0.0'"
    exit 4
  }
fi

echo "SDK check completed successfully."
exit 0
