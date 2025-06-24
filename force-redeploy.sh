#!/bin/bash

# 🚀 Force GitHub Pages Re-deploy Script
# Risolve problemi di caching e deploy di GitHub Pages

echo "🚀 Forcing GitHub Pages re-deployment..."

# 1. Create a dummy commit to trigger rebuild
echo "$(date)" > .github-pages-trigger
git add .github-pages-trigger

# 2. Commit with timestamp
git commit -m "🔧 Force GitHub Pages rebuild - $(date)"

# 3. Push to trigger new deployment
git push origin main

# 4. Clean up
rm -f .github-pages-trigger
git add .github-pages-trigger
git commit -m "🧹 Cleanup deploy trigger"
git push origin main

echo "✅ Re-deployment triggered!"
echo "📍 Check: https://francescopuglia.github.io/PROGRAMMAZIONE-DINAMICA/"
echo "⏰ Wait 2-5 minutes for deployment to complete"