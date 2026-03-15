export type TournamentMatchType = 'doubles' | 'singles' | 'trebles';

export interface TournamentMatchPlan {
  id: string;
  type: TournamentMatchType;
  label: string;
  team1Players: string[];
  team2Players: string[];
  startingScore: 501 | 601 | 701;
  gameFormat: 'bestOf' | 'firstTo';
  legsToWin: number;
  setsEnabled: boolean;
  setsToWin: number;
}

export interface TournamentConfig {
  enabled: boolean;
  teamNames: [string, string];
  rosters: [string[], string[]];
  matches: TournamentMatchPlan[];
}

export interface TournamentResult {
  matchId: string;
  matchLabel: string;
  winnerTeamId: 1 | 2;
}

export interface TournamentState extends TournamentConfig {
  currentMatchIndex: number;
  teamPoints: [number, number];
  results: TournamentResult[];
}

export interface Player {
  id: number;
  name: string;
  score: number;
  legsWon: number;
  setsWon: number;
  averageScore: number;
  throws: ThrowRecord[];
  isBot?: boolean;
  botSkillLevel?: number;
  teamId?: 1 | 2;
  rotationMembers?: string[];
  rotationIndex?: number;
  // Match-long cumulative stats
  totalScore?: number;
  totalThrows?: number;
  matchAverageScore?: number;
  // Leg-only cumulative stats
  legTotalScore?: number;
  legTotalThrows?: number;
  legAverageScore?: number;
}

export interface ThrowRecord {
  score: number | 'bust';
  previousScore?: number;
  newScore?: number;
  remainingScore?: number;
  playerId?: number;
  timestamp: number | string | Date;
  multiplier?: number;
  segment?: number;
}

export interface DartBotConfig {
  enabled: boolean;
  skillLevel: number; // 1-10
  averageScore: number; // 20-110
  name: string;
}

export interface GameSettings {
  startingScore: 301 | 501 | 601 | 701;
  gameFormat: 'bestOf' | 'firstTo';
  legsToWin: number;
  setsEnabled: boolean;
  setsToWin: number;
  playerNames: [string, string];
  dartBot: DartBotConfig;
  tournament?: TournamentConfig;
}

export interface GameState {
  players: Player[];
  currentPlayer: number;
  gameStarted: boolean;
  gameMode: string;
  throwHistory: ThrowRecord[];
  settings: GameSettings;
  currentLeg: number;
  currentSet: number;
  legStartingPlayer: number; // Tracks who should start each leg (alternates)
  currentThrowerName?: string;
  tournament?: TournamentState;
  gameWon?: boolean;
  winner?: Player;
  pendingNextLeg?: boolean;
  lastLegResult?: {
    winnerId: number;
    winnerName: string;
    legAverage: number;
    showUntil: number;
  };
}
