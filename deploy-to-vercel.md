# Deploy JamAlert Frontend to Vercel

## Prerequisites

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

## Deployment Steps

### Option 1: Quick Deploy (Recommended)

1. **Navigate to the project root**:
   ```bash
   cd c:\Users\cobek\Desktop\JamAlert_Hackathon
   ```

2. **Deploy with Vercel CLI**:
   ```bash
   vercel --prod
   ```

3. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? Choose your account/team
   - Link to existing project? **N** (for first deployment)
   - What's your project's name? **jamalert-frontend-demo**
   - In which directory is your code located? **./** (current directory)

### Option 2: GitHub Integration Deploy

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add Vercel deployment configuration"
   git push origin main
   ```

2. **Import from GitHub**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Configure project settings:
     - **Project Name**: `jamalert-frontend-demo`
     - **Framework Preset**: Next.js
     - **Root Directory**: `./` (leave empty for root)
     - **Build Command**: `npm run build`
     - **Output Directory**: `.next`
     - **Install Command**: `npm install`

3. **Environment Variables** (add these in Vercel dashboard):
   ```
   NEXT_PUBLIC_DEMO_MODE=true
   NEXT_PUBLIC_API_BASE_URL=https://jamalert-demo-api.vercel.app/api
   NEXT_PUBLIC_APP_NAME=JamAlert Demo
   NEXT_PUBLIC_APP_VERSION=1.0.0-demo
   ```

## Configuration Files Created

The following files have been created for the Vercel deployment:

1. **`vercel.json`** - Vercel deployment configuration
2. **`.env.production`** - Production environment variables
3. **`README-VERCEL-DEMO.md`** - Demo documentation
4. **Updated `lib/api-client.ts`** - Added demo mode with mock data

## Expected Deployment URL

Your deployment will be available at:
- **Production**: `https://jamalert-frontend-demo.vercel.app`
- **Preview**: `https://jamalert-frontend-demo-git-main-[username].vercel.app`

## Demo Features Enabled

✅ **Mock Data Mode**: All API calls return realistic sample data  
✅ **Offline Functionality**: Works without backend connection  
✅ **Full UI Experience**: All pages and components functional  
✅ **Responsive Design**: Mobile and desktop optimized  
✅ **Interactive Map**: Shows mock incident locations  
✅ **Form Submissions**: Simulate successful operations  

## Verification Steps

After deployment, test these key features:

1. **Home Page**: Check landing page loads with mock alerts
2. **Registration**: Test form submission (mock success)
3. **Login**: Test authentication flow (mock login)
4. **Dashboard**: Verify user dashboard with mock data
5. **Map**: Check interactive map with mock incidents
6. **Admin Pages**: Test admin interface (mock data)
7. **Mobile**: Test responsive design on mobile devices

## Sharing with Team

Once deployed, share the URL with your team members:

```
🚀 JamAlert Frontend Demo is live!

Demo URL: https://jamalert-frontend-demo.vercel.app

This is a fully functional demo with:
- All UI components and pages
- Mock data for realistic testing
- Responsive design for all devices
- No backend required

Perfect for reviewing the current state of the application!
```

## Troubleshooting

### Build Errors
If you encounter build errors:
```bash
npm run build
```
Fix any issues locally first, then redeploy.

### Environment Variables
Make sure these are set in Vercel dashboard:
- `NEXT_PUBLIC_DEMO_MODE=true`
- `NEXT_PUBLIC_API_BASE_URL=https://jamalert-demo-api.vercel.app/api`

### Domain Issues
If you want a custom domain:
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings > Domains
4. Add your custom domain

## Next Steps

After successful deployment:
1. Share the URL with your team
2. Gather feedback on UI/UX
3. Test on different devices
4. Continue development based on feedback
5. Keep Azure deployment for final production

---

**Note**: This is a temporary demo deployment. The final production system will be deployed on Azure as required for the hackathon submission.
