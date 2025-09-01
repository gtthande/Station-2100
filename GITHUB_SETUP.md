# 🔗 GitHub Integration Setup for Station-2100

## Environment Variables

Add these to your `.env` file:

```bash
# GitHub Integration (for Dev Sync Panel)
VITE_GITHUB_REPO=gtthande/Station-2100
# VITE_GITHUB_TOKEN=ghp_xxx    # needed only if repo is private or you will use the dispatch button
```

## What Each Variable Does

### `VITE_GITHUB_REPO`
- **Required**: Your GitHub repository in `owner/repo` format
- **Example**: `gtthande/Station-2100`
- **Used by**: Dev Sync Panel to show latest commit info

### `VITE_GITHUB_TOKEN` (Optional)
- **Required for**: Private repositories or workflow dispatch functionality
- **How to get**: 
  1. Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
  2. Generate new token (classic)
  3. Select scopes: `repo` (for private repos) or `public_repo` (for public repos)
- **Security**: Never commit this token to version control

## Testing the Integration

1. **Add the environment variables** to your `.env` file
2. **Restart your dev server** (`npm run dev`)
3. **Navigate to the Dev Tools panel** (requires admin access)
4. **Check the GitHub commit info** section

## Troubleshooting

### "GitHub API error: 401"
- Add a valid `VITE_GITHUB_TOKEN` to your `.env` file
- Ensure the token has the correct permissions

### "GitHub API error: 404"
- Check that `VITE_GITHUB_REPO` is correctly formatted as `owner/repo`
- Verify the repository exists and is accessible

### "Network error"
- Check your internet connection
- Verify GitHub API is accessible from your network

## Security Notes

- **Public repos**: No token needed, but rate limits apply
- **Private repos**: Token required with `repo` scope
- **Token storage**: Store in `.env` file (already in `.gitignore`)
- **Token rotation**: Consider rotating tokens periodically

## Next Steps

After setting up the environment variables:

1. **Test the Dev Sync Panel** to ensure GitHub integration works
2. **Use the sync commands** to keep Cursor and Lovable in sync
3. **Monitor commit history** through the panel
4. **Optional**: Set up GitHub Actions for automated builds
