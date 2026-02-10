#!/bin/bash

# Build cross-platform desktop apps using Electron + electron-builder
# Can be run from macOS to build Windows and macOS installers

set -e

echo "🔨 Building TikTok Chat Reader (Electron)..."

# Fix for macOS: electron-builder looks for 'python' but modern macOS only has 'python3'
# Create a temporary bin directory with python symlink
if command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    TEMP_BIN=$(mktemp -d)
    ln -s "$(which python3)" "$TEMP_BIN/python"
    export PATH="$TEMP_BIN:$PATH"
    echo "  → Created temporary python symlink for electron-builder"
    trap "rm -rf $TEMP_BIN" EXIT
fi

# Clean up any stale disk mounts from previous failed builds (macOS)
if [[ "$(uname -s)" == "Darwin" ]]; then
    echo "🧹 Cleaning stale DMG mounts..."
    # Detach any mounted TikTok volumes
    for vol in /Volumes/TikTok*; do
        [ -d "$vol" ] && hdiutil detach "$vol" -force 2>/dev/null || true
    done
    # Also try detaching by disk numbers
    for disk in /dev/disk{4..10}; do
        hdiutil detach "$disk" -force 2>/dev/null || true
    done
fi

# Step 0: Clean previous Electron build
echo "🧹 Cleaning previous Electron build..."
rm -rf electron/dist-electron release

# Step 1: Install root (Electron) dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Electron dependencies..."
    npm install
fi

# Step 2: Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

# Step 3: Compile backend TypeScript
echo "📝 Compiling backend TypeScript..."
npm run backend:build

# Step 4: Compile Electron TypeScript
echo "📝 Compiling Electron TypeScript..."
npm run electron:build-ts

# Step 5: Build Electron distributables
echo "🏗️  Building Electron distributables..."

# Cleanup function for macOS DMG builds
cleanup_dmg_mounts() {
    for vol in /Volumes/TikTok*; do
        [ -d "$vol" ] && hdiutil detach "$vol" -force 2>/dev/null || true
    done
}

# Detect platform and build accordingly
case "$(uname -s)" in
  Darwin)
    echo "  → Detected macOS — building macOS + Windows targets..."
    cleanup_dmg_mounts
    # Set environment variable to help with DMG creation
    export ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
    npx electron-builder --mac --win || {
        echo "⚠️  Build had issues, cleaning up mounts and retrying..."
        cleanup_dmg_mounts
        sleep 2
        npx electron-builder --mac --win
    }
    ;;
  Linux*)
    echo "  → Detected Linux — building Linux + Windows targets..."
    npx electron-builder --linux --win
    ;;
  MINGW*|MSYS*|CYGWIN*)
    echo "  → Detected Windows — building Windows target..."
    npx electron-builder --win
    ;;
  *)
    echo "  → Unknown platform — building for current platform..."
    npx electron-builder
    ;;
esac

echo ""
echo "✅ Done! Electron distributables created in ./release/"
echo ""
echo "📦 Contents:"
ls -lh release/ 2>/dev/null || echo "  (check release/ directory)"
echo ""
echo "⚠️  Note: You can optionally include a .env file next to the executable for configuration"
echo ""
