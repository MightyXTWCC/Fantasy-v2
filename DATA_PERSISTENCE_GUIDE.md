# Fantasy Cricket - Data Persistence Guide

## Database Storage Location

Your fantasy cricket system uses SQLite database stored in:
- **Location**: `DATA_DIRECTORY/database.sqlite`
- **Environment Variable**: `DATA_DIRECTORY` (defaults to `./data` if not set)
- **File**: `database.sqlite`

## Data Persistence Between Versions

### What Gets Preserved
✅ **All user accounts and passwords**
✅ **All created players and their stats**
✅ **All matches and results**  
✅ **All user teams and purchases**
✅ **All H2H matchups and scores**
✅ **Complete leaderboard history**

### How It Works
1. **Development**: Database is stored in local `./data/database.sqlite`
2. **Production**: Database location is set by `DATA_DIRECTORY` environment variable
3. **Deployments**: The database file persists across code updates

### Ensuring Data Persistence

#### For Local Development
```bash
# Data is automatically saved to ./data/database.sqlite
# This file persists between npm start sessions
```

#### For Production Deployments

**Railway/Render:**
- Database files are automatically persisted
- Set `DATA_DIRECTORY` environment variable to persistent volume path
- Database survives code deployments

**Vercel/Netlify:**
- SQLite not recommended (serverless limitations)
- Consider migrating to PostgreSQL for these platforms

### Backing Up Your Data

#### Manual Backup
```bash
# Copy your database file
cp ./data/database.sqlite ./backup/database-backup-$(date +%Y%m%d).sqlite
```

#### Automated Backup (Recommended)
Add this to your deployment pipeline:

```bash
# Before deployment
mkdir -p backups
cp $DATA_DIRECTORY/database.sqlite backups/backup-$(date +%Y%m%d-%H%M%S).sqlite
```

### Migration Between Hosting Platforms

#### From Railway to Another Platform:
1. Download database file from Railway
2. Upload to new platform's persistent storage
3. Set `DATA_DIRECTORY` environment variable
4. Deploy application

#### Database Export/Import:
```bash
# Export data to SQL
sqlite3 database.sqlite .dump > backup.sql

# Import to new database
sqlite3 new-database.sqlite < backup.sql
```

### Database Schema Migrations

The system automatically handles database schema updates:
- New tables are created automatically
- Existing data is preserved
- Schema changes are applied via migration scripts

### Important Environment Variables

Set these in production:
```bash
NODE_ENV=production
DATA_DIRECTORY=/app/data  # Or your persistent volume path
JWT_SECRET=your-secure-secret-key
PORT=3000
```

### Data Recovery

If you lose data, you can:
1. Restore from backup file
2. Recreate admin user using the script:
```bash
npm run create-admin
```

### Best Practices

1. **Regular Backups**: Set up automated daily backups
2. **Test Migrations**: Test locally before deploying
3. **Monitor Storage**: Check database file size periodically
4. **Environment Variables**: Always set `DATA_DIRECTORY` in production
5. **Admin Access**: Keep admin credentials secure and updated

### Database Size Management

Current limits:
- SQLite: Up to several GB (sufficient for most fantasy leagues)
- For larger scales (1000+ users), consider PostgreSQL migration

Your data will persist across:
- Code updates and deployments
- Server restarts
- Platform migrations (with proper backup/restore)
- Fantasy season changes

The database grows with:
- New user registrations
- Player stat entries
- Match results
- H2H matchup creation

**Note**: Always test backup/restore procedures before deploying to production!
