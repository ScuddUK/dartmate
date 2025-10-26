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
}

export interface ThrowRecord {
  score: number | 'bust';
  previousScore?: number;
  newScore?: number;
  timestamp: number;
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
  gameWon?: boolean;
  winner?: Player;
}