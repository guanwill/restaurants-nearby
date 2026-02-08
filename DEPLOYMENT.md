# GitHub Pages Deployment Guide

## Step-by-Step Setup Instructions

### Step 1: Prepare Your Local Environment

1. **Create a `.env.local` file** (for local development only):
   ```bash
   # This file is already in .gitignore, so it won't be committed
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

2. **Verify `.env.local` is in `.gitignore`** (it should already be there):
   - The file `.gitignore` should contain `.env` and `.env.local`
   - This ensures your API key never gets committed to git

### Step 2: Get Your Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the "Places API (New)" for your project
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. **Important**: Restrict the API key:
   - Under "API restrictions", select "Restrict key" and choose "Places API (New)"
   - Under "Application restrictions", select "HTTP referrers" and add:
     - `https://yourusername.github.io/*` (for production)
     - `http://localhost:*` (for local development)
   - Save the restrictions

### Step 3: Set Up GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Fill in:
   - **Name**: `VITE_GOOGLE_MAPS_API_KEY`
   - **Value**: Paste your Google Maps API key
6. Click **Add secret**

**Important**: This secret is encrypted and only accessible during GitHub Actions runs. It will never appear in your code or logs.

### Step 4: Enable GitHub Pages

1. Still in your repository **Settings**
2. In the left sidebar, click **Pages**
3. Under **Source**, select **GitHub Actions** (NOT "Deploy from a branch")
4. Save (no other configuration needed)

### Step 5: Verify Your Repository Name

Check that the base path in your code matches your repository name:

1. Check your repo name (e.g., `restaurants-nearby`)
2. Verify `vite.config.ts` has:
   ```typescript
   base: process.env.NODE_ENV === 'production' ? '/restaurants-nearby/' : '/',
   ```
3. Verify `src/main.tsx` has:
   ```typescript
   <BrowserRouter basename={import.meta.env.PROD ? '/restaurants-nearby' : ''}>
   ```

If your repo name is different, update both files accordingly.

### Step 6: Commit and Push

```bash
# Add all files
git add .

# Commit
git commit -m "Add GitHub Pages deployment setup"

# Push to main branch (this will trigger the deployment)
git push origin main
```

### Step 7: Monitor Deployment

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. You should see "Deploy to GitHub Pages" workflow running
4. Wait for it to complete (usually 1-2 minutes)
5. Once it shows a green checkmark, your site is live!

## Security Best Practices

✅ **DO:**
- Store API keys in GitHub Secrets (never in code)
- Use `.env.local` for local development (already gitignored)
- Restrict your Google Maps API key to specific domains
- Set API key usage limits in Google Cloud Console

❌ **DON'T:**
- Commit `.env` or `.env.local` files
- Hardcode API keys in your source code
- Share API keys publicly
- Use unrestricted API keys

## Troubleshooting

**Deployment fails:**
- Check the Actions tab for error messages
- Verify your API key secret is set correctly
- Ensure GitHub Pages is enabled with "GitHub Actions" as source

**Site shows 404:**
- Verify the base path matches your repository name
- Check that the workflow completed successfully
- Wait a few minutes for DNS propagation

**API key not working:**
- Verify the key is set in GitHub Secrets
- Check that "Places API (New)" is enabled in Google Cloud
- Verify API key restrictions allow your GitHub Pages domain

## Updating Your Site

Simply push to the `main` branch:
```bash
git add .
git commit -m "Your changes"
git push origin main
```

The deployment will happen automatically!

