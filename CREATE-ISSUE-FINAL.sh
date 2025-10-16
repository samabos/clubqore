#!/bin/bash

echo "════════════════════════════════════════════════════════════════"
echo "  GitHub Issue Creator for Team Manager Feature"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Check current authentication
echo "Checking current GitHub authentication..."
CURRENT_USER=$(gh auth status 2>&1 | grep "Logged in" | awk '{print $7}')
echo "Current user: $CURRENT_USER"
echo ""

if [ "$CURRENT_USER" = "cursor" ]; then
    echo "⚠️  WARNING: Currently authenticated as 'cursor' bot account"
    echo "   This account cannot create issues."
    echo ""
    echo "Please authenticate with your personal GitHub account."
    echo ""
    read -p "Would you like to authenticate now? (y/n) " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo "Starting GitHub authentication..."
        gh auth login
        
        if [ $? -ne 0 ]; then
            echo ""
            echo "❌ Authentication failed. Please try manually:"
            echo "   gh auth login"
            exit 1
        fi
    else
        echo ""
        echo "Please authenticate manually with:"
        echo "   gh auth login"
        echo ""
        echo "Then run this script again."
        exit 1
    fi
fi

echo ""
echo "Creating GitHub issue..."
echo "────────────────────────────────────────────────────────────────"

gh issue create \
  --repo samabos/clubqore \
  --title "Enable Club Managers to Create Team Manager (Coach) Accounts with Login Notifications" \
  --body-file /workspace/GITHUB-ISSUE-TEMPLATE.md \
  --label "enhancement"

if [ $? -eq 0 ]; then
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  ✅ SUCCESS! GitHub Issue Created"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
else
    echo ""
    echo "════════════════════════════════════════════════════════════════"
    echo "  ❌ ERROR: Failed to create issue"
    echo "════════════════════════════════════════════════════════════════"
    echo ""
    echo "Manual alternative:"
    echo "1. Go to: https://github.com/samabos/clubqore/issues/new"
    echo "2. Copy content from: /workspace/GITHUB-ISSUE-TEMPLATE.md"
    echo "3. Paste and submit"
    echo ""
    exit 1
fi
