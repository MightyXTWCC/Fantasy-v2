import { Kysely, SqliteDialect } from 'kysely';
import Database from 'better-sqlite3';
import path from 'path';

export interface DatabaseSchema {
  users: {
    id: number;
    username: string;
    email: string;
    is_admin: number;
    budget: number;
    created_at: string;
  };
  players: {
    id: number;
    name: string;
    team: string;
    position: string;
    base_price: number;
    current_price: number;
    total_points: number;
    matches_played: number;
    created_at: string;
  };
  matches: {
    id: number;
    match_name: string;
    date: string;
    team1: string;
    team2: string;
    created_at: string;
  };
  player_stats: {
    id: number;
    player_id: number;
    match_id: number;
    runs: number;
    balls_faced: number;
    fours: number;
    sixes: number;
    wickets: number;
    overs_bowled: number;
    runs_conceded: number;
    catches: number;
    stumpings: number;
    run_outs: number;
    points: number;
    created_at: string;
  };
  user_teams: {
    id: number;
    user_id: number;
    player_id: number;
    purchase_price: number;
    purchase_date: string;
    is_captain: number;
  };
}

const dataDirectory = process.env.DATA_DIRECTORY || './data';
const sqliteDb = new Database(path.join(dataDirectory, 'database.sqlite'));

export const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({
    database: sqliteDb,
  }),
  log: ['query', 'error']
});
