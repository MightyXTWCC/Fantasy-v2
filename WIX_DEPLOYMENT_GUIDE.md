# Fantasy Cricket System - Wix Deployment Guide

## Overview
Your fantasy cricket system can be integrated with Wix in several ways. This guide covers the recommended approaches for deployment and admin access.

## 1. Deployment Options for Wix Integration

### Option A: Standalone Deployment + Wix iFrame (Recommended)
This is the easiest approach that maintains full functionality:

**Steps:**
1. Deploy your application to a hosting platform (Railway, Render, or Vercel)
2. Embed it in your Wix site using an HTML iframe
3. Admin access remains through the deployed app

**Wix Implementation:**
```html
<!-- Add this to a Wix HTML element -->
<iframe 
  src="https://your-fantasy-cricket-app.com" 
  width="100%" 
  height="800px"
  frameborder="0"
  style="min-height: 100vh;">
</iframe>
```

**Pros:**
- Full functionality preserved
- Easy admin access
- No code rewriting needed
- Automatic updates

**Cons:**
- Iframe limitations (scrolling, responsiveness)
- Separate authentication from Wix users

### Option B: Wix Velo Integration
Rebuild the system using Wix's native database and Velo (code backend):

**Features to recreate:**
- User management (using Wix Members)
- Player database
- Fantasy team logic
- Admin panel for stats updates

**Admin Access:**
- Use Wix's built-in member roles
- Create admin-only pages
- Use Wix Data API for CRUD operations

### Option C: Hybrid Approach
Keep your backend API separate and create a Wix frontend:

**Architecture:**
- Deploy your Express API to Railway/Render
- Create Wix pages that call your API
- Use Wix Fetch API to communicate with backend

## 2. Recommended Hosting Platforms

### Railway (Recommended)
**Why Railway:**
- Easy Node.js deployment
- Built-in SQLite support
- Automatic deployments from GitHub
- Affordable pricing ($5-20/month)

**Deployment Steps:**
1. Connect your GitHub repository
2. Railway auto-detects Node.js
3. Set environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-secure-secret
   PORT=3000
   ```
4. Deploy automatically

### Render
**Similar to Railway:**
- Free tier available
- Easy deployment
- Good for small to medium apps

### Vercel (For static + serverless)
**Best for:**
- If you want to separate frontend/backend
- Use Vercel Functions for API
- PostgreSQL for database (Vercel doesn't support SQLite)

## 3. Admin Access Implementation

### Current Admin Features
Your system already has admin authentication built-in:
- Admin user creation during database setup
- JWT-based authentication
- Protected admin routes
- Role-based permissions

### Admin Workflow
1. **Login as admin** using the credentials
2. **Access admin panel** at `/admin` route
3. **Add player stats** after each match
4. **Create new players and matches**
5. **H2H scores update automatically**

### Admin Account Setup
The system creates a default admin account:
```
Username: admin
Password: admin123 (change this immediately)
Email: admin@example.com
```

**Important:** Change the default password immediately after deployment!

## 4. Step-by-Step Deployment Guide

### Step 1: Prepare for Deployment
1. Create a GitHub repository
2. Push your code to GitHub
3. Update admin password in database migration

### Step 2: Deploy to Railway
1. Go to Railway.app
2. Connect GitHub account
3. Select your repository
4. Configure environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-very-secure-secret-key-here
   ```
5. Deploy

### Step 3: Database Setup
Railway automatically creates the SQLite database from your migrations.

### Step 4: Integrate with Wix
1. Copy your Railway deployment URL
2. In Wix Editor, add HTML element
3. Embed iframe with your app URL
4. Style the iframe to fit your design

### Step 5: Admin Access
1. Visit your deployed app URL
2. Login with admin credentials
3. Change default password
4. Test creating players and matches
5. Add some sample stats to test functionality

## 5. Authentication Strategy

### For iFrame Integration
Users create accounts directly in your app (separate from Wix users).

### For Wix Velo Integration
Replace the authentication system with Wix Members:
```javascript
// Example Wix Velo code
import wixUsers from 'wix-users';
import wixData from 'wix-data';

// Check if user is logged in
if (wixUsers.currentUser.loggedIn) {
  // User is authenticated
  const userId = wixUsers.currentUser.id;
}
```

## 6. Production Configuration

### Environment Variables
Set these in your hosting platform:
```
NODE_ENV=production
JWT_SECRET=your-secure-secret-min-32-characters
DATA_DIRECTORY=/app/data
PORT=3000
```

### Database Backup
Since you're using SQLite:
- Railway automatically backs up your data
- Consider periodic manual backups
- For high traffic, consider migrating to PostgreSQL

### Security Considerations
1. **Change default admin password**
2. **Use HTTPS** (hosting platforms provide this)
3. **Set secure JWT secret**
4. **Enable CORS** properly for Wix domain
5. **Input validation** is already implemented

## 7. Maintenance and Updates

### Adding Stats After Matches
1. Login as admin
2. Go to Admin → Add Stats
3. Select player and match
4. Enter performance stats
5. System automatically:
   - Calculates fantasy points
   - Updates player values
   - Updates H2H matchup scores
   - Refreshes leaderboard

### Creating New Seasons
1. Create new matches for upcoming games
2. Add new players if needed
3. Users can buy/sell players for new season
4. H2H matchups work for any match

## 8. Cost Breakdown

### Monthly Costs:
- **Railway hosting:** $5-20
- **Domain (optional):** $1-2/month
- **Wix plan:** Your existing plan
- **Total:** $6-22/month

### One-time Costs:
- Setup and integration: 2-4 hours
- Testing and customization: 2-3 hours

## 9. Support and Troubleshooting

### Common Issues:
1. **Database connection:** Check DATA_DIRECTORY environment variable
2. **Authentication errors:** Verify JWT_SECRET is set
3. **Admin access:** Confirm user has is_admin = 1 in database
4. **H2H not updating:** Check if match stats are being added correctly

### Monitoring:
- Railway provides logs and monitoring
- Check server logs for errors
- Monitor database size and performance

## 10. Future Enhancements

### Possible Additions:
1. **Email notifications** for H2H results
2. **Mobile app** using same backend
3. **Multiple leagues** support
4. **Draft system** for player selection
5. **Trading system** between users
6. **Advanced statistics** and analytics

This deployment approach ensures you maintain full control over your fantasy cricket system while integrating seamlessly with your Wix website.
