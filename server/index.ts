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

// Calculate points based on stats with position-based bonuses
function calculatePoints(stats: any, playerPosition: string): number {
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
  
  // Bonus points
  if (stats.runs >= 50) points += 8; // Half century bonus
  if (stats.runs >= 100) points += 16; // Century bonus
  if (stats.wickets >= 3) points += 4; // 3 wicket bonus
  if (stats.wickets >= 5) points += 8; // 5 wicket bonus
  
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

// Get all players (public) with search
app.get('/api/players', async (req, res) => {
  try {
    const { search } = req.query;
    console.log('Fetching players with search:', search);
    
    let query = db.selectFrom('players').selectAll();
    
    if (search && typeof search === 'string') {
      query = query.where('name', 'like', `%${search}%`);
    }
    
    const players = await query.execute();
    console.log(`Found ${players.length} players`);
    res.json(players);
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

// Get all matches (public) with search
app.get('/api/matches', async (req, res) => {
  try {
    const { search } = req.query;
    console.log('Fetching matches with search:', search);
    
    let query = db.selectFrom('matches').selectAll();
    
    if (search && typeof search === 'string') {
      query = query.where((eb) => eb.or([
        eb('match_name', 'like', `%${search}%`),
        eb('team1', 'like', `%${search}%`),
        eb('team2', 'like', `%${search}%`)
      ]));
    }
    
    const matches = await query.execute();
    console.log(`Found ${matches.length} matches`);
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Create a new match (admin only)
app.post('/api/matches', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { match_name, date, team1, team2 } = req.body;
    console.log('Creating match:', { match_name, date, team1, team2 });
    
    const match = await db.insertInto('matches')
      .values({
        match_name,
        date,
        team1,
        team2
      })
      .returningAll()
      .executeTakeFirst();
    
    console.log('Created match:', match);
    res.json(match);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// Delete match (admin only)
app.delete('/api/matches/:id', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const matchId = parseInt(req.params.id);
    console.log('Admin deleting match:', matchId);

    // Check if match has stats
    const matchHasStats = await db.selectFrom('player_stats')
      .selectAll()
      .where('match_id', '=', matchId)
      .executeTakeFirst();

    if (matchHasStats) {
      res.status(400).json({ error: 'Cannot delete match that has player stats' });
      return;
    }

    // Check if match has H2H matchups
    const matchHasH2H = await db.selectFrom('h2h_matchups')
      .selectAll()
      .where('match_id', '=', matchId)
      .executeTakeFirst();

    if (matchHasH2H) {
      res.status(400).json({ error: 'Cannot delete match that has H2H matchups' });
      return;
    }

    // Delete match
    await db.deleteFrom('matches')
      .where('id', '=', matchId)
      .execute();

    console.log('Match deleted successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// Add player stats (admin only)
app.post('/api/player-stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const stats = req.body;
    console.log('Adding player stats:', stats);
    
    // Get player position for bonus calculation
    const player = await db.selectFrom('players')
      .select(['position'])
      .where('id', '=', stats.player_id)
      .executeTakeFirst();
    
    // Calculate points with position-based bonuses
    const points = calculatePoints(stats, player?.position || '');
    
    // Insert stats
    const playerStats = await db.insertInto('player_stats')
      .values({
        ...stats,
        points
      })
      .returningAll()
      .executeTakeFirst();
    
    // Update player totals
    const existingStats = await db.selectFrom('player_stats')
      .select(['points'])
      .where('player_id', '=', stats.player_id)
      .execute();
    
    const totalPoints = existingStats.reduce((sum, stat) => sum + stat.points, 0);
    const matchesPlayed = existingStats.length;
    
    // Update player current price based on performance
    const newPrice = Math.max(50000, 100000 + (totalPoints * 1000));
    
    await db.updateTable('players')
      .set({
        total_points: totalPoints,
        matches_played: matchesPlayed,
        current_price: newPrice
      })
      .where('id', '=', stats.player_id)
      .execute();

    // Update H2H matchup scores
    await updateH2HScores(stats.match_id);
    
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
      .leftJoin('matches', 'player_stats.match_id', 'matches.id')
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

// Buy player with position constraints
app.post('/api/buy-player', authenticateUser, async (req, res) => {
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
    
    // Position constraints check for main team (not substitutes)
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
      
      // Check position limits for main team
      if (player.position === 'Batsman' && positionCounts['Batsman'] >= 2) {
        res.status(400).json({ error: 'Already have maximum batsmen (2)' });
        return;
      }
      if (player.position === 'Bowler' && positionCounts['Bowler'] >= 2) {
        res.status(400).json({ error: 'Already have maximum bowlers (2)' });
        return;
      }
      if (player.position === 'All-rounder' && positionCounts['All-rounder'] >= 1) {
        res.status(400).json({ error: 'Already have maximum all-rounders (1)' });
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

// Sell player
app.post('/api/sell-player', authenticateUser, async (req, res) => {
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

// Set captain
app.post('/api/set-captain', authenticateUser, async (req, res) => {
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

// Substitute player (swap main player with substitute)
app.post('/api/substitute-player', authenticateUser, async (req, res) => {
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

// Get leaderboard (public)
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
        'user_teams.is_captain',
        'user_teams.is_substitute'
      ])
      .execute();
    
    // Calculate team totals (only main team players count)
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
        let points = team.total_points || 0;
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

// H2H Matchup routes - ADMIN ONLY
app.get('/api/h2h-matchups', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching H2H matchups for user:', userId);
    
    const matchups = await db.selectFrom('h2h_matchups')
      .leftJoin('users as user1', 'h2h_matchups.user1_id', 'user1.id')
      .leftJoin('users as user2', 'h2h_matchups.user2_id', 'user2.id')
      .leftJoin('matches', 'h2h_matchups.match_id', 'matches.id')
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
        'matches.match_name',
        'matches.date as match_date',
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
    const { name, user1Username, user2Username, matchId } = req.body;
    console.log('Admin creating H2H matchup:', { name, user1Username, user2Username, matchId });
    
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
    
    // Check if match exists
    const match = await db.selectFrom('matches')
      .selectAll()
      .where('id', '=', matchId)
      .executeTakeFirst();
    
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    
    const matchup = await db.insertInto('h2h_matchups')
      .values({
        name,
        user1_id: user1.id,
        user2_id: user2.id,
        match_id: matchId,
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
async function updateH2HScores(matchId: number) {
  try {
    console.log('Updating H2H scores for match:', matchId);
    
    // Get all active matchups for this match
    const matchups = await db.selectFrom('h2h_matchups')
      .selectAll()
      .where('match_id', '=', matchId)
      .where('status', '=', 'pending')
      .execute();
    
    for (const matchup of matchups) {
      // Calculate scores for both users (only main team players)
      const user1Score = await calculateUserScoreForMatch(matchup.user1_id, matchId);
      const user2Score = await calculateUserScoreForMatch(matchup.user2_id, matchId);
      
      let winner_id = null;
      let status = 'pending';
      
      // Check if match has stats (meaning it's completed)
      const hasStats = await db.selectFrom('player_stats')
        .selectAll()
        .where('match_id', '=', matchId)
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

async function calculateUserScoreForMatch(userId: number, matchId: number): Promise<number> {
  try {
    const userTeam = await db.selectFrom('user_teams')
      .leftJoin('player_stats', (join) => join
        .onRef('user_teams.player_id', '=', 'player_stats.player_id')
        .on('player_stats.match_id', '=', matchId)
      )
      .select([
        'user_teams.is_captain',
        'user_teams.is_substitute',
        'player_stats.points'
      ])
      .where('user_teams.user_id', '=', userId)
      .execute();
    
    return userTeam.reduce((total, player) => {
      // Only count points from main team players (not substitutes)
      if (player.is_substitute) return total;
      
      let points = player.points || 0;
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
        'players.total_points as player_points',
        'user_teams.is_captain',
        'user_teams.is_substitute',
        'user_teams.purchase_price'
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
          name: row.player_name,
          position: row.player_position,
          points: row.player_points,
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
      .leftJoin('matches', 'h2h_matchups.match_id', 'matches.id')
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
        'matches.match_name',
        'matches.date as match_date',
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
