import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlayersPage } from '@/pages/PlayersPage';
import { MatchesPage } from '@/pages/MatchesPage';
import { MyTeamPage } from '@/pages/MyTeamPage';
import { AdminPage } from '@/pages/AdminPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Fantasy Cricket</h1>
              <div className="flex space-x-4">
                <Link to="/">
                  <Button variant="ghost">Players</Button>
                </Link>
                <Link to="/matches">
                  <Button variant="ghost">Matches</Button>
                </Link>
                <Link to="/my-team">
                  <Button variant="ghost">My Team</Button>
                </Link>
                <Link to="/leaderboard">
                  <Button variant="ghost">Leaderboard</Button>
                </Link>
                <Link to="/admin">
                  <Button variant="ghost">Admin</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<PlayersPage />} />
            <Route path="/matches" element={<MatchesPage />} />
            <Route path="/my-team" element={<MyTeamPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
