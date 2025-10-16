#!/bin/bash

# Script to create GitHub issue for Team Manager feature
# Run this script with your own GitHub authentication

echo "════════════════════════════════════════════════════════════"
echo "  Creating GitHub Issue - Team Manager Creation Feature"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if gh is authenticated with proper permissions
echo "Checking GitHub CLI authentication..."
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo ""
    echo "Please authenticate first:"
    echo "  gh auth login"
    echo ""
    exit 1
fi

echo "✓ GitHub CLI is authenticated"
echo ""

# Create the issue
echo "Creating GitHub issue..."
echo ""

gh issue create \
  --repo samabos/clubqore \
  --title "Enable Club Managers to Create Team Manager (Coach) Accounts with Login Notifications" \
  --body-file /workspace/GITHUB-ISSUE-TEMPLATE.md \
  --label "enhancement"

if [ $? -eq 0 ]; then
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  ✅ SUCCESS! GitHub issue created successfully"
    echo "════════════════════════════════════════════════════════════"
else
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "  ❌ ERROR: Failed to create issue"
    echo "════════════════════════════════════════════════════════════"
    echo ""
    echo "Alternative: Create manually at:"
    echo "https://github.com/samabos/clubqore/issues/new"
    echo ""
    echo "Copy content from: /workspace/GITHUB-ISSUE-TEMPLATE.md"
    exit 1
fi
