import express from 'express';
import dotenv from 'dotenv';
import { setupStaticServing } from './static-serve.js';
import { db } from './database.js';

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

// Get all players
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
app.post('/api/players', async (req, res) => {
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

// Get all matches
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
app.post('/api/matches', async (req, res) => {
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
app.post('/api/player-stats', async (req, res) => {
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
app.get('/api/user/:userId/team', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
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
app.post('/api/user/:userId/buy-player', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
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
    
    // Get player and user info
    const player = await db.selectFrom('players')
      .selectAll()
      .where('id', '=', playerId)
      .executeTakeFirst();
    
    const user = await db.selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();
    
    if (!player || !user) {
      res.status(404).json({ error: 'Player or user not found' });
      return;
    }
    
    if (user.budget < player.current_price) {
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
      .set({ budget: user.budget - player.current_price })
      .where('id', '=', userId)
      .execute();
    
    console.log('Player purchased successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error buying player:', error);
    res.status(500).json({ error: 'Failed to buy player' });
  }
});

// Sell player
app.post('/api/user/:userId/sell-player', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { playerId } = req.body;
    console.log('User', userId, 'selling player', playerId);
    
    // Get current player price
    const player = await db.selectFrom('players')
      .selectAll()
      .where('id', '=', playerId)
      .executeTakeFirst();
    
    const user = await db.selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();
    
    if (!player || !user) {
      res.status(404).json({ error: 'Player or user not found' });
      return;
    }
    
    // Remove player from team
    await db.deleteFrom('user_teams')
      .where('user_id', '=', userId)
      .where('player_id', '=', playerId)
      .execute();
    
    // Update user budget (sell at current market price)
    await db.updateTable('users')
      .set({ budget: user.budget + player.current_price })
      .where('id', '=', userId)
      .execute();
    
    console.log('Player sold successfully');
    res.json({ success: true });
  } catch (error) {
    console.error('Error selling player:', error);
    res.status(500).json({ error: 'Failed to sell player' });
  }
});

// Set captain
app.post('/api/user/:userId/set-captain', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const { playerId } = req.body;
    console.log('User', userId, 'setting captain to player', playerId);
    
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

// Get leaderboard
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

// Get user info
app.get('/api/user/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    console.log('Fetching user info:', userId);
    
    const user = await db.selectFrom('users')
      .selectAll()
      .where('id', '=', userId)
      .executeTakeFirst();
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    console.log('Found user:', user);
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
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
