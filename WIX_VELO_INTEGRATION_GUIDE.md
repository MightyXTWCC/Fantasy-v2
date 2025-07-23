# Fantasy Cricket - Wix Velo Integration Guide

## Overview
This guide shows how to integrate your Fantasy Cricket system with Wix using Velo (Wix's development platform). You have two main approaches:

1. **Hybrid Approach**: Keep your backend API, recreate frontend in Wix
2. **Full Velo Rebuild**: Recreate everything using Wix's database and backend

## Option 1: Hybrid Approach (Recommended)

### Step 1: Deploy Your Backend API
First, deploy your existing backend to a hosting platform:

**Deploy to Railway:**
1. Go to Railway.app
2. Connect your GitHub repository
3. Set environment variables:
   ```
   NODE_ENV=production
   JWT_SECRET=your-secure-secret
   DATA_DIRECTORY=/app/data
   ```
4. Deploy and get your API URL (e.g., `https://your-app.railway.app`)

### Step 2: Create Wix Pages and Collections

**Create Wix Database Collections:**
```javascript
// In Wix Editor, go to Database → Create Collection
// Create these collections:

// Collection: Users
{
  _id: "text",
  username: "text",
  email: "text", 
  wixUserId: "text", // Link to Wix Members
  budget: "number",
  isAdmin: "boolean"
}

// Collection: UserTeams  
{
  _id: "text",
  userId: "text",
  playerId: "text", 
  purchasePrice: "number",
  isCaptain: "boolean",
  isSubstitute: "boolean"
}
```

### Step 3: Wix Frontend Pages

**Create these pages in Wix:**
- `/players` - Player marketplace
- `/my-team` - User's team management
- `/leaderboard` - Rankings
- `/admin` - Admin panel (for admins only)

### Step 4: Velo Backend Code

**File: backend/http-functions.js**
```javascript
import { fetch } from 'wix-fetch';

const API_BASE = 'https://your-app.railway.app/api';

// Get user's JWT token from your API
export async function post_login(request) {
  const { username, password } = await request.body.json();
  
  try {
    const response = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Store JWT token in Wix storage
      return {
        status: 200,
        body: data
      };
    } else {
      return {
        status: response.status,
        body: data
      };
    }
  } catch (error) {
    return {
      status: 500,
      body: { error: 'Login failed' }
    };
  }
}

// Fetch players from your API
export async function get_players(request) {
  const { search } = request.query;
  
  try {
    const url = search ? `${API_BASE}/players?search=${search}` : `${API_BASE}/players`;
    const response = await fetch(url);
    const players = await response.json();
    
    return {
      status: 200,
      body: players
    };
  } catch (error) {
    return {
      status: 500,
      body: { error: 'Failed to fetch players' }
    };
  }
}

// Buy player (requires authentication)
export async function post_buyPlayer(request) {
  const { playerId, isSubstitute, token } = await request.body.json();
  
  try {
    const response = await fetch(`${API_BASE}/buy-player`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ playerId, isSubstitute })
    });
    
    const data = await response.json();
    
    return {
      status: response.status,
      body: data
    };
  } catch (error) {
    return {
      status: 500,
      body: { error: 'Failed to buy player' }
    };
  }
}

// Get user's team
export async function post_myTeam(request) {
  const { token } = await request.body.json();
  
  try {
    const response = await fetch(`${API_BASE}/my-team`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    const team = await response.json();
    
    return {
      status: response.status,
      body: team
    };
  } catch (error) {
    return {
      status: 500,
      body: { error: 'Failed to fetch team' }
    };
  }
}

// Admin: Add player stats
export async function post_addStats(request) {
  const { stats, token } = await request.body.json();
  
  try {
    const response = await fetch(`${API_BASE}/player-stats`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(stats)
    });
    
    const data = await response.json();
    
    return {
      status: response.status,
      body: data
    };
  } catch (error) {
    return {
      status: 500,
      body: { error: 'Failed to add stats' }
    };
  }
}
```

### Step 5: Wix Frontend Code

**Players Page (players.js):**
```javascript
import wixWindow from 'wix-window';
import { session } from 'wix-storage';
import { fetch } from 'wix-fetch';

$w.onReady(function () {
  loadPlayers();
  
  // Search functionality
  $w('#searchInput').onInput(() => {
    const searchTerm = $w('#searchInput').value;
    loadPlayers(searchTerm);
  });
});

async function loadPlayers(search = '') {
  try {
    $w('#loadingText').show();
    
    const url = search ? 
      `/_functions/players?search=${encodeURIComponent(search)}` : 
      '/_functions/players';
      
    const response = await fetch(url);
    const players = await response.json();
    
    $w('#loadingText').hide();
    
    // Populate repeater with players
    $w('#playersRepeater').data = players.map(player => ({
      _id: player.id.toString(),
      name: player.name,
      position: player.position,
      price: `$${player.current_price.toLocaleString()}`,
      points: `${player.current_round_points} (${player.total_points})`,
      player: player
    }));
    
    $w('#playersRepeater').show();
  } catch (error) {
    console.error('Error loading players:', error);
    $w('#loadingText').text = 'Error loading players';
  }
}

// Handle buy player button clicks
$w('#playersRepeater').onItemReady(($item, itemData) => {
  $item('#buyMainButton').onClick(async () => {
    await buyPlayer(itemData.player.id, false);
  });
  
  $item('#buySubButton').onClick(async () => {
    await buyPlayer(itemData.player.id, true);
  });
});

async function buyPlayer(playerId, isSubstitute) {
  const token = session.getItem('authToken');
  
  if (!token) {
    wixWindow.openLightbox('LoginLightbox');
    return;
  }
  
  try {
    const response = await fetch('/_functions/buyPlayer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerId, isSubstitute, token })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Show success message
      $w('#messageBar').text = result.message;
      $w('#messageBar').show();
      
      // Reload players to update prices/availability
      loadPlayers();
    } else {
      // Show error message
      $w('#errorBar').text = result.error;
      $w('#errorBar').show();
    }
  } catch (error) {
    console.error('Error buying player:', error);
    $w('#errorBar').text = 'Failed to buy player';
    $w('#errorBar').show();
  }
}
```

**My Team Page (my-team.js):**
```javascript
import { session } from 'wix-storage';
import { fetch } from 'wix-fetch';

$w.onReady(function () {
  loadMyTeam();
});

async function loadMyTeam() {
  const token = session.getItem('authToken');
  
  if (!token) {
    $w('#loginMessage').show();
    return;
  }
  
  try {
    $w('#loadingText').show();
    
    const response = await fetch('/_functions/myTeam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    
    const team = await response.json();
    
    $w('#loadingText').hide();
    
    if (response.ok) {
      displayTeam(team);
    } else {
      $w('#errorText').text = team.error;
      $w('#errorText').show();
    }
  } catch (error) {
    console.error('Error loading team:', error);
    $w('#loadingText').hide();
    $w('#errorText').text = 'Failed to load team';
    $w('#errorText').show();
  }
}

function displayTeam(team) {
  // Separate main team and substitutes
  const mainTeam = team.filter(player => !player.is_substitute);
  const substitutes = team.filter(player => player.is_substitute);
  
  // Group by position
  const positions = {
    'Wicket-keeper': mainTeam.filter(p => p.position === 'Wicket-keeper'),
    'Batsman': mainTeam.filter(p => p.position === 'Batsman'),
    'All-rounder': mainTeam.filter(p => p.position === 'All-rounder'),
    'Bowler': mainTeam.filter(p => p.position === 'Bowler')
  };
  
  // Display each position section
  Object.entries(positions).forEach(([position, players]) => {
    const repeaterElement = $w(`#${position.toLowerCase().replace('-', '')}Repeater`);
    
    repeaterElement.data = players.map(player => ({
      _id: player.player_id.toString(),
      name: player.name,
      points: player.is_captain ? 
        `${player.current_round_points} (x2) - (${player.total_points})` :
        `${player.current_round_points} - (${player.total_points})`,
      isCaptain: player.is_captain,
      player: player
    }));
  });
  
  // Show substitute bench if any
  if (substitutes.length > 0) {
    $w('#substitutesRepeater').data = substitutes.map(player => ({
      _id: player.player_id.toString(),
      name: player.name,
      position: player.position,
      points: `${player.current_round_points} - (${player.total_points})`,
      player: player
    }));
    $w('#substitutesSection').show();
  }
  
  // Calculate and display totals
  const totalPoints = mainTeam.reduce((sum, player) => {
    let points = (player.total_points || 0) + (player.current_round_points || 0);
    if (player.is_captain) points *= 2;
    return sum + points;
  }, 0);
  
  $w('#totalPointsText').text = totalPoints.toString();
  $w('#teamSizeText').text = `${team.length}/6`;
}
```

**Authentication Integration:**
```javascript
// File: login.js
import wixUsers from 'wix-users';
import { session } from 'wix-storage';
import { fetch } from 'wix-fetch';

