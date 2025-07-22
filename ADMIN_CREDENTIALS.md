# Fantasy Cricket - Admin Login Credentials

## Default Admin Account

**Username:** `admin`
**Password:** `admin123`
**Email:** `admin@fantasy-cricket.com`

## First Time Setup

1. **Login with the credentials above**
2. **IMMEDIATELY change the password** via Account Settings
3. **Update the email** to your actual email address

## Creating Additional Admin Users

As an admin, you can:
1. Go to Admin Panel → Manage Users
2. Edit any existing user and toggle "Admin Access" on
3. Or create a new user normally and then promote them to admin

## Admin Capabilities

### Player Management
- Create new players
- Delete existing players (if not owned by users)
- Search through all players

### Match Management  
- Create new matches
- Delete matches (if no stats exist)
- View all scheduled matches

### Statistics Management
- Add player performance stats after each match
- Search players and matches when adding stats
- Automatic point calculation with position bonuses:
  - **Wicket-keepers get 50% bonus** for fielding actions
  - Points automatically update player values
  - H2H matchup scores update automatically

### User Management
- View all users and their teams
- Edit user details (username, email, budget)
- Grant/revoke admin access
- View team compositions and player purchases

### Head-to-Head Management
- Create H2H matchups between users
- View all matchup results
- Scores calculate automatically when stats are added

## Security Notes

⚠️ **CRITICAL**: Change the default admin password immediately after first login!

## Creating Admin Account via Script

If needed, you can recreate the admin account using:

```bash
npm run create-admin
```

This will:
- Delete any existing admin user
- Create a fresh admin account with default credentials
- Set budget to $1,000,000

## Password Recovery

If you lose admin access:
1. Run `npm run create-admin` to recreate the default admin
2. Login with default credentials
3. Update your settings appropriately

## Database Location

Admin data (like all data) is stored in:
- Development: `./data/database.sqlite` 
- Production: `$DATA_DIRECTORY/database.sqlite`

This ensures your admin account persists across deployments and version updates.
