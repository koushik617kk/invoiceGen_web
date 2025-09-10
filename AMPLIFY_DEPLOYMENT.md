# AWS Amplify Deployment Guide for InvoiceGen Web

## Prerequisites
- AWS Account with Amplify access
- Your backend API deployed and accessible
- Domain name (optional, Amplify provides free subdomain)

## Step 1: Prepare Environment Variables

### Required Environment Variables in Amplify Console:
1. Go to your Amplify app → Environment variables
2. Add the following variables:

```
VITE_API_BASE = https://api.invoiceGen.in
VITE_ENVIRONMENT = production
```

### Optional Environment Variables:
```
VITE_PAYMENT_GATEWAY_URL = https://your-payment-gateway.com/checkout
VITE_APP_VERSION = 1.0.0
```

## Step 2: Deploy to Amplify

### Option A: Connect GitHub Repository
1. Go to AWS Amplify Console
2. Click "New app" → "Host web app"
3. Choose "GitHub" as source
4. Select your repository
5. Choose branch (usually `main` or `master`)
6. The `amplify.yml` file will be automatically detected

### Option B: Manual Deploy
1. Build your project locally:
   ```bash
   npm run build
   ```
2. Upload the `dist` folder to Amplify

## Step 3: Configure Build Settings

The `amplify.yml` file is already configured for your Vite + React + TypeScript project:

- **Node.js Version**: Latest LTS (automatically detected)
- **Build Command**: `npm run build`
- **Base Directory**: `dist`
- **Build Output**: All files in `dist/` folder

## Step 4: Custom Domain (Optional)

1. In Amplify Console → Domain management
2. Add your custom domain
3. Configure DNS records as instructed
4. SSL certificate will be automatically provisioned

## Step 5: Environment-Specific Deployments

### Development Branch
- Use `.env.development` settings
- Debug sections will be visible
- API points to development server

### Production Branch
- Use `.env.production` settings  
- Debug sections hidden
- API points to production server

## Build Process Details

The `amplify.yml` file handles:

1. **Pre-build Phase**:
   - Installs dependencies with `npm ci`
   - Verifies Node.js/npm versions
   - Checks environment variables
   - Creates `.env.production` if missing

2. **Build Phase**:
   - Runs `npm run build`
   - Verifies build output
   - Shows build size information

3. **Post-build Phase**:
   - Verifies critical files exist
   - Shows build summary
   - Lists largest files for optimization

## Troubleshooting

### Common Issues:

1. **Build Fails**: Check environment variables are set
2. **404 Errors**: Verify `baseDirectory` is set to `dist`
3. **API Errors**: Ensure `VITE_API_BASE` points to correct backend
4. **TypeScript Errors**: Run `npm run build` locally first

### Debug Commands:
```bash
# Test build locally
npm run build

# Preview production build
npm run preview

# Check environment variables
echo $VITE_API_BASE
echo $VITE_ENVIRONMENT
```

## Performance Optimizations

The build process includes:
- Automatic code splitting
- Asset optimization
- Gzip compression (handled by Amplify)
- CDN distribution (handled by Amplify)

## Security Notes

- Environment variables are secure in Amplify
- Never commit `.env` files to repository
- Use `.env.example` as template
- Production builds don't include debug code

## Monitoring

After deployment:
1. Check Amplify Console for build logs
2. Monitor application performance
3. Set up CloudWatch alarms if needed
4. Configure custom error pages

## Rollback Strategy

1. Go to Amplify Console → App settings
2. Click on previous successful build
3. Click "Redeploy this version"
4. Or revert to previous commit in Git

---

**Note**: This configuration is optimized for Vite + React + TypeScript projects and follows AWS Amplify best practices.
