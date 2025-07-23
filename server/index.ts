import express from 'express';
import dotenv from 'dotenv';
import { setupStaticServing } from './static-serve.js';
import { db } from './database.js';
import { hashPassword, verifyPassword, generateToken, authenticateUser, requireAdmin } from './auth.js';

dotenv.config();

const app = express();

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Check if rounds are locked (middleware)
async function checkLockout(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const activeRound = await db.selectFrom('rounds')
      .selectAll()
      .where('is_active', '=', 1)
      .executeTakeFirst();

    if (activeRound) {
      const now = new Date();
      const lockoutTime = new Date(activeRound.lockout_time);
      
      if (now >= lockoutTime && !activeRound.is_locked) {
        // Update round to locked
        await db.updateTable('rounds')
          .set({ is_locked: 1 })
          .where('id', '=', activeRound.id)
          .execute();
      }
      
      if (activeRound.is_locked || now >= lockoutTime) {
        res.status(423).json({ error: 'Team changes are locked during active round' });
        return;
      }
    }

    next();
  } catch (error) {
    console.error('Lockout check error:', error);
    next();
  }
}

// Calculate points based on stats with position-based bonuses, multipliers, and custom bonus rules
async function calculatePoints(stats: any, playerPosition: string, roundId: number, playerId: number): Promise<number> {
  let points = 0;
  
  // Batting points
  points += stats.runs * 1; // 1 point per run
  points += stats.fours * 1; // 1 extra point per four
  points += stats.sixes * 2; // 2 extra points per six
  
  // Bowling points
  points += stats.wickets * 25; // 25 points per wicket
  points -= Math.floor(stats.runs_conceded / 2); // -0.5 points per run conceded
  
  // Fielding points with position-based bonuses
  const catches = stats.catches || 0;
  const stumpings = stats.stumpings || 0;
  const runOuts = stats.run_outs || 0;
  
  // Position-based fielding multipliers
  let fieldingMultiplier = 1;
  if (playerPosition === 'Wicket-keeper') {
    fieldingMultiplier = 1.5; // 50% bonus for keepers
  }
  
  points += Math.floor(catches * 8 * fieldingMultiplier); // Base 8 points per catch
  points += Math.floor(stumpings * 12 * fieldingMultiplier); // Base 12 points per stumping (keepers only usually)
  points += Math.floor(runOuts * 6 * fieldingMultiplier); // Base 6 points per run out
  
  // Standard bonus points
  if (stats.runs >= 50) points += 8; // Half century bonus
  if (stats.runs >= 100) points += 16; // Century bonus
  if (stats.wickets >= 3) points += 4; // 3 wicket bonus
  if (stats.wickets >= 5) points += 8; // 5 wicket bonus
  
  // Apply custom bonus rules for this round
  try {
    const bonusRules = await db.selectFrom('bonus_rules')
      .selectAll()
      .where('round_id', '=', roundId)
      .execute();

    for (const rule of bonusRules) {
      const targetPositions = JSON.parse(rule.target_positions);
      const conditions = JSON.parse(rule.conditions);
      
      // Check if this rule applies to the player's position
      if (targetPositions.includes('All') || targetPositions.includes(playerPosition)) {
        let ruleApplies = true;
        
        // Check all conditions
        if (conditions.min_runs && stats.runs < conditions.min_runs) ruleApplies = false;
        if (conditions.max_runs && stats.runs > conditions.max_runs) ruleApplies = false;
        if (conditions.min_wickets && stats.wickets < conditions.min_wickets) ruleApplies = false;
        if (conditions.max_wickets && stats.wickets > conditions.max_wickets) ruleApplies = false;
        if (conditions.min_catches && catches < conditions.min_catches) ruleApplies = false;
        if (conditions.min_sixes && stats.sixes < conditions.min_sixes) ruleApplies = false;
        if (conditions.min_fours && stats.fours < conditions.min_fours) ruleApplies = false;
        
        if (ruleApplies) {
          points += rule.bonus_points;
          console.log(`Applied bonus rule "${rule.name}" to player ${playerId}: +${rule.bonus_points} points`);
        }
      }
    }
  } catch (error) {
    console.error('Error applying bonus rules:', error);
  }
  
  // Apply round multiplier for this player
  try {
    const multiplier = await db.selectFrom('round_multipliers')
      .select('multiplier')
      .where('round_id', '=', roundId)
      .where('player_id', '=', playerId)
      .executeTakeFirst();
    
    if (multiplier) {
      points = Math.floor(points * multiplier.multiplier);
      console.log(`Applied multiplier ${multiplier.multiplier}x to player ${playerId}: ${points} points`);
    }
  } catch (error) {
    console.error('Error applying multiplier:', error);
  }
  
  return Math.max(0, points); // Ensure points don't go negative
}

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    console.log('Registration attempt:', { username, email });

    if (!username || !email || !password) {
      res.status(400).json({ error: 'Username, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // Check if user already exists
    const existingUser = await db.selectFrom('users')
      .selectAll()
      .where((eb) => eb.or([
        eb('username', '=', username),
        eb('email', '=', email)
      ]))
      .executeTakeFirst();

    if (existingUser) {
      res.status(400).json({ error: 'Username or email already exists' });
      return;
    }

    // Create user
    const passwordHash = await hashPassword(password);
    const user = await db.insertInto('users')
      .values({
        username,
        email,
        password_hash: passwordHash,
        is_admin: 0,
        budget: 1000000
      })
      .returningAll()
      .executeTakeFirst();

    const token = generateToken(user.id);
    console.log('User registered successfully:', user.username);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        budget: user.budget
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', username);

    if (!username || !password) {
      res.status(400).json({ error: 'Username and password are required' });
      return;
    }

    // Find user
    const user = await db.selectFrom('users')
      .selectAll()
      .where('username', '=', username)
      .executeTakeFirst();

    if (!user || !await verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid username or password' });
      return;
    }

    const token = generateToken(user.id);
    console.log('User logged in successfully:', user.username);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        is_admin: user.is_admin,
        budget: user.budget
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/me', authenticateUser, async (req, res) => {
  try {
    res.json({
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      is_admin: req.user.is_admin,
      budget: req.user.budget
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Update user account
app.put('/api/account', authenticateUser, async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    console.log('Account update attempt for user:', req.user.id);

    // Verify current password
    if (!await verifyPassword(currentPassword, req.user.password_hash)) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    // Check if new username/email already exists (excluding current user)
    if (username !== req.user.username || email !== req.user.email) {
      const existingUser = await db.selectFrom('users')
        .selectAll()
        .where((eb) => eb.and([
          eb('id', '!=', req.user.id),
          eb.or([
            eb('username', '=', username),
            eb('email', '=', email)
          ])
        ]))
        .executeTakeFirst();

      if (existingUser) {
        res.status(400).json({ error: 'Username or email already exists' });
        return;
      }
    }

    // Prepare update data
    const updateData: any = { username, email };
    
    // Update password if provided
    if (newPassword && newPassword.length >= 6) {
      updateData.password_hash = await hashPassword(newPassword);
    } else if (newPassword && newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    // Update user
    await db.updateTable('users')
      .set(updateData)
      .where('id', '=', req.user.id)
      .execute();

    const updatedUser = await db.selectFrom('users')
      .selectAll()
      .where('id', '=', req.user.id)
      .executeTakeFirst();

    console.log('Account updated successfully for user:', updatedUser.username);

    res.json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      is_admin: updatedUser.is_admin,
      budget: updatedUser.budget
    });
  } catch (error) {
    console.error('Account update error:', error);
    res.status(500).json({ error: 'Failed to update account' });
  }
});

// Admin update any user
app.put('/api/admin/users/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { username, email, budget, is_admin } = req.body;
    console.log('Admin updating user:', userId);

    // Check if username/email already exists (excluding target user)
    const existingUser = await db.selectFrom('users')
      .selectAll()
      .where((eb) => eb.and([
        eb('id', '!=', userId),
        eb.or([
          eb('username', '=', username),
          eb('email', '=', email)
        ])
      ]))
      .executeTakeFirst();

    if (existingUser) {
      res.status(400).json({ error: 'Username or email already exists' });
      return;
    }

    // Update user
    await db.updateTable('users')
      .set({ username, email, budget, is_admin })
      .where('id', '=', userId)
      .execute();

    const updatedUser = await db.selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();

    console.log('User updated by admin:', updatedUser.username);
    res.json(updatedUser);
  } catch (error) {
    console.error('Admin user update error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Admin delete user
app.delete('/api/admin/users/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    console.log('Admin deleting user:', userId);

    // Don't allow deletion of the current admin user
    if (userId === req.user.id) {
      res.status(400).json({ error: 'Cannot delete your own admin account' });
      return;
    }

    // Delete user's team first
    await db.deleteFrom('user_teams')
      .where('user_id', '=', userId)
      .execute();

    // Delete user's sessions
    await db.deleteFrom('user_sessions')
      .where('user_id', '=', userId)
      .execute();

    // Delete user
    await db.deleteFrom('users')
      .where('id', '=', userId)
      .execute();

    console.log('User deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Admin manage user team - add player to user's team
app.post('/api/admin/users/:id/players', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { playerId, isSubstitute } = req.body;
    console.log(`Admin adding player ${playerId} to user ${userId} team`);

    // Check if user already owns this player
    const existingOwnership = await db.selectFrom('user_teams')
      .selectAll()
      .where('user_id', '=', userId)
      .where('player_id', '=', playerId)
      .executeTakeFirst();

    if (existingOwnership) {
      res.status(400).json({ error: 'User already owns this player' });
      return;
    }

    // Get player info
    const player = await db.selectFrom('players')
      .selectAll()
      .where('id', '=', playerId)
      .executeTakeFirst();

    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    // Add player to team
    await db.insertInto('user_teams')
      .values({
        user_id: userId,
        player_id: playerId,
        purchase_price: player.current_price,
        is_captain: 0,
        is_substitute: isSubstitute ? 1 : 0
      })
      .execute();

    console.log('Player added to user team successfully');
    res.json({ success: true, message: `Added ${player.name} to user's team` });
  } catch (error) {
    console.error('Error adding player to user team:', error);
    res.status(500).json({ error: 'Failed to add player to team' });
  }
});

// Admin manage user team - remove player from user's team
app.delete('/api/admin/users/:userId/players/:playerId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const playerId = parseInt(req.params.playerId);
    console.log(`Admin removing player ${playerId} from user ${userId} team`);

    // Remove player from team
    await db.deleteFrom('user_teams')
      .where('user_id', '=', userId)
      .where('player_id', '=', playerId)
      .execute();

    console.log('Player removed from user team successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing player from user team:', error);
    res.status(500).json({ error: 'Failed to remove player from team' });
  }
});

// Get all players (public) with search and team ownership info
app.get('/api/players', async (req, res) => {
  try {
    const { search } = req.query;
    const userId = req.user?.id; // Get user ID if authenticated
    console.log('Fetching players with search:', search, 'for user:', userId);
    
    let query = db.selectFrom('players').selectAll();
    
    if (search && typeof search === 'string') {
      query = query.where('name', 'like', `%${search}%`);
    }
    
    const players = await query.execute();
    
    // If user is authenticated, check which players they own
    let userTeam = [];
    if (userId) {
      userTeam = await db.selectFrom('user_teams')
        .select(['player_id'])
        .where('user_id', '=', userId)
        .execute();
    }
    
    const ownedPlayerIds = userTeam.map(t => t.player_id);
    
    // Add ownership information to players
    const playersWithOwnership = players.map(player => ({
      ...player,
      owned_by_user: ownedPlayerIds.includes(player.id)
    }));
    
    console.log(`Found ${players.length} players`);
    res.json(playersWithOwnership);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: 'Failed to fetch players' });
  }
});

// Create a new player (admin only)
app.post('/api/players', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name, position, base_price } = req.body;
    console.log('Creating player:', { name, position, base_price });
    
    const player = await db.insertInto('players')
      .values({
        name,
        position,
        base_price: base_price || 100000,
        current_price: base_price || 100000
      })
      .returningAll()
      .executeTakeFirst();
    
    console.log('Created player:', player);
    res.json(player);
  } catch (error) {
    console.error('Error creating player:', error);
    res.status(500).json({ error: 'Failed to create player' });
  }
});

