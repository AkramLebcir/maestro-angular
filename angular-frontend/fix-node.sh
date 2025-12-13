#!/bin/bash
# Script to fix Node.js/npm issues by ensuring nvm is loaded

echo "Loading nvm..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Checking Node.js version..."
node --version
npm --version

echo "Using Node.js 18..."
nvm use 18

echo "Now you can run npm install safely!"
echo "Running npm install..."
npm install