$w.onReady(function () {
  // Check if user is already logged in to Wix
  if (wixUsers.currentUser.loggedIn) {
    // Try to get or create fantasy cricket account
    handleWixUserLogin();
  }
});

async function handleWixUserLogin() {
  const wixUser = wixUsers.currentUser;
  
  // Try to login with Wix user details or create account
  try {
    const response = await fetch('/_functions/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: wixUser.id, // Use Wix user ID as username
        password: wixUser.id   // Or implement proper password handling
      })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      // Store auth token
      session.setItem('authToken', result.token);
      session.setItem('userData', JSON.stringify(result.user));
      
      // Redirect to main app
      wixLocation.to('/players');
    } else {
      // User doesn't exist, might need to register
      $w('#loginForm').show();
    }
  } catch (error) {
    console.error('Auto-login failed:', error);
    $w('#loginForm').show();
  }
}

// Manual login form
$w('#loginButton').onClick(async () => {
  const username = $w('#usernameInput').value;
  const password = $w('#passwordInput').value;
  
  try {
    const response = await fetch('/_functions/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const result = await response.json();
    
    if (response.ok) {
      session.setItem('authToken', result.token);
      session.setItem('userData', JSON.stringify(result.user));
      wixLocation.to('/players');
    } else {
      $w('#errorText').text = result.error;
      $w('#errorText').show();
    }
  } catch (error) {
    $w('#errorText').text = 'Login failed';
    $w('#errorText').show();
  }
});
```

## Option 2: Full Velo Rebuild

If you want to recreate everything in Wix using only Velo:

### Database Collections

Create these collections in Wix Database:

```javascript
// Collection: Players
{
  _id: "text",
  name: "text",
  position: "text",
  basePrice: "number",
  currentPrice: "number", 
  totalPoints: "number",
  currentRoundPoints: "number",
  matchesPlayed: "number"
}

// Collection: Rounds
{
  _id: "text",
  name: "text",
  roundNumber: "number",
  lockoutTime: "date",
  isLocked: "boolean",
  isActive: "boolean"
}

// Collection: PlayerStats
{
  _id: "text",
  playerId: "text",
  roundId: "text", 
  runs: "number",
  ballsFaced: "number",
  fours: "number",
  sixes: "number",
  wickets: "number",
  oversBowled: "number",
  runsConceded: "number",
  catches: "number",
  stumpings: "number",
  runOuts: "number",
  roundPoints: "number"
}

// Collection: UserTeams
{
  _id: "text",
  userId: "text",
  playerId: "text",
  purchasePrice: "number",
  isCaptain: "boolean",
  isSubstitute: "boolean"
}

// Collection: H2HMatchups
{
  _id: "text",
  name: "text",
  user1Id: "text",
  user2Id: "text", 
  roundId: "text",
  status: "text",
  user1Score: "number",
  user2Score: "number",
  winnerId: "text"
}
```

### Backend Functions (Velo)

**File: backend/data.jsw**
```javascript
import wixData from 'wix-data';
import wixUsers from 'wix-users';

// Get all players
export async function getPlayers(search = '') {
  let query = wixData.query('Players');
  
  if (search) {
    query = query.contains('name', search);
  }
  
  const results = await query.find();
  return results.items;
}

// Buy player
export async function buyPlayer(playerId, isSubstitute = false) {
  const userId = wixUsers.currentUser.id;
  
  if (!userId) {
    throw new Error('User not logged in');
  }
  
  // Check if user already owns this player
  const existingOwnership = await wixData.query('UserTeams')
    .eq('userId', userId)
    .eq('playerId', playerId)
    .find();
    
  if (existingOwnership.items.length > 0) {
    throw new Error('You already own this player');
  }
  
  // Get player details
  const player = await wixData.get('Players', playerId);
  
  // Get user's current team size
  const currentTeam = await wixData.query('UserTeams')
    .eq('userId', userId)
    .find();
    
  if (currentTeam.items.length >= 6) {
    throw new Error('Team is full (maximum 6 players)');
  }
  
  // Check position constraints for main team
  if (!isSubstitute) {
    const mainTeam = currentTeam.items.filter(p => !p.isSubstitute);
    const positionCounts = {};
    
    mainTeam.forEach(p => {
      const playerData = p.player || {};
      const position = playerData.position || '';
      positionCounts[position] = (positionCounts[position] || 0) + 1;
    });
    
    // Position limits
    const limits = {
      'Batsman': 2,
      'Bowler': 2, 
      'All-rounder': 1,
      'Wicket-keeper': 1
    };
    
    if (positionCounts[player.position] >= limits[player.position]) {
      throw new Error(`Already have maximum ${player.position.toLowerCase()}s`);
    }
  }
  
  // Add player to team
  const teamEntry = {
    userId: userId,
    playerId: playerId,
    purchasePrice: player.currentPrice,
    isCaptain: false,
    isSubstitute: isSubstitute
  };
  
  await wixData.insert('UserTeams', teamEntry);
  
  return { success: true, message: `Successfully purchased ${player.name}!` };
}

// Get user's team
export async function getMyTeam() {
  const userId = wixUsers.currentUser.id;
  
  if (!userId) {
    throw new Error('User not logged in');
  }
  
  const results = await wixData.query('UserTeams')
    .eq('userId', userId)
    .include('playerId')
    .find();
    
  return results.items;
}

// Calculate fantasy points
export function calculateFantasyPoints(stats, playerPosition) {
  let points = 0;
  
  // Batting points
  points += stats.runs * 1;
  points += stats.fours * 1;
  points += stats.sixes * 2;
  
  // Bowling points
  points += stats.wickets * 25;
  points -= Math.floor(stats.runsConceded / 2);
  
  // Fielding points with position bonus
  let fieldingMultiplier = playerPosition === 'Wicket-keeper' ? 1.5 : 1;
  
  points += Math.floor(stats.catches * 8 * fieldingMultiplier);
  points += Math.floor(stats.stumpings * 12 * fieldingMultiplier); 
  points += Math.floor(stats.runOuts * 6 * fieldingMultiplier);
  
  // Bonus points
  if (stats.runs >= 50) points += 8;
  if (stats.runs >= 100) points += 16;
  if (stats.wickets >= 3) points += 4;
  if (stats.wickets >= 5) points += 8;
  
  return Math.max(0, points);
}

// Admin: Add player stats
export async function addPlayerStats(statsData) {
  const userId = wixUsers.currentUser.id;
  
  // Check if user is admin (you'd need to store this in user profile)
  const userProfile = await wixData.get('Members/PrivateMembersData', userId);
  if (!userProfile.isAdmin) {
    throw new Error('Admin access required');
  }
  
  // Get player for position bonus calculation
  const player = await wixData.get('Players', statsData.playerId);
  
  // Calculate points
  const points = calculateFantasyPoints(statsData, player.position);
  
  // Insert stats
  const statEntry = {
    ...statsData,
    roundPoints: points
  };
  
  await wixData.insert('PlayerStats', statEntry);
  
  // Update player's current round points
  const existingStats = await wixData.query('PlayerStats')
    .eq('playerId', statsData.playerId)
    .eq('roundId', statsData.roundId)
    .find();
    
  const totalRoundPoints = existingStats.items.reduce((sum, stat) => 
    sum + stat.roundPoints, 0);
  
  await wixData.update('Players', {
    _id: statsData.playerId,
    currentRoundPoints: total