// Update player price (admin only)
app.put('/api/players/:id/price', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const { current_price } = req.body;
    console.log('Admin updating player price:', playerId, 'to', current_price);

    await db.updateTable('players')
      .set({ current_price })
      .where('id', '=', playerId)
      .execute();

    const updatedPlayer = await db.selectFrom('players')
      .selectAll()
      .where('id', '=', playerId)
      .executeTakeFirst();

    console.log('Player price updated successfully');
    res.json(updatedPlayer);
  } catch (error) {
    console.error('Error updating player price:', error);
    res.status(500).json({ error: 'Failed to update player price' });
  }
});

// Delete player (admin only)
app.delete('/api/players/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    console.log('Admin deleting player:', playerId);

    // Check if player exists in any user teams
    const playerInTeams = await db.selectFrom('user_teams')
      .selectAll()
      .where('player_id', '=', playerId)
      .executeTakeFirst();

    if (playerInTeams) {
      res.status(400).json({ error: 'Cannot delete player who is owned by users' });
      return;
    }

    // Delete player stats first
    await db.deleteFrom('player_stats')
      .where('player_id', '=', playerId)
      .execute();

    // Delete round multipliers
    await db.deleteFrom('round_multipliers')
      .where('player_id', '=', playerId)
      .execute();

    // Delete player
    await db.deleteFrom('players')
      .where('id', '=', playerId)
      .execute();

    console.log('Player deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: 'Failed to delete player' });
  }
});

