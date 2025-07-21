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

// Calculate points based on stats
function calculatePoints(stats: any): number {
  let points = 0;
  
  // Batting points
  points += stats.runs * 1; // 1 point per run
  points += stats.fours * 1; // 1 extra point per four
  points += stats.sixes * 2; // 2 extra points per six
  
  // Bowling points
  points += stats.wickets * 25; // 25 points per wicket
  points -= Math.floor(stats.runs_conceded / 2); // -0.5 points per run conceded
  
  // Fielding points
  points += stats.catches * 8; // 8 points per catch
  points += stats.stumpings * 12; // 12 points per stumping
  points += stats.run_outs * 6; // 6 points per run out
  
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

// Get all players (public)
app.get('/api/players', async (req, res) => {
  try {
    console.log('Fetching all players');
    const players = await db.selectFrom('players').selectAll().execute();
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
    const { name, team, position, base_price } = req.body;
    console.log('Creating player:', { name, team, position, base_price });
    
    const player = await db.insertInto('players')
      .values({
        name,
        team,
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

// Get all matches (public)
app.get('/api/matches', async (req, res) => {
  try {
    console.log('Fetching all matches');
    const matches = await db.selectFrom('matches').selectAll().execute();
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

// Add player stats (admin only)
app.post('/api/player-stats', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const stats = req.body;
    console.log('Adding player stats:', stats);
    
    // Calculate points
    const points = calculatePoints(stats);
    
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

// Buy player
app.post('/api/buy-player', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { playerId } = req.body;
    console.log('User', userId, 'buying player', playerId);
    
    // Check if user already has 5 players
    const currentTeam = await db.selectFrom('user_teams')
      .selectAll()
      .where('user_id', '=', userId)
      .execute();
    
    if (currentTeam.length >= 5) {
      res.status(400).json({ error: 'Team is full (maximum 5 players)' });
      return;
    }
    
    // Check if user already owns this player
    const existingOwnership = await db.selectFrom('user_teams')
      .selectAll()
      .where('user_id', '=', userId)
      .where('player_id', '=', playerId)
      .executeTakeFirst();
    
    if (existingOwnership) {
      res.status(400).json({ error: 'You already own this player' });
      return;
    }
    
    // Get player and user info
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
    
    // Add player to team
    await db.insertInto('user_teams')
      .values({
        user_id: userId,
        player_id: playerId,
        purchase_price: player.current_price,
        is_captain: 0
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
        price: player.current_price
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
        'user_teams.is_captain'
      ])
      .execute();
    
    // Calculate team totals
    const teamTotals = teams.reduce((acc, team) => {
      if (!acc[team.user_id]) {
        acc[team.user_id] = {
          user_id: team.user_id,
          username: team.username,
          total_points: 0
        };
      }
      
      let points = team.total_points || 0;
      if (team.is_captain) {
        points *= 2; // Double points for captain
      }
      
      acc[team.user_id].total_points += points;
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
      // Calculate scores for both users
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
        'player_stats.points'
      ])
      .where('user_teams.user_id', '=', userId)
      .execute();
    
    return userTeam.reduce((total, player) => {
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

// Get all users and teams (admin only)
app.get('/api/admin/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    console.log('Admin fetching all users and teams');
    
    // Get all users with their team info
    const usersWithTeams = await db.selectFrom('users')
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
        'user_teams.purchase_price'
      ])
      .execute();
    
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
