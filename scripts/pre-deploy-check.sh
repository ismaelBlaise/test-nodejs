#!/bin/bash

# Build the project
echo "Building project..."
npm run build

if [ $? -ne 0 ]; then
  echo "Build failed!"
  exit 1
fi

echo "Build successful!"

# Run linting
echo "Running ESLint..."
npm run lint

if [ $? -ne 0 ]; then
  echo "Linting failed!"
  exit 1
fi

echo "Linting passed!"

# Run tests
echo "Running tests..."
npm test -- --passWithNoTests

if [ $? -ne 0 ]; then
  echo "Tests failed!"
  exit 1
fi

echo "Tests passed!"

echo ""
echo "✅ All checks passed! Ready to deploy."