// ROUNDS MANAGEMENT

// Get all rounds (public) with search
app.get('/api/rounds', async (req, res) => {
  try {
    const { search } = req.query;
    console.log('Fetching rounds with search:', search);
    
    let query = db.selectFrom('rounds').selectAll().orderBy('round_number', 'asc');
    
    if (search && typeof search === 'string') {
      query = query.where('name', 'like', `%${search}%`);
    }
    
    const rounds = await query.execute();
    console.log(`Found ${rounds.length} rounds`);
    res.json(rounds);
  } catch (error) {
    console.error('Error fetching rounds:', error);
    res.status(500).json({ error: 'Failed to fetch rounds' });
  }
});

// Get current active round
app.get('/api/current-round', async (req, res) => {
  try {
    const activeRound = await db.selectFrom('rounds')
      .selectAll()
      .where('is_active', '=', 1)
      .executeTakeFirst();
    
    if (activeRound) {
      const now = new Date();
      const lockoutTime = new Date(activeRound.lockout_time);
      const isLocked = now >= lockoutTime;
      
      res.json({
        ...activeRound,
        is_locked: isLocked,
        time_until_lockout: isLocked ? 0 : lockoutTime.getTime() - now.getTime()
      });
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('Error fetching current round:', error);
    res.status(500).json({ error: 'Failed to fetch current round' });
  }
});

// Create a new round (admin only)
app.post('/api/rounds', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name, round_number, lockout_time } = req.body;
    console.log('Creating round:', { name, round_number, lockout_time });
    
    // Convert to Australian Eastern Standard Time
    const lockoutDate = new Date(lockout_time);
    
    const round = await db.insertInto('rounds')
      .values({
        name,
        round_number,
        lockout_time: lockoutDate.toISOString(),
        is_locked: 0,
        is_active: 0
      })
      .returningAll()
      .executeTakeFirst();
    
    console.log('Created round:', round);
    res.json(round);
  } catch (error) {
    console.error('Error creating round:', error);
    res.status(500).json({ error: 'Failed to create round' });
  }
});

// Update round (admin only)
app.put('/api/rounds/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const roundId = parseInt(req.params.id);
    const { name, round_number, lockout_time, is_active } = req.body;
    console.log('Admin updating round:', roundId);

    // If setting this round as active, deactivate all others
    if (is_active) {
      await db.updateTable('rounds')
        .set({ is_active: 0 })
        .execute();
    }

    const lockoutDate = new Date(lockout_time);

    await db.updateTable('rounds')
      .set({ 
        name, 
        round_number, 
        lockout_time: lockoutDate.toISOString(),
        is_active: is_active ? 1 : 0,
        is_locked: 0 // Reset locked status when updating
      })
      .where('id', '=', roundId)
      .execute();

    const updatedRound = await db.selectFrom('rounds')
      .selectAll()
      .where('id', '=', roundId)
      .executeTakeFirst();

    console.log('Round updated by admin:', updatedRound);
    res.json(updatedRound);
  } catch (error) {
    console.error('Admin round update error:', error);
    res.status(500).json({ error: 'Failed to update round' });
  }
});

