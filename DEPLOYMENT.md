# GitHub Pages Deployment Guide

This guide will help you deploy the Cover Letter Generator to GitHub Pages.

## Prerequisites

- A GitHub account
- Git installed on your local machine
- The repository pushed to GitHub

## Deployment Steps

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section (in the left sidebar)
4. Under **Source**, select **GitHub Actions**
5. Save the settings

### 2. Push Your Code

The GitHub Actions workflow will automatically deploy when you push to the `main` branch:

```bash
git add .
git commit -m "Configure GitHub Pages deployment"
git push origin main
```

### 3. Monitor Deployment

1. Go to the **Actions** tab in your GitHub repository
2. You should see a workflow run called "Deploy to GitHub Pages"
3. Wait for it to complete (usually takes 2-3 minutes)
4. Once complete, your site will be available at:
   ```
   https://[your-username].github.io/
   ```

## Manual Deployment (Alternative)

If you prefer to deploy manually:

1. Build the project:
   ```bash
   cd app
   npm run build
   ```

2. Copy the `dist` folder contents to a `gh-pages` branch:
   ```bash
   git checkout -b gh-pages
   git add dist/
   git commit -m "Deploy to GitHub Pages"
   git subtree push --prefix dist origin gh-pages
   ```

## Troubleshooting

### Base Path Issues

If your site is not loading correctly, check the `base` path in `app/vite.config.ts`. For root deployment, it should be:

```typescript
base: '/',
```

If you're deploying to a subdirectory (e.g., `username.github.io/repo-name/`), update this to match your repository name.

### 404 Errors

- Ensure the base path in `vite.config.ts` matches your repository name
- Make sure all assets are loading correctly (check browser console)
- Verify the GitHub Actions workflow completed successfully

### Build Failures

- Check Node.js version compatibility (requires Node.js 20.19+ or 22.12+)
- Ensure all dependencies are installed: `npm ci`
- Review the Actions logs for specific error messages

## Updating the Site

Every time you push changes to the `main` branch, GitHub Actions will automatically rebuild and redeploy your site. No manual intervention needed!

## Custom Domain (Optional)

To use a custom domain:

1. Add a `CNAME` file to the `app/public` folder with your domain name
2. Configure DNS settings with your domain provider
3. Update GitHub Pages settings to use your custom domain
