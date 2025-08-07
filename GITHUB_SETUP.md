# GitHub Token Setup

To scrape the GitHub repositories without hitting rate limits, you need a GitHub Personal Access Token.

## Repositories to be scraped:
- `thenomain/GMCCG` - Game Master's Creative Coding Guide
- `thenomain/Mu--Support-Systems` - MU* Support Systems  
- `thenomain/liberation_sandbox` - Liberation MUSH sandbox

## Quick Setup

1. **Copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Create a GitHub Personal Access Token:**
   - Go to https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Give it a name like "MUSHCODE MCP Server"
   - Select the `public_repo` scope
   - Click "Generate token"
   - Copy the token (you won't see it again!)

3. **Add the token to your .env file:**
   ```bash
   # Edit .env and replace the placeholder
   GITHUB_TOKEN=ghp_your_actual_token_here
   ```

4. **Run the scraping:**
   ```bash
   npm run scrape:github
   ```

## Rate Limits

- **Without token:** 60 requests/hour (will hit rate limit quickly)
- **With token:** 5000 requests/hour (plenty for scraping)

## Security

- The `.env` file is already in `.gitignore` so your token won't be committed
- Only the `public_repo` scope is needed (read-only access to public repositories)
- You can revoke the token anytime at https://github.com/settings/tokens

## Troubleshooting

If you get rate limit errors:
1. Make sure your `.env` file exists and has the correct token
2. Check that the token has the `public_repo` scope
3. Wait for the rate limit to reset (usually 1 hour for unauthenticated requests)