// Delete round (admin only)
app.delete('/api/rounds/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const roundId = parseInt(req.params.id);
    console.log('Admin deleting round:', roundId);

    // Check if round has stats
    const roundHasStats = await db.selectFrom('player_stats')
      .selectAll()
      .where('round_id', '=', roundId)
      .executeTakeFirst();

    if (roundHasStats) {
      res.status(400).json({ error: 'Cannot delete round that has player stats' });
      return;
    }

    // Check if round has H2H matchups
    const roundHasH2H = await db.selectFrom('h2h_matchups')
      .selectAll()
      .where('round_id', '=', roundId)
      .executeTakeFirst();

    if (roundHasH2H) {
      res.status(400).json({ error: 'Cannot delete round that has H2H matchups' });
      return;
    }

    // Delete round multipliers and bonus rules
    await db.deleteFrom('round_multipliers')
      .where('round_id', '=', roundId)
      .execute();

    await db.deleteFrom('bonus_rules')
      .where('round_id', '=', roundId)
      .execute();

    // Delete round
    await db.deleteFrom('rounds')
      .where('id', '=', roundId)
      .execute();

    console.log('Round deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting round:', error);
    res.status(500).json({ error: 'Failed to delete round' });
  }
});

// Start new round (admin only) - FIXED: Properly moves current round points to total
app.post('/api/start-round/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const roundId = parseInt(req.params.id);
    console.log('Starting new round:', roundId);

    // Move current round points to total points for all players
    const players = await db.selectFrom('players')
      .selectAll()
      .where('current_round_points', '>', 0)
      .execute();

    for (const player of players) {
      await db.updateTable('players')
        .set({ 
          total_points: player.total_points + player.current_round_points,
          current_round_points: 0
        })
        .where('id', '=', player.id)
        .execute();
    }

    // Set all rounds to inactive
    await db.updateTable('rounds')
      .set({ is_active: 0, is_locked: 0 })
      .execute();

    // Set the selected round as active
    await db.updateTable('rounds')
      .set({ is_active: 1, is_locked: 0 })
      .where('id', '=', roundId)
      .execute();

    console.log('New round started successfully - moved current points to total');
    res.json({ success: true });
  } catch (error) {
    console.error('Error starting new round:', error);
    res.status(500).json({ error: 'Failed to start new round' });
  }
});

// MULTIPLIER MANAGEMENT

// Get round multipliers for a round (admin only)
app.get('/api/rounds/:id/multipliers', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const roundId = parseInt(req.params.id);
    console.log('Fetching multipliers for round:', roundId);

    const multipliers = await db.selectFrom('round_multipliers')
      .leftJoin('players', 'round_multipliers.player_id', 'players.id')
      .select([
        'round_multipliers.id',
        'round_multipliers.player_id',
        'round_multipliers.multiplier',
        'players.name as player_name',
        'players.position as player_position'
      ])
      .where('round_id', '=', roundId)
      .execute();

    res.json(multipliers);
  } catch (error) {
    console.error('Error fetching round multipliers:', error);
    res.status(500).json({ error: 'Failed to fetch multipliers' });
  }
});

// Set player multiplier for a round (admin only)
app.post('/api/rounds/:id/multipliers', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const roundId = parseInt(req.params.id);
    const { player_id, multiplier } = req.body;
    console.log('Setting multiplier for round:', roundId, 'player:', player_id, 'multiplier:', multiplier);

    await db.insertInto('round_multipliers')
      .values({
        round_id: roundId,
        player_id,
        multiplier
      })
      .onConflict((oc) => oc.columns(['round_id', 'player_id']).doUpdateSet({ multiplier }))
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error setting multiplier:', error);
    res.status(500).json({ error: 'Failed to set multiplier' });
  }
});

// Delete player multiplier for a round (admin only)
app.delete('/api/rounds/:roundId/multipliers/:playerId', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const roundId = parseInt(req.params.roundId);
    const playerId = parseInt(req.params.playerId);
    console.log('Deleting multiplier for round:', roundId, 'player:', playerId);

    await db.deleteFrom('round_multipliers')
      .where('round_id', '=', roundId)
      .where('player_id', '=', playerId)
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting multiplier:', error);
    res.status(500).json({ error: 'Failed to delete multiplier' });
  }
});

// BONUS RULES MANAGEMENT

// Get bonus rules for a round (admin only)
app.get('/api/rounds/:id/bonus-rules', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const roundId = parseInt(req.params.id);
    console.log('Fetching bonus rules for round:', roundId);

    const bonusRules = await db.selectFrom('bonus_rules')
      .selectAll()
      .where('round_id', '=', roundId)
      .execute();

    // Parse JSON fields for easier frontend handling
    const parsedRules = bonusRules.map(rule => ({
      ...rule,
      target_positions: JSON.parse(rule.target_positions),
      conditions: JSON.parse(rule.conditions)
    }));

    res.json(parsedRules);
  } catch (error) {
    console.error('Error fetching bonus rules:', error);
    res.status(500).json({ error: 'Failed to fetch bonus rules' });
  }
});

