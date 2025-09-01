# ðŸ”„ Station-2100 Sync Guide

Use these commands to keep **Cursor (local)** and **Lovable (cloud)** in sync via GitHub.

## PowerShell Functions (local)
- \git-sync-down\ â†’ pulls latest changes from GitHub.
- \git-sync-up "message"\ â†’ stages, commits, and pushes (custom message).

## Daily Workflow
1. Start work:
   \\\
   git-sync-down
   \\\
2. After edits:
   \\\
   git-sync-up "Describe your change"
   \\\

## If You Prefer Git Aliases
- \git sync-down\ (alias) does the same as \git pull origin main\.
- For custom messages, use the PowerShell function \git-sync-up\ (more reliable on Windows).

## Conflict Handling
\\\
git-sync-down
# fix conflicts in files
git add .
git commit -m "Resolve merge conflicts"
git push origin main
\\\

## Identity (already set)
\\\
git config --global user.name "George Thande"
git config --global user.email "gtthande@gmail.com"
\\\

Notes:
- Line-ending warnings are normalized via \.gitattributes\.
- If the terminal looks stuck, close & reopen Cursor; your repo on GitHub is safe.
