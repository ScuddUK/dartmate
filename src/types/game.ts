export interface Player {
  id: number;
  name: string;
  score: number;
  legsWon: number;
  setsWon: number;
  averageScore: number;
  throws: ThrowRecord[];
}

export interface ThrowRecord {
  score: number;
  previousScore: number;
  newScore: number;
  timestamp: number;
}

export interface GameSettings {
  startingScore: 301 | 501 | 601 | 701;
  gameFormat: 'bestOf' | 'firstTo';
  legsToWin: number;
  setsEnabled: boolean;
  setsToWin: number;
  playerNames: [string, string];
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
}