// Create bonus rule for a round (admin only)
app.post('/api/rounds/:id/bonus-rules', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const roundId = parseInt(req.params.id);
    const { name, description, bonus_points, target_positions, conditions } = req.body;
    console.log('Creating bonus rule for round:', roundId);

    const bonusRule = await db.insertInto('bonus_rules')
      .values({
        round_id: roundId,
        name,
        description,
        bonus_points,
        target_positions: JSON.stringify(target_positions),
        conditions: JSON.stringify(conditions)
      })
      .returningAll()
      .executeTakeFirst();

    res.json({
      ...bonusRule,
      target_positions: JSON.parse(bonusRule.target_positions),
      conditions: JSON.parse(bonusRule.conditions)
    });
  } catch (error) {
    console.error('Error creating bonus rule:', error);
    res.status(500).json({ error: 'Failed to create bonus rule' });
  }
});

// Delete bonus rule (admin only)
app.delete('/api/bonus-rules/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const ruleId = parseInt(req.params.id);
    console.log('Deleting bonus rule:', ruleId);

    await db.deleteFrom('bonus_rules')
      .where('id', '=', ruleId)
      .execute();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting bonus rule:', error);
    res.status(500).json({ error: 'Failed to delete bonus rule' });
  }
});

// Add player stats for round (admin only) - Updated to use new calculation function
app.post('/api/player-stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const stats = req.body;
    console.log('Adding player stats:', stats);
    
    // Get player position for bonus calculation
    const player = await db.selectFrom('players')
      .select(['position'])
      .where('id', '=', stats.player_id)
      .executeTakeFirst();
    
    // Calculate points with position-based bonuses, multipliers, and custom rules
    const points = await calculatePoints(stats, player?.position || '', stats.round_id, stats.player_id);
    
    // Insert stats
    const playerStats = await db.insertInto('player_stats')
      .values({
        ...stats,
        round_points: points
      })
      .returningAll()
      .executeTakeFirst();
    
    // Update player current round points (sum all stats for this round)
    const existingStats = await db.selectFrom('player_stats')
      .select(['round_points'])
      .where('player_id', '=', stats.player_id)
      .where('round_id', '=', stats.round_id)
      .execute();
    
    const roundPoints = existingStats.reduce((sum, stat) => sum + stat.round_points, 0);
    
    // Update player current price based on performance
    const currentPlayer = await db.selectFrom('players')
      .selectAll()
      .where('id', '=', stats.player_id)
      .executeTakeFirst();
    
    const totalAllTimePoints = currentPlayer.total_points + roundPoints;
    const newPrice = Math.max(50000, 100000 + (totalAllTimePoints * 1000));
    
    await db.updateTable('players')
      .set({
        current_round_points: roundPoints,
        current_price: newPrice
      })
      .where('id', '=', stats.player_id)
      .execute();

    // Update H2H matchup scores
    await updateH2HScores(stats.round_id);
    
    console.log('Added player stats and updated player:', playerStats);
    res.json(playerStats);
  } catch (error) {
    console.error('Error adding player stats:', error);
    res.status(500).json({ error: 'Failed to add player stats' });
  }
});

// Get player stats
app.get('/api/players/:id/stats', async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    console.log('Fetching stats for player:', playerId);
    
    const stats = await db.selectFrom('player_stats')
      .leftJoin('rounds', 'player_stats.round_id', 'rounds.id')
      .selectAll()
      .where('player_id', '=', playerId)
      .execute();
    
    console.log(`Found ${stats.length} stats for player ${playerId}`);
    res.json(stats);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Get user team
app.get('/api/my-team', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching team for user:', userId);
    
    const team = await db.selectFrom('user_teams')
      .leftJoin('players', 'user_teams.player_id', 'players.id')
      .selectAll()
      .where('user_id', '=', userId)
      .execute();
    
    console.log(`Found ${team.length} players in user ${userId} team`);
    res.json(team);
  } catch (error) {
    console.error('Error fetching user team:', error);
    res.status(500).json({ error: 'Failed to fetch user team' });
  }
});

