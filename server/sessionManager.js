import crypto from 'crypto';

// Simple in-memory session store
const sessions = new Map(); // primary code -> { gameState, clients: Set<string>, createdAt, lastActivity, dartBotInstances }
const masterCodes = new Map(); // masterCode -> primary code

// Rate limiting for join attempts per socket
const joinAttempts = new Map(); // socketId -> { count, windowStart }

const ATTEMPT_WINDOW_MS = 60_000; // 1 minute
const MAX_ATTEMPTS_PER_WINDOW = 10; // block brute force
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

function generateCode(length = 8) {
  // Alphanumeric (upper+lower) excluding visually confusable characters
  // Excludes: I, O, l, o, 0, 1
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, alphabet.length);
    code += alphabet[idx];
  }
  return code;
}

function createGameState(settings) {
  const startingScore = settings?.startingScore ?? 501;
  return {
    players: [
      { id: 1, name: settings?.playerNames?.[0] ?? 'Player 1', score: startingScore, legsWon: 0, setsWon: 0, throws: [], averageScore: 0, isBot: false, totalScore: 0, totalThrows: 0, matchAverageScore: 0 },
      { id: 2, name: settings?.playerNames?.[1] ?? 'Player 2', score: startingScore, legsWon: 0, setsWon: 0, throws: [], averageScore: 0, isBot: false, totalScore: 0, totalThrows: 0, matchAverageScore: 0 }
    ],
    currentPlayer: 1,
    gameMode: String(startingScore),
    gameStarted: false,
    throwHistory: [],
    settings: {
      startingScore,
      gameFormat: settings?.gameFormat ?? 'firstTo',
      legsToWin: settings?.legsToWin ?? 3,
      setsEnabled: settings?.setsEnabled ?? false,
      setsToWin: settings?.setsToWin ?? 3,
      playerNames: settings?.playerNames ?? ['Player 1', 'Player 2'],
      dartBot: settings?.dartBot ?? { enabled: false, skillLevel: 5, averageScore: 65, name: 'DartBot' }
    },
    currentLeg: 1,
    currentSet: 1,
    legStartingPlayer: 1,
    gameWon: false,
    winner: undefined
  };
}

export function createSession(settings) {
  // Ensure uniqueness for both primary and master codes
  let code;
  do {
    code = generateCode(8);
  } while (sessions.has(code));

  let masterCode;
  do {
    masterCode = generateCode(8);
  } while (masterCodes.has(masterCode) || sessions.has(masterCode));

  const gameState = createGameState(settings);
  const dartBotInstances = { 1: null, 2: null };
  const now = Date.now();
  sessions.set(code, { gameState, clients: new Set(), createdAt: now, lastActivity: now, dartBotInstances });
  masterCodes.set(masterCode, code);
  return { code, masterCode, gameState };
}

export function getSession(code) {
  const primary = sessions.get(code);
  if (primary) return primary;
  const alias = masterCodes.get(code);
  if (alias) return sessions.get(alias);
  return undefined;
}

export function addClientToSession(code, socketId) {
  const session = getSession(code);
  if (!session) return false;
  session.clients.add(socketId);
  session.lastActivity = Date.now();
  return true;
}

export function removeClientFromAllSessions(socketId) {
  for (const session of sessions.values()) {
    if (session.clients.delete(socketId)) {
      session.lastActivity = Date.now();
    }
  }
}

export function recordJoinAttempt(socketId) {
  const now = Date.now();
  const rec = joinAttempts.get(socketId);
  if (!rec || now - rec.windowStart > ATTEMPT_WINDOW_MS) {
    joinAttempts.set(socketId, { count: 1, windowStart: now });
    return { blocked: false, remaining: MAX_ATTEMPTS_PER_WINDOW - 1 };
  }
  rec.count += 1;
  if (rec.count > MAX_ATTEMPTS_PER_WINDOW) {
    return { blocked: true, remaining: 0 };
  }
  return { blocked: false, remaining: MAX_ATTEMPTS_PER_WINDOW - rec.count };
}

export function cleanupExpiredSessions() {
  const now = Date.now();
  for (const [code, session] of sessions.entries()) {
    if (now - session.lastActivity > SESSION_TTL_MS) {
      sessions.delete(code);
      // Remove any master code alias pointing to this code
      for (const [mCode, primary] of masterCodes.entries()) {
        if (primary === code) masterCodes.delete(mCode);
      }
    }
  }
}

export function listSessions() {
  return Array.from(sessions.keys());
}

export default {
  createSession,
  getSession,
  addClientToSession,
  removeClientFromAllSessions,
  recordJoinAttempt,
  cleanupExpiredSessions,
  listSessions
};