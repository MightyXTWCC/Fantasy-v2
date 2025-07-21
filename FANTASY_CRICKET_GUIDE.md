# Fantasy Cricket System Guide

## Points Calculation System

The fantasy cricket points are calculated based on real cricket performance metrics. Here's how it works:

### Batting Points
- **1 point per run** - Base scoring for runs scored
- **1 extra point per four** - Bonus for boundary hits
- **2 extra points per six** - Higher bonus for sixes
- **8 points for 50+ runs** - Half-century bonus
- **16 points for 100+ runs** - Century bonus (additional to half-century)

### Bowling Points
- **25 points per wicket** - Main bowling reward
- **-0.5 points per run conceded** - Penalty for expensive bowling
- **4 points for 3+ wickets** - Three-wicket bonus
- **8 points for 5+ wickets** - Five-wicket bonus (additional to three-wicket)

### Fielding Points
- **8 points per catch** - Reward for catches
- **12 points per stumping** - Wicket-keeper specific
- **6 points per run out** - Direct hit/participation in run outs

### Captain Bonus
- **Double points** - Captain's total points are multiplied by 2

### Example Calculation
If a player scores:
- 75 runs, 8 fours, 2 sixes, 1 catch
- Points = 75 + 8 + 4 + 8 (50+ bonus) + 8 = 103 points
- If captain: 103 × 2 = 206 points

## Extending to Multiple Users

### Current System
- Uses hardcoded user ID 1 for demo purposes
- Single admin user with ID 1

### To Support Multiple Users:

#### 1. User Authentication System
```javascript
// Add user registration/login endpoints
app.post('/api/register', async (req, res) => {
  // Create new user account
});

app.post('/api/login', async (req, res) => {
  // Authenticate user and return session/JWT
});
```

#### 2. Session Management
- Add JWT tokens or session cookies
- Protect API endpoints with authentication middleware
- Replace hardcoded user ID 1 with authenticated user ID

#### 3. User Management Features
- User registration form
- Login/logout functionality
- User profile management
- Password reset capabilities

#### 4. Admin Controls
- Only users with `is_admin = 1` can:
  - Create players
  - Create matches
  - Add player stats
- Regular users can only:
  - View players
  - Buy/sell players
  - Set captain
  - View leaderboard

#### 5. Additional Features to Consider
- **League System**: Multiple leagues with different user groups
- **Draft System**: Users take turns picking players
- **Trade System**: Users can trade players with each other
- **Matchday Deadlines**: Lock teams before matches start
- **Substitutions**: Allow limited player changes during season

## Deployment Options

### Option 1: Standalone Web Application

#### Hosting Platforms:
1. **Vercel** (Recommended for React apps)
   - Deploy frontend to Vercel
   - Use Vercel Functions for API
   - Use Vercel Postgres or external database

2. **Netlify**
   - Similar to Vercel
   - Good for static sites with serverless functions

3. **Railway/Render**
   - Full-stack deployment
   - Supports Node.js backend with SQLite
   - Easy database management

4. **Traditional VPS (DigitalOcean, AWS EC2)**
   - Full control over environment
   - Can run SQLite database directly
   - Requires more server management

#### Deployment Steps:
```bash
# Build the application
npm run build

# Deploy to chosen platform
# Follow platform-specific deployment guides
```

### Option 2: Wix Website Integration

#### Method 1: Embed as iFrame
```html
<!-- Add to Wix page -->
<iframe 
  src="https://your-fantasy-cricket-app.com" 
  width="100%" 
  height="800px"
  frameborder="0">
</iframe>
```

#### Method 2: Wix Velo (Code Backend)
- Recreate the system using Wix's database
- Use Wix Velo for backend logic
- Integrate with Wix's user management system

#### Method 3: API Integration
- Deploy the backend API separately
- Create Wix frontend that calls your API
- Use Wix's HTTP functions to communicate with your backend

### Option 3: Mobile App
- Use React Native to convert the React components
- Deploy to App Store and Google Play
- Use same backend API

## Database Considerations

### Current: SQLite
- **Pros**: Simple, serverless, good for development
- **Cons**: Not ideal for multiple concurrent users

### Production Recommendations:
1. **PostgreSQL** - Robust, handles concurrent users well
2. **MySQL** - Popular, reliable
3. **MongoDB** - NoSQL option, flexible schema

### Migration Steps:
1. Export current SQLite data
2. Set up production database
3. Update Kysely configuration
4. Import data to new database

## Security Considerations

### Current Issues:
- No authentication
- No input validation
- No rate limiting

### Production Requirements:
1. **Input Validation**: Validate all user inputs
2. **SQL Injection Prevention**: Kysely helps, but validate inputs
3. **Authentication**: JWT tokens or session management
4. **Authorization**: Role-based access control
5. **Rate Limiting**: Prevent API abuse
6. **HTTPS**: Encrypt all communications
7. **Environment Variables**: Secure API keys and database credentials

## Performance Optimizations

### Database:
- Add indexes for frequently queried columns
- Implement database connection pooling
- Use caching for static data (Redis)

### Frontend:
- Implement pagination for large lists
- Add loading states and error handling
- Use React.memo for expensive components
- Implement virtual scrolling for large datasets

### API:
- Add request/response compression
- Implement API response caching
- Use CDN for static assets

## Next Steps

1. **Immediate**: Add user authentication system
2. **Short-term**: Deploy to hosting platform
3. **Medium-term**: Add advanced features (trading, leagues)
4. **Long-term**: Mobile app development

## Cost Estimates

### Hosting (Monthly):
- **Vercel**: $0-20 (free tier available)
- **Railway**: $5-20
- **AWS/DigitalOcean**: $10-50

### Database:
- **Vercel Postgres**: $0-20
- **PlanetScale**: $0-29
- **AWS RDS**: $15-100+

### Domain**: $10-15/year

**Total**: $20-100/month depending on usage and features