// Buy player with position constraints and lockout check - Updated for 2 all-rounders
app.post('/api/buy-player', authenticateUser, checkLockout, async (req, res) => {
  try {
    const userId = req.user.id;
    const { playerId, isSubstitute } = req.body;
    console.log('User', userId, 'buying player', playerId, 'as substitute:', isSubstitute);
    
    // Check current team composition
    const currentTeam = await db.selectFrom('user_teams')
      .leftJoin('players', 'user_teams.player_id', 'players.id')
      .selectAll()
      .where('user_id', '=', userId)
      .execute();
    
    // Check if user already has 6 players total
    if (currentTeam.length >= 6) {
      res.status(400).json({ error: 'Team is full (maximum 6 players)' });
      return;
    }
    
    // Check if user already owns this player
    const existingOwnership = currentTeam.find(p => p.player_id === playerId);
    if (existingOwnership) {
      res.status(400).json({ error: 'You already own this player' });
      return;
    }
    
    // Get player info
    const player = await db.selectFrom('players')
      .selectAll()
      .where('id', '=', playerId)
      .executeTakeFirst();
    
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    
    if (req.user.budget < player.current_price) {
      res.status(400).json({ error: 'Insufficient budget' });
      return;
    }
    
    // Position constraints check for main team (not substitutes) - Updated for 2 all-rounders
    if (!isSubstitute) {
      const mainTeam = currentTeam.filter(p => !p.is_substitute);
      const positionCounts = {
        'Batsman': 0,
        'Bowler': 0,
        'All-rounder': 0,
        'Wicket-keeper': 0
      };
      
      mainTeam.forEach(p => {
        positionCounts[p.position]++;
      });
      
      // Check position limits for main team - Updated to require 2 all-rounders
      if (player.position === 'Batsman' && positionCounts['Batsman'] >= 2) {
        res.status(400).json({ error: 'Already have maximum batsmen (2)' });
        return;
      }
      if (player.position === 'Bowler' && positionCounts['Bowler'] >= 2) {
        res.status(400).json({ error: 'Already have maximum bowlers (2)' });
        return;
      }
      if (player.position === 'All-rounder' && positionCounts['All-rounder'] >= 2) {
        res.status(400).json({ error: 'Already have maximum all-rounders (2)' });
        return;
      }
      if (player.position === 'Wicket-keeper' && positionCounts['Wicket-keeper'] >= 1) {
        res.status(400).json({ error: 'Already have maximum wicket-keepers (1)' });
        return;
      }
    }
    
    // Add player to team
    await db.insertInto('user_teams')
      .values({
        user_id: userId,
        player_id: playerId,
        purchase_price: player.current_price,
        is_captain: 0,
        is_substitute: isSubstitute ? 1 : 0
      })
      .execute();
    
    // Update user budget
    await db.updateTable('users')
      .set({ budget: req.user.budget - player.current_price })
      .where('id', '=', userId)
      .execute();
    
    console.log('Player purchased successfully');
    res.json({ 
      success: true, 
      message: `Successfully purchased ${player.name} for $${player.current_price.toLocaleString()}!`,
      player: {
        name: player.name,
        price: player.current_price,
        isSubstitute: isSubstitute
      }
    });
  } catch (error) {
    console.error('Error buying player:', error);
    res.status(500).json({ error: 'Failed to buy player' });
  }
});

// Sell player with lockout check
app.post('/api/sell-player', authenticateUser, checkLockout, async (req, res) => {
  try {
    const userId = req.user.id;
    const { playerId } = req.body;
    console.log('User', userId, 'selling player', playerId);
    
    // Get current player price
    const player = await db.selectFrom('players')
      .selectAll()
      .where('id', '=', playerId)
      .executeTakeFirst();
    
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    
    // Check if user owns this player
    const ownership = await db.selectFrom('user_teams')
      .selectAll()
      .where('user_id', '=', userId)
      .where('player_id', '=', playerId)
      .executeTakeFirst();
    
    if (!ownership) {
      res.status(400).json({ error: 'You do not own this player' });
      return;
    }
    
    // Remove player from team
    await db.deleteFrom('user_teams')
      .where('user_id', '=', userId)
      .where('player_id', '=', playerId)
      .execute();
    
    // Update user budget (sell at current market price)
    await db.updateTable('users')
      .set({ budget: req.user.budget + player.current_price })
      .where('id', '=', userId)
      .execute();
    
    console.log('Player sold successfully');
    res.json({ 
      success: true,
      message: `Successfully sold ${player.name} for $${player.current_price.toLocaleString()}!`
    });
  } catch (error) {
    console.error('Error selling player:', error);
    res.status(500).json({ error: 'Failed to sell player' });
  }
});

// Set captain with lockout check
app.post('/api/set-captain', authenticateUser, checkLockout, async (req, res) => {
  try {
    const userId = req.user.id;
    const { playerId } = req.body;
    console.log('User', userId, 'setting captain to player', playerId);
    
    // Check if user owns this player and it's not a substitute
    const ownership = await db.selectFrom('user_teams')
      .selectAll()
      .where('user_id', '=', userId)
      .where('player_id', '=', playerId)
      .executeTakeFirst();
    
    if (!ownership) {
      res.status(400).json({ error: 'You do not own this player' });
      return;
    }
    
    if (ownership.is_substitute) {
      res.status(400).json({ error: 'Cannot make a substitute the captain' });
      return;
    }
    
    // Remove captain status from all players
    await db.updateTable('user_teams')
      .set({ is_captain: 0 })
      .where('user_id', '=', userId)
      .execute();
    
    // Set new captain
    await db.updateTable('user_teams')
      .set({ is_captain: 1 })
      .where('user_id', '=', userId)
      .where('player_id', '=', playerId)
      .execute();
    
    console.log('Captain set successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting captain:', error);
    res.status(500).json({ error: 'Failed to set captain' });
  }
});

// Substitute player with lockout check
app.post('/api/substitute-player', authenticateUser, checkLockout, async (req, res) => {
  try {
    const userId = req.user.id;
    const { mainPlayerId, substitutePlayerId } = req.body;
    console.log('User', userId, 'substituting player', mainPlayerId, 'with', substitutePlayerId);
    
    // Verify ownership and positions
    const mainPlayer = await db.selectFrom('user_teams')
      .leftJoin('players', 'user_teams.player_id', 'players.id')
      .selectAll()
      .where('user_teams.user_id', '=', userId)
      .where('user_teams.player_id', '=', mainPlayerId)
      .where('user_teams.is_substitute', '=', 0)
      .executeTakeFirst();
      
    const subPlayer = await db.selectFrom('user_teams')
      .leftJoin('players', 'user_teams.player_id', 'players.id')
      .selectAll()
      .where('user_teams.user_id', '=', userId)
      .where('user_teams.player_id', '=', substitutePlayerId)
      .where('user_teams.is_substitute', '=', 1)
      .executeTakeFirst();
    
    if (!mainPlayer || !subPlayer) {
      res.status(400).json({ error: 'Invalid player selection for substitution' });
      return;
    }
    
    if (mainPlayer.position !== subPlayer.position) {
      res.status(400).json({ error: 'Can only substitute players of the same position' });
      return;
    }
    
    // Swap their substitute status
    await db.updateTable('user_teams')
      .set({ is_substitute: 1, is_captain: 0 })
      .where('user_id', '=', userId)
      .where('player_id', '=', mainPlayerId)
      .execute();
      
    await db.updateTable('user_teams')
      .set({ is_substitute: 0 })
      .where('user_id', '=', userId)
      .where('player_id', '=', substitutePlayerId)
      .execute();
    
    console.log('Substitution successful');
    res.json({ success: true });
  } catch (error) {
    console.error('Error substituting player:', error);
    res.status(500).json({ error: 'Failed to substitute player' });
  }
});

// Get leaderboard (public) - Updated for 2 all-rounders
app.get('/api/leaderboard', async (req, res) => {
  try {
    console.log('Fetching leaderboard');
    
    const teams = await db.selectFrom('user_teams')
      .leftJoin('players', 'user_teams.player_id', 'players.id')
      .leftJoin('users', 'user_teams.user_id', 'users.id')
      .select([
        'users.id as user_id',
        'users.username',
        'players.total_points',
        'players.current_round_points',
        'user_teams.is_captain',
        'user_teams.is_substitute'
      ])
      .execute();
    
    // Calculate team totals (only main team players count, including current round)
    const teamTotals = teams.reduce((acc, team) => {
      if (!acc[team.user_id]) {
        acc[team.user_id] = {
          user_id: team.user_id,
          username: team.username,
          total_points: 0
        };
      }
      
      // Only count points from main team players (not substitutes)
      if (!team.is_substitute) {
        let points = (team.total_points || 0) + (team.current_round_points || 0);
        if (team.is_captain) {
          points *= 2; // Double points for captain
        }
        
        acc[team.user_id].total_points += points;
      }
      return acc;
    }, {});
    
    const leaderboard = Object.values(teamTotals)
      .sort((a: any, b: any) => b.total_points - a.total_points);
    
    console.log(`Generated leaderboard with ${leaderboard.length} teams`);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// H2H Matchup routes
app.get('/api/h2h-matchups', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching H2H matchups for user:', userId);
    
    const matchups = await db.selectFrom('h2h_matchups')
      .leftJoin('users as user1', 'h2h_matchups.user1_id', 'user1.id')
      .leftJoin('users as user2', 'h2h_matchups.user2_id', 'user2.id')
      .leftJoin('rounds', 'h2h_matchups.round_id', 'rounds.id')
      .leftJoin('users as winner', 'h2h_matchups.winner_id', 'winner.id')
      .select([
        'h2h_matchups.id',
        'h2h_matchups.name',
        'h2h_matchups.status',
        'h2h_matchups.user1_score',
        'h2h_matchups.user2_score',
        'h2h_matchups.created_at',
        'user1.username as user1_name',
        'user2.username as user2_name',
        'rounds.name as round_name',
        'winner.username as winner_name'
      ])
      .where((eb) => eb.or([
        eb('h2h_matchups.user1_id', '=', userId),
        eb('h2h_matchups.user2_id', '=', userId)
      ]))
      .execute();
    
    res.json(matchups);
  } catch (error) {
    console.error('Error fetching H2H matchups:', error);
    res.status(500).json({ error: 'Failed to fetch H2H matchups' });
  }
});

// Create H2H matchup - ADMIN ONLY
app.post('/api/h2h-matchups', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { name, user1Username, user2Username, roundId } = req.body;
    console.log('Admin creating H2H matchup:', { name, user1Username, user2Username, roundId });
    
    // Find both users
    const user1 = await db.selectFrom('users')
      .selectAll()
      .where('username', '=', user1Username)
      .executeTakeFirst();
      
    const user2 = await db.selectFrom('users')
      .selectAll()
      .where('username', '=', user2Username)
      .executeTakeFirst();
    
    if (!user1) {
      res.status(404).json({ error: 'User 1 not found' });
      return;
    }
    
    if (!user2) {
      res.status(404).json({ error: 'User 2 not found' });
      return;
    }
    
    if (user1.id === user2.id) {
      res.status(400).json({ error: 'Cannot create matchup between same user' });
      return;
    }
    
    // Check if round exists
    const round = await db.selectFrom('rounds')
      .selectAll()
      .where('id', '=', roundId)
      .executeTakeFirst();
    
    if (!round) {
      res.status(404).json({ error: 'Round not found' });
      return;
    }
    
    const matchup = await db.insertInto('h2h_matchups')
      .values({
        name,
        user1_id: user1.id,
        user2_id: user2.id,
        round_id: roundId,
        status: 'pending'
      })
      .returningAll()
      .executeTakeFirst();
    
    console.log('Created H2H matchup:', matchup);
    res.json(matchup);
  } catch (error) {
    console.error('Error creating H2H matchup:', error);
    res.status(500).json({ error: 'Failed to create H2H matchup' });
  }
});

