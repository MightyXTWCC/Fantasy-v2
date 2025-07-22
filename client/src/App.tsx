import * as React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { AuthPage } from '@/components/auth/AuthPage';
import { PlayersPage } from '@/pages/PlayersPage';
import { RoundsPage } from '@/pages/RoundsPage';
import { MyTeamPage } from '@/pages/MyTeamPage';
import { AdminPage } from '@/pages/AdminPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { H2HPage } from '@/pages/H2HPage';
import { AccountPage } from '@/pages/AccountPage';

function AppContent() {
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <nav className="border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">Fantasy Cricket</h1>
              <div className="flex items-center space-x-4">
                <Link to="/">
                  <Button variant="ghost">Players</Button>
                </Link>
                <Link to="/rounds">
                  <Button variant="ghost">Rounds</Button>
                </Link>
                <Link to="/my-team">
                  <Button variant="ghost">My Team</Button>
                </Link>
                <Link to="/h2h">
                  <Button variant="ghost">Head-to-Head</Button>
                </Link>
                <Link to="/leaderboard">
                  <Button variant="ghost">Leaderboard</Button>
                </Link>
                {user.is_admin && (
                  <Link to="/admin">
                    <Button variant="ghost">Admin Panel</Button>
                  </Link>
                )}
                <Link to="/account">
                  <Button variant="ghost">Account</Button>
                </Link>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {user.username}{user.is_admin && ' (Admin)'}
                  </span>
                  <Button variant="outline" size="sm" onClick={logout}>
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<PlayersPage />} />
            <Route path="/rounds" element={<RoundsPage />} />
            <Route path="/my-team" element={<MyTeamPage />} />
            <Route path="/h2h" element={<H2HPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/account" element={<AccountPage />} />
            {user.is_admin && (
              <Route path="/admin" element={<AdminPage />} />
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
