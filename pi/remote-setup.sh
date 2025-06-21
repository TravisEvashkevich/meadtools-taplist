#!/bin/bash
set -e

REPO_URL="https://github.com/ljreaux/meadtools-taplist.git"
CLONE_DIR="$HOME/taplist-setup"

echo "📁 Cloning only the 'pi' setup files..."

git clone --depth 1 --filter=blob:none --sparse "$REPO_URL" "$CLONE_DIR"
cd "$CLONE_DIR"
git sparse-checkout set pi

cd pi
chmod +x taplist-setup.sh setup-access-point.sh
chmod +x taplist-setup.sh setup-access-point.sh pi/post-taplist-start.sh

echo "🚀 Running main setup script..."
./taplist-setup.sh