// Function to update H2H scores when stats are added
async function updateH2HScores(roundId: number) {
  try {
    console.log('Updating H2H scores for round:', roundId);
    
    // Get all active matchups for this round
    const matchups = await db.selectFrom('h2h_matchups')
      .selectAll()
      .where('round_id', '=', roundId)
      .where('status', '=', 'pending')
      .execute();
    
    for (const matchup of matchups) {
      // Calculate scores for both users (only main team players, including current round)
      const user1Score = await calculateUserScoreForRound(matchup.user1_id, roundId);
      const user2Score = await calculateUserScoreForRound(matchup.user2_id, roundId);
      
      let winner_id = null;
      let status = 'pending';
      
      // Check if round has stats (meaning it's completed)
      const hasStats = await db.selectFrom('player_stats')
        .selectAll()
        .where('round_id', '=', roundId)
        .executeTakeFirst();
      
      if (hasStats) {
        status = 'completed';
        if (user1Score > user2Score) {
          winner_id = matchup.user1_id;
        } else if (user2Score > user1Score) {
          winner_id = matchup.user2_id;
        }
      }
      
      // Update matchup
      await db.updateTable('h2h_matchups')
        .set({
          user1_score: user1Score,
          user2_score: user2Score,
          winner_id,
          status
        })
        .where('id', '=', matchup.id)
        .execute();
    }
  } catch (error) {
    console.error('Error updating H2H scores:', error);
  }
}

async function calculateUserScoreForRound(userId: number, roundId: number): Promise<number> {
  try {
    const userTeam = await db.selectFrom('user_teams')
      .leftJoin('player_stats', (join) => join
        .onRef('user_teams.player_id', '=', 'player_stats.player_id')
        .on('player_stats.round_id', '=', roundId)
      )
      .select([
        'user_teams.is_captain',
        'user_teams.is_substitute',
        'player_stats.round_points'
      ])
      .where('user_teams.user_id', '=', userId)
      .execute();
    
    return userTeam.reduce((total, player) => {
      // Only count points from main team players (not substitutes)
      if (player.is_substitute) return total;
      
      let points = player.round_points || 0;
      if (player.is_captain) {
        points *= 2; // Double points for captain
      }
      return total + points;
    }, 0);
  } catch (error) {
    console.error('Error calculating user score:', error);
    return 0;
  }
}

// Get all users and teams (admin only) with search
app.get('/api/admin/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { search } = req.query;
    console.log('Admin fetching all users and teams with search:', search);
    
    // Get all users with their team info
    let userQuery = db.selectFrom('users')
      .leftJoin('user_teams', 'users.id', 'user_teams.user_id')
      .leftJoin('players', 'user_teams.player_id', 'players.id')
      .select([
        'users.id',
        'users.username',
        'users.email',
        'users.budget',
        'users.is_admin',
        'users.created_at',
        'players.name as player_name',
        'players.position as player_position',
        'players.total_points as player_total_points',
        'players.current_round_points as player_current_points',
        'user_teams.is_captain',
        'user_teams.is_substitute',
        'user_teams.purchase_price',
        'user_teams.player_id'
      ]);
    
    if (search && typeof search === 'string') {
      userQuery = userQuery.where((eb) => eb.or([
        eb('users.username', 'like', `%${search}%`),
        eb('users.email', 'like', `%${search}%`)
      ]));
    }
    
    const usersWithTeams = await userQuery.execute();
    
    // Group by user
    const usersMap = new Map();
    
    usersWithTeams.forEach(row => {
      if (!usersMap.has(row.id)) {
        usersMap.set(row.id, {
          id: row.id,
          username: row.username,
          email: row.email,
          budget: row.budget,
          is_admin: row.is_admin,
          created_at: row.created_at,
          team: []
        });
      }
      
      if (row.player_name) {
        usersMap.get(row.id).team.push({
          player_id: row.player_id,
          name: row.player_name,
          position: row.player_position,
          total_points: row.player_total_points,
          current_points: row.player_current_points,
          is_captain: row.is_captain,
          is_substitute: row.is_substitute,
          purchase_price: row.purchase_price
        });
      }
    });
    
    const users = Array.from(usersMap.values());
    
    console.log(`Found ${users.length} users`);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get all H2H matchups (admin only)
app.get('/api/admin/h2h-matchups', authenticateUser, requireAdmin, async (req, res) => {
  try {
    console.log('Admin fetching all H2H matchups');
    
    const matchups = await db.selectFrom('h2h_matchups')
      .leftJoin('users as user1', 'h2h_matchups.user1_id', 'user1.id')
      .leftJoin('users as user2', 'h2h_matchups.user2_id', 'user2.id')
      .leftJoin('rounds', 'h2h_matchups.round_id', 'rounds.id')
      .leftJoin('users as winner', 'h2h_matchups.winner_id', 'winner.id')
      .select([
        'h2h_matchups.id',
        'h2h_matchups.name',
        'h2h_matchups.status',
        'h2h_matchups.user1_score',
        'h2h_matchups.user2_score',
        'h2h_matchups.created_at',
        'user1.username as user1_name',
        'user2.username as user2_name',
        'rounds.name as round_name',
        'winner.username as winner_name'
      ])
      .execute();
    
    res.json(matchups);
  } catch (error) {
    console.error('Error fetching H2H matchups:', error);
    res.status(500).json({ error: 'Failed to fetch H2H matchups' });
  }
});

// Get simple list of users for dropdowns (admin only)
app.get('/api/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const users = await db.selectFrom('users')
      .select(['id', 'username', 'email', 'is_admin'])
      .execute();
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export async function startServer(port) {
  try {
    if (process.env.NODE_ENV === 'production') {
      setupStaticServing(app);
    }
    app.listen(port, () => {
      console.log(`API Server running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Starting server...');
  startServer(process.env.PORT || 3001);
}
