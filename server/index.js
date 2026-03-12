import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import sessionManager, { createSession, getSession, addClientToSession, removeClientFromAllSessions, recordJoinAttempt, cleanupExpiredSessions } from './sessionManager.js';
import dotenv from 'dotenv';
import { RealisticDartBot } from './realisticDartBot.js';

dotenv.config(); 

const BOT_THINK_MS = 2500;

const BOGEY_NUMBERS = new Set([159, 162, 163, 165, 166, 168, 169]);

function isCheckoutable(remaining) {
  return remaining >= 2 && remaining <= 170 && !BOGEY_NUMBERS.has(remaining);
}

// Simple DartBot implementation for server
class SimpleDartBot {
  constructor(skillLevel, targetAverage = null) {
    this.skillLevel = skillLevel;
    // Use provided target average if set; otherwise derive from skill level
    this.averageScore = typeof targetAverage === 'number' ? targetAverage : (20 + (skillLevel - 1) * 10); // 20-110 range
    this.accuracy = Math.min(0.3 + (skillLevel - 1) * 0.07, 0.95); // 30% to 95%
    this.doubleAccuracy = Math.min(0.1 + (skillLevel - 1) * 0.05, 0.6); // 10% to 60%
    this.tripleAccuracy = Math.min(0.05 + (skillLevel - 1) * 0.03, 0.4); // 5% to 40%
    
    // Valid dartboard segments (1-20, plus bull values)
    this.segments = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    
    console.log(`🤖 SimpleDartBot created with skill level ${skillLevel}, accuracy: ${Math.round(this.accuracy * 100)}%`);
  }

  // Generate a single dart throw (one of three darts in a turn)
  generateSingleDart(remainingScore, isFinishingAttempt = false) {
    if (isFinishingAttempt) {
      return this.generateFinishingDart(remainingScore);
    }
    return this.generateRealisticDart();
  }

  // Generate a dart specifically for finishing the game
  generateFinishingDart(remainingScore) {
    // Double-out finishing: try exact even <= 40 first
    if (remainingScore % 2 === 0 && remainingScore <= 40 && remainingScore >= 2) {
      const targetSegment = remainingScore / 2;
      const hit = Math.random() < (this.doubleAccuracy * 1.5);
      return {
        score: hit ? remainingScore : targetSegment,
        segment: targetSegment,
        multiplier: hit ? 2 : 1,
        isDouble: hit,
        isMiss: false,
        isTriple: false,
        isBull: false
      };
    }
    // 50 finish via inner bull only when exactly 50 remains
    if (remainingScore === 50) {
      const bullAccuracy = Math.min(0.45, this.doubleAccuracy * 2);
      const innerHit = Math.random() < bullAccuracy;
      return {
        score: innerHit ? 50 : 25,
        segment: 25,
        multiplier: innerHit ? 2 : 1,
        isDouble: innerHit,
        isBull: true,
        isMiss: false,
        isTriple: false
      };
    }
    // If in classic checkout range (>40 up to 170), attempt first-dart route
    if (remainingScore > 40 && remainingScore <= 170) {
      // 1) Try a treble that leaves a clean 2-dart finish (even <=40 or 50)
      const treblePrefs = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10];
      for (const seg of treblePrefs) {
        const rem = remainingScore - 3 * seg;
        if (rem === 50 || (rem % 2 === 0 && rem >= 2 && rem <= 40)) {
          // Aim this treble
          const adj = this.getAdjacentSegments(seg);
          if (Math.random() < this.tripleAccuracy) {
            return {
              score: 3 * seg,
              segment: seg,
              multiplier: 3,
              isTriple: true,
              isDouble: false,
              isBull: false,
              isMiss: false
            };
          }
          // Miss treble: try to salvage single
          const hitSegment = Math.random() < this.accuracy ? seg : adj[Math.floor(Math.random() * adj.length)];
          return {
            score: hitSegment,
            segment: hitSegment,
            multiplier: 1,
            isTriple: false,
            isDouble: false,
            isBull: false,
            isMiss: false
          };
        }
      }

      // 2) For 41–50, try to leave D16 (32), D20 (40), or 50 (bull)
      if (remainingScore >= 41 && remainingScore <= 50) {
        const singlesPref = [25, 9, 11, 12, 13, 19, 17, 15, 7, 1, 20, 18, 16, 14, 10, 8, 6, 4, 3, 2, 5];
        let pick = null;
        for (const s of singlesPref) {
          const rem = remainingScore - s;
          if (rem === 50 || (rem % 2 === 0 && rem >= 2 && rem <= 40)) {
            pick = s;
            break;
          }
        }
        if (pick != null) {
          const adj = this.getAdjacentSegments(pick);
          const hitSegment = Math.random() < this.accuracy ? pick : adj[Math.floor(Math.random() * adj.length)];
          const isBull = pick === 25;
          return {
            score: hitSegment,
            segment: isBull ? 25 : hitSegment,
            multiplier: isBull ? 1 : 1,
            isBull: isBull,
            isDouble: false,
            isTriple: false,
            isMiss: false
          };
        }
      }

      // 3) Otherwise, aim T20 to reduce to a standard two-dart zone
      const seg = 20;
      const adj = this.getAdjacentSegments(seg);
      if (Math.random() < this.tripleAccuracy) {
        return { score: 60, segment: seg, multiplier: 3, isTriple: true, isDouble: false, isBull: false, isMiss: false };
      }
      const hitSegment = Math.random() < this.accuracy ? seg : adj[Math.floor(Math.random() * adj.length)];
      return { score: hitSegment, segment: hitSegment, multiplier: 1, isTriple: false, isDouble: false, isBull: false, isMiss: false };
    }

    // Setup (outside of direct finish and classic checkout range): prefer leaving D16/D20 next
    const leaveOptions = [32, 40];
    for (const leave of leaveOptions) {
      const needed = remainingScore - leave;
      if (needed >= 1 && needed <= 20) {
        const adj = this.getAdjacentSegments(needed);
        const hitSegment = Math.random() < this.accuracy ? needed : adj[Math.floor(Math.random() * adj.length)];
        return { score: hitSegment, segment: hitSegment, multiplier: 1, isDouble: false, isMiss: false, isTriple: false, isBull: false };
      }
    }
    // If no clean leave, reduce score with T20-style scoring setup
    return this.generateRealisticDart(60);
  }

  // Generate a realistic dart throw that contributes to the target average
  generateRealisticDart(targetScore = null) {
    // If no target specified, default to scoring toward 60 (T20)
    if (!targetScore) {
      targetScore = 60;
    }

    // Global miss chance
    const missChance = Math.max(0.02, 0.15 - (this.skillLevel - 1) * 0.012);
    if (Math.random() < missChance) {
      return { score: 0, segment: 0, multiplier: 1, isMiss: true, isBull: false };
    }

    // Prefer T20/T19 for scoring; avoid random bull during scoring
    let aimSegment = 20;
    let aimMultiplier = 3;

    if (targetScore <= 20) {
      // Aim a single number specifically
      aimSegment = Math.min(20, Math.max(1, Math.round(targetScore)));
      aimMultiplier = 1;
    } else if (targetScore >= 50) {
      // High target: T20 primary, occasional T19
      aimSegment = Math.random() < Math.min(0.15 + this.skillLevel * 0.02, 0.4) ? 19 : 20;
      aimMultiplier = 3;
    } else if (targetScore % 2 === 0 && targetScore <= 40) {
      // Trying to clip a double when asked explicitly
      aimSegment = targetScore / 2;
      aimMultiplier = 2;
    } else {
      // Mid target: single on high segments
      aimSegment = Math.min(20, Math.max(15, Math.round(targetScore)));
      aimMultiplier = 1;
    }

    // Resolve hit vs. typical misses
    const adj = this.getAdjacentSegments(aimSegment);
    let hitSegment = aimSegment;
    let hitMultiplier = 1;

    if (aimMultiplier === 3) {
      if (Math.random() < this.tripleAccuracy) {
        hitMultiplier = 3;
      } else if (Math.random() < this.accuracy) {
        hitMultiplier = 1; // fall to single
      } else {
        hitSegment = adj[Math.floor(Math.random() * adj.length)];
        hitMultiplier = 1;
      }
    } else if (aimMultiplier === 2) {
      if (Math.random() < this.doubleAccuracy) {
        hitMultiplier = 2;
      } else if (Math.random() < this.accuracy) {
        hitMultiplier = 1; // single instead
      } else {
        hitSegment = adj[Math.floor(Math.random() * adj.length)];
        hitMultiplier = 1;
      }
    } else {
      // Single aim
      if (Math.random() >= this.accuracy) {
        hitSegment = adj[Math.floor(Math.random() * adj.length)];
      }
      hitMultiplier = 1;
    }

    const finalScore = hitSegment * hitMultiplier;
    return {
      score: finalScore,
      segment: hitSegment,
      multiplier: hitMultiplier,
      isDouble: hitMultiplier === 2,
      isTriple: hitMultiplier === 3,
      isMiss: false,
      isBull: false
    };
  }

  // Generate a complete turn (exactly 3 darts) following proper darts rules
  generateTurn(currentScore) {
    // For high-average bots, when not in finishing range, generate a turn score
    // directly around the configured average with humanized noise. This keeps
    // the bot hovering around the selected difficulty and avoids under-scoring.
    if (this.averageScore >= 90 && currentScore > 170) {
      const std = Math.max(6, 30 - this.skillLevel * 2); // tighter spread at higher skill
      let desired = Math.round(this._gauss(this.averageScore, std));
      desired = Math.max(0, Math.min(180, desired));
      // Avoid obvious bust/invalid states on the server ruleset
      if (desired > currentScore) desired = Math.max(0, currentScore - 2);
      if (currentScore - desired === 1) desired = Math.max(0, desired - 2);
      return desired;
    }

    const darts = [];
    let remainingScore = currentScore;
    let totalTurnScore = 0;
    const targetTurnScore = this.averageScore;
    
    // Calculate target scores for each dart to achieve the average
    // Use some variance but bias towards the target
    const basePerDart = targetTurnScore / 3;
    const dartTargets = [
      basePerDart + (Math.random() - 0.5) * basePerDart * 0.3, // ±15% variance
      basePerDart + (Math.random() - 0.5) * basePerDart * 0.3, // ±15% variance
      0 // Will be calculated based on first two darts
    ];
    
    // Always throw exactly 3 darts (unless game is finished)
    for (let dartNum = 0; dartNum < 3; dartNum++) {
      const isFinishingAttempt = remainingScore <= 170 && remainingScore > 1;
      
      let dart;
      let targetScore;
      
      if (dartNum === 2) {
        // Third dart: calculate what we need to hit our target average
        const neededForAverage = targetTurnScore - totalTurnScore;
        
        if (isFinishingAttempt) {
          // Prioritize finishing the game
          dart = this.generateFinishingDart(remainingScore);
        } else if (neededForAverage >= 0 && neededForAverage <= 60) {
          // Try to hit exactly what we need for our average
          targetScore = neededForAverage;
          dart = this.generateRealisticDart(targetScore);
        } else if (neededForAverage > 60) {
          // We're behind target, aim high
          targetScore = Math.min(60, neededForAverage * 0.8);
          dart = this.generateRealisticDart(targetScore);
        } else {
          // We're ahead of target, aim lower but not too low
          targetScore = Math.max(5, basePerDart * 0.5);
          dart = this.generateRealisticDart(targetScore);
        }
      } else {
        // First and second darts: use calculated targets
        targetScore = Math.max(5, Math.min(60, dartTargets[dartNum]));
        
        if (isFinishingAttempt) {
          dart = this.generateFinishingDart(remainingScore);
        } else {
          dart = this.generateRealisticDart(targetScore);
        }
      }
      
      // Check for bust conditions before applying the dart
      const newScore = remainingScore - dart.score;
      
      if (newScore < 0 || newScore === 1 || (newScore === 0 && !dart.isDouble)) {
        // Bust or invalid finish - this dart doesn't count, turn ends
        console.log(`🤖 DartBot bust attempt: ${dart.score} would leave ${newScore} (invalid)`);
        break;
      }

      darts.push(dart);
      totalTurnScore += dart.score;
      remainingScore -= dart.score;

      // Game finished with valid double
      if (remainingScore === 0 && dart.isDouble) {
        console.log(`🤖 DartBot finished the game with double ${dart.segment}!`);
        break;
      }
    }

    console.log(`🤖 DartBot turn: ${darts.length} darts, total score: ${totalTurnScore} (${darts.map(d => d.score).join(', ')}) [Target avg: ${this.averageScore}, Actual: ${totalTurnScore}]`);
    
    // Return total turn score (maximum possible is 180)
    return Math.min(totalTurnScore, 180);
  }



  // Weighted random choice helper
  weightedRandomChoice(items, weights) {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }

  // Get adjacent segments on dartboard (for missed throws)
  getAdjacentSegments(segment) {
    // Dartboard layout: 20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 5, 12, 9, 14
    const layout = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 5, 12, 9, 14];
    const index = layout.indexOf(segment);
    
    if (index === -1) return [segment]; // Fallback
    
    const prevIndex = (index - 1 + layout.length) % layout.length;
    const nextIndex = (index + 1) % layout.length;
    
    return [layout[prevIndex], segment, layout[nextIndex]];
  }

  // Gaussian helper (Box-Muller)
  _gauss(mean, std) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + z * std;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Serve static files in production (check multiple ways to detect production)
const nodeEnv = (process.env.NODE_ENV || '').trim().toLowerCase();
const isProduction = nodeEnv === 'production' || process.env.RENDER;

console.log('🔍 Production detection:');
console.log('  NODE_ENV raw:', JSON.stringify(process.env.NODE_ENV));
console.log('  NODE_ENV trimmed:', JSON.stringify(nodeEnv));
console.log('  RENDER exists:', !!process.env.RENDER);
console.log('  isProduction:', isProduction);

if (isProduction) {
  console.log('🚀 Serving static files from dist directory');
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Handle React Router - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    console.log('📄 Serving index.html for route:', req.path);
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
} else {
  console.log('🔧 Development mode - not serving static files');
  app.get('/', (req, res) => {
    const accept = (req.headers.accept || '').toString();
    if (accept.includes('text/html')) {
      res.redirect(302, 'http://localhost:3000/');
      return;
    }
    res.json({ ok: true, message: 'Server running. Start UI at http://localhost:3000/' });
  });
}

// Default template for non-session legacy (will be unused after pairing rollout)
let gameState = {
  players: [
    { id: 1, name: 'Player 1', score: 501, legsWon: 0, setsWon: 0, throws: [], averageScore: 0, isBot: false, totalScore: 0, totalThrows: 0, matchAverageScore: 0 },
    { id: 2, name: 'Player 2', score: 501, legsWon: 0, setsWon: 0, throws: [], averageScore: 0, isBot: false, totalScore: 0, totalThrows: 0, matchAverageScore: 0 }
  ],
  currentPlayer: 1,
  gameMode: '501',
  gameStarted: false,
  throwHistory: [],
  settings: {
    startingScore: 501,
    gameFormat: 'firstTo',
    legsToWin: 3,
    setsEnabled: false,
    setsToWin: 3,
    playerNames: ['Player 1', 'Player 2'],
    dartBot: {
      enabled: false,
      skillLevel: 5,
      averageScore: 65,
      name: 'DartBot'
    }
  },
  currentLeg: 1,
  currentSet: 1,
  legStartingPlayer: 1 // Tracks who should start each leg (alternates)
};

// Legacy DartBot instances (session-based below)
let dartBotInstances = {
  1: null,
  2: null
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  console.log('Current game state:', JSON.stringify(gameState, null, 2));
  
  // Pairing system: do not emit global game state; wait for session join/create
  socket.emit('connectionStatus', { status: 'connected' });

  // Handle explicit game state requests
  socket.on('requestGameState', () => {
    console.log('Game state requested by:', socket.id);
    socket.emit('gameState', gameState);
  });

  const LEG_SHOT_POPUP_MS = 5000;

  const updateTotalsForTurn = (player, turnScore) => {
    if (typeof turnScore !== 'number') return;
    player.totalThrows = (player.totalThrows || 0) + 1;
    player.totalScore = (player.totalScore || 0) + turnScore;
    player.matchAverageScore = Math.round(((player.totalScore || 0) / (player.totalThrows || 1)) * 100) / 100;

    player.legTotalThrows = (player.legTotalThrows || 0) + 1;
    player.legTotalScore = (player.legTotalScore || 0) + turnScore;
    player.legAverageScore = Math.round(((player.legTotalScore || 0) / (player.legTotalThrows || 1)) * 100) / 100;
  };

  const resetLegTotals = (player) => {
    player.legTotalScore = 0;
    player.legTotalThrows = 0;
    player.legAverageScore = 0;
  };

  const legsNeededToWin = (settings) =>
    settings.gameFormat === 'bestOf' ? Math.ceil(settings.legsToWin / 2) : settings.legsToWin;

  const setsNeededToWin = (settings) =>
    settings.gameFormat === 'bestOf' ? Math.ceil(settings.setsToWin / 2) : settings.setsToWin;

  const clearPendingLegTimeout = (session) => {
    if (session && session.pendingLegTimeout) {
      clearTimeout(session.pendingLegTimeout);
      session.pendingLegTimeout = null;
    }
  };

  const scheduleBotIfNeededInSession = (session, code) => {
    const sGameState = session.gameState;
    const current = sGameState.players.find(p => p.id === sGameState.currentPlayer);
    if (!current || !current.isBot) return;
    setTimeout(() => {
      const latestSession = getSession(code);
      if (!latestSession) return;
      const gs = latestSession.gameState;
      if (gs.gameWon || gs.pendingNextLeg) return;
      const botPlayer = gs.players.find(p => p.id === gs.currentPlayer);
      if (!botPlayer || !botPlayer.isBot) return;
      const botInstance = latestSession.dartBotInstances[botPlayer.id] || latestSession.dartBotInstances[2];
      const turnScore = botInstance ? botInstance.generateTurn(botPlayer.score, gs.settings) : Math.max(0, Math.min(180, Math.round(gs.settings.dartBot?.averageScore ?? 50)));
      const previousScore = botPlayer.score;
      const newScore = previousScore - turnScore;

      const isBust = newScore < 0 || newScore === 1 || (newScore === 0 && !isCheckoutable(previousScore));
      if (isBust) {
        const bustRecord = {
          score: 'bust',
          timestamp: new Date(),
          remainingScore: previousScore,
          playerId: botPlayer.id,
          previousScore
        };
        botPlayer.throws.push(bustRecord);
        gs.throwHistory.push(bustRecord);
        if (botPlayer.throws.length > 10) botPlayer.throws = botPlayer.throws.slice(-10);
        if (gs.throwHistory.length > 50) gs.throwHistory = gs.throwHistory.slice(-50);
        io.to(code).emit('bust', { playerId: botPlayer.id });
        gs.currentPlayer = gs.currentPlayer === 1 ? 2 : 1;
        io.to(code).emit('gameState', gs);
        return;
      }

      const throwDetails = {
        score: turnScore,
        playerId: botPlayer.id,
        timestamp: new Date(),
        previousScore,
        remainingScore: newScore
      };

      botPlayer.throws.push(throwDetails);
      gs.throwHistory.push(throwDetails);
      updateTotalsForTurn(botPlayer, turnScore);
      if (botPlayer.throws.length > 10) botPlayer.throws = botPlayer.throws.slice(-10);
      if (gs.throwHistory.length > 50) gs.throwHistory = gs.throwHistory.slice(-50);

      if (newScore === 0) {
        botPlayer.score = 0;
        handleLegWinInSession(latestSession, code, botPlayer);
        return;
      }

      botPlayer.score = newScore;
      updatePlayerAverage(botPlayer);
      gs.currentPlayer = gs.currentPlayer === 1 ? 2 : 1;
      io.to(code).emit('gameState', gs);
    }, BOT_THINK_MS);
  };

  const startNextLegInSession = (session, code) => {
    const sGameState = session.gameState;
    if (!sGameState.pendingNextLeg) return;
    sGameState.pendingNextLeg = false;
    sGameState.lastLegResult = undefined;
    clearPendingLegTimeout(session);

    const start = sGameState.settings?.startingScore || 501;
    sGameState.players.forEach(p => {
      p.score = start;
      p.throws = [];
      p.averageScore = 0;
      resetLegTotals(p);
    });
    sGameState.throwHistory = [];

    io.to(code).emit('gameState', sGameState);
    scheduleBotIfNeededInSession(session, code);
  };

  const handleLegWinInSession = (session, code, winnerPlayer) => {
    const sGameState = session.gameState;

    winnerPlayer.legsWon = (winnerPlayer.legsWon || 0) + 1;
    const legsNeeded = legsNeededToWin(sGameState.settings);

    if (sGameState.settings.setsEnabled) {
      if (winnerPlayer.legsWon >= legsNeeded) {
        winnerPlayer.setsWon = (winnerPlayer.setsWon || 0) + 1;
        sGameState.players.forEach(p => { p.legsWon = 0; });
        sGameState.currentSet++;

        const setsNeeded = setsNeededToWin(sGameState.settings);
        if (winnerPlayer.setsWon >= setsNeeded) {
          sGameState.gameWon = true;
          sGameState.winner = winnerPlayer;
          io.to(code).emit('gameWon', { winner: winnerPlayer });
          io.to(code).emit('gameState', sGameState);
          return;
        }
      }
    } else {
      if (winnerPlayer.legsWon >= legsNeeded) {
        sGameState.gameWon = true;
        sGameState.winner = winnerPlayer;
        io.to(code).emit('gameWon', { winner: winnerPlayer });
        io.to(code).emit('gameState', sGameState);
        return;
      }
    }

    sGameState.pendingNextLeg = true;
    sGameState.lastLegResult = {
      winnerId: winnerPlayer.id,
      winnerName: winnerPlayer.name,
      legAverage: typeof winnerPlayer.legAverageScore === 'number' ? winnerPlayer.legAverageScore : 0,
      showUntil: Date.now() + LEG_SHOT_POPUP_MS
    };

    sGameState.currentLeg++;
    sGameState.legStartingPlayer = sGameState.legStartingPlayer === 1 ? 2 : 1;
    sGameState.currentPlayer = sGameState.legStartingPlayer;

    io.to(code).emit('legWon', sGameState.lastLegResult);
    io.to(code).emit('gameState', sGameState);

    clearPendingLegTimeout(session);
    session.pendingLegTimeout = setTimeout(() => {
      const latestSession = getSession(code);
      if (!latestSession) return;
      if (latestSession.gameState.gameWon) return;
      startNextLegInSession(latestSession, code);
    }, LEG_SHOT_POPUP_MS);
  };
  
  // Create a new session and start game with settings (host/scoreboard)
  socket.on('startGameWithSettings', (settings) => {
    console.log(`⚙️ startGameWithSettings from ${socket.id}`);
    try {
      const { code, masterCode, gameState: sessionGameState } = createSession(settings);
      addClientToSession(code, socket.id);
      socket.join(code);

      // Initialize DartBot for session
      const session = getSession(code);
      if (settings.dartBot?.enabled) {
      session.dartBotInstances[2] = new RealisticDartBot(settings.dartBot.skillLevel, settings.dartBot.averageScore);
        sessionGameState.players[1].isBot = true;
      }

      // Do not auto-start the game; prompt scoreboard to choose first player
      // Leave currentPlayer and legStartingPlayer at defaults, gameStarted remains false

      // Broadcast to room and inform host of pair code
      console.log(`🔐 Emitting pairCode to host ${socket.id}: ${code} (admin ${masterCode})`);
      io.to(code).emit('gameState', sessionGameState);
      socket.emit('pairCode', { code, masterCode });
      io.to(code).emit('connectionStatus', { status: 'session_created', code, clients: session.clients.size });
    } catch (err) {
      console.error('❌ Failed to create session or emit pair code:', err);
      socket.emit('pairCodeError', { error: 'Failed to generate pairing code. Please try again.' });
    }
  });

  // Host can request re-emission of the pair code if UI missed it
  socket.on('requestPairCode', () => {
    try {
      // Find session that contains this socket
      const sessionCodes = [];
      for (const [code, session] of Object.entries(Object.fromEntries(sessionManager.listSessions().map(c => [c, getSession(c)])))) {
        if (session && session.clients.has(socket.id)) {
          sessionCodes.push(code);
          const master = [...sessionManager.listSessions()].find(c => getSession(c) === session) ? undefined : undefined;
          // masterCode lookup: iterate master code map indirectly via getSession
          // Since we don't expose master code map, derive by checking aliases
        }
      }
      // Simpler: iterate sessions directly
      let foundCode = null;
      let foundMaster = null;
      for (const code of sessionManager.listSessions()) {
        const s = getSession(code);
        if (s && s.clients.has(socket.id)) {
          foundCode = code;
          break;
        }
      }
      if (!foundCode) {
        socket.emit('pairCodeError', { error: 'No active session found for this host.' });
        return;
      }
      // Attempt to recover master code by checking aliases (masterCodes not exported; re-create by scanning)
      // As master code is sent initially, it is not strictly needed for re-emit.
      console.log(`🔁 Re-emitting pairCode to ${socket.id}: ${foundCode}`);
      socket.emit('pairCode', { code: foundCode, masterCode: null });
    } catch (err) {
      console.error('❌ Error during requestPairCode:', err);
      socket.emit('pairCodeError', { error: 'Unexpected error while retrieving pair code.' });
    }
  });

  // Join existing session by code (mobile scorer)
  socket.on('joinSession', ({ code }) => {
    const attempt = recordJoinAttempt(socket.id);
    if (attempt.blocked) {
      socket.emit('sessionError', { error: 'Too many attempts. Please wait and try again.' });
      return;
    }
    // Accept exactly 5-digit numeric codes
    if (typeof code !== 'string' || !/^\d{5}$/.test(code)) {
      socket.emit('sessionError', { error: 'Invalid code format. Please enter a 5-digit number.' });
      return;
    }
    const session = getSession(code);
    if (!session) {
      socket.emit('sessionError', { error: 'No session found for this code.' });
      return;
    }
    addClientToSession(code, socket.id);
    socket.join(code);
    socket.emit('sessionJoined', { code });
    // Do not auto-start; allow mobile to choose starting player
    const sGameState = session.gameState;
    sGameState.gameStarted = false;
    socket.emit('gameState', sGameState);
    io.to(code).emit('gameState', sGameState);
    io.to(code).emit('connectionStatus', { status: 'client_joined', code, clients: session.clients.size });
  });

  // Set starting player within a session and start the match
  socket.on('setStartingPlayerInSession', ({ code, playerId }) => {
    const session = getSession(code);
    if (!session) {
      socket.emit('sessionError', { error: 'Session not found.' });
      return;
    }

    const sGameState = session.gameState;
    if (playerId === 1 || playerId === 2) {
      sGameState.currentPlayer = playerId;
      sGameState.legStartingPlayer = playerId;
      sGameState.gameStarted = true;

      // Initialize DartBot for the session if enabled
      if (sGameState.settings.dartBot?.enabled) {
        session.dartBotInstances[2] = session.dartBotInstances[2] || new RealisticDartBot(sGameState.settings.dartBot.skillLevel, sGameState.settings.dartBot.averageScore);
        sGameState.players[1].isBot = true;
      }

      io.to(code).emit('gameState', sGameState);

      scheduleBotIfNeededInSession(session, code);
    }
  });

  socket.on('startNextLegInSession', ({ code }) => {
    const session = getSession(code);
    if (!session) {
      socket.emit('sessionError', { error: 'Session not found.' });
      return;
    }
    startNextLegInSession(session, code);
  });

  // Reset game within a specific session (paired mobile/scoreboard flow)
  socket.on('resetGameInSession', ({ code }) => {
    const session = getSession(code);
    if (!session) {
      socket.emit('sessionError', { error: 'Session not found.' });
      return;
    }
    const sGameState = session.gameState;
    clearPendingLegTimeout(session);
    const start = sGameState.settings?.startingScore || 501;
    sGameState.players.forEach(player => {
      player.score = start;
      player.legsWon = 0;
      player.setsWon = 0;
      player.throws = [];
      player.averageScore = 0;
      player.totalScore = 0;
      player.totalThrows = 0;
      player.matchAverageScore = 0;
      resetLegTotals(player);
    });
    sGameState.currentPlayer = sGameState.legStartingPlayer || 1;
    sGameState.legStartingPlayer = sGameState.legStartingPlayer || 1;
    sGameState.currentLeg = 1;
    sGameState.currentSet = 1;
    sGameState.gameStarted = false;
    sGameState.gameWon = false;
    sGameState.winner = undefined;
    sGameState.pendingNextLeg = false;
    sGameState.lastLegResult = undefined;
    sGameState.throwHistory = [];
    // Do not auto-start; let client choose starter via setStartingPlayerInSession
    io.to(code).emit('gameState', sGameState);
  });

  // Update settings within a session and restart the match
  socket.on('updateSettingsInSession', ({ code, settings }) => {
    const session = getSession(code);
    if (!session) {
      socket.emit('sessionError', { error: 'Session not found.' });
      return;
    }
    const sGameState = session.gameState;
    clearPendingLegTimeout(session);

    // Merge new settings
    sGameState.settings = { ...sGameState.settings, ...settings };

    // Apply player names and reset player stats
    const start = sGameState.settings?.startingScore || 501;
    sGameState.players.forEach((player, idx) => {
      player.name = (sGameState.settings.playerNames && sGameState.settings.playerNames[idx]) || player.name;
      player.score = start;
      player.legsWon = 0;
      player.setsWon = 0;
      player.throws = [];
      player.averageScore = 0;
      player.totalScore = 0;
      player.totalThrows = 0;
      player.matchAverageScore = 0;
      resetLegTotals(player);
      player.isBot = false;
    });

    // Configure DartBot for the session if enabled
    if (sGameState.settings.dartBot?.enabled) {
      session.dartBotInstances[2] = new RealisticDartBot(sGameState.settings.dartBot.skillLevel, sGameState.settings.dartBot.averageScore);
      sGameState.players[1].isBot = true;
    } else {
      session.dartBotInstances[2] = null;
      sGameState.players[1].isBot = false;
    }

    // Reset match state; do not auto-start so mobile can choose starter
    sGameState.currentPlayer = sGameState.legStartingPlayer || 1;
    sGameState.currentLeg = 1;
    sGameState.currentSet = 1;
    sGameState.gameStarted = false;
    sGameState.gameWon = false;
    sGameState.winner = undefined;
    sGameState.pendingNextLeg = false;
    sGameState.lastLegResult = undefined;
    sGameState.throwHistory = [];
    io.to(code).emit('gameState', sGameState);
    // Starter selection will be sent by client via setStartingPlayerInSession
  });

  // Mobile/client submits score within a session
  socket.on('submitScoreInSession', ({ code, score, playerId }) => {
    const session = getSession(code);
    if (!session) {
      socket.emit('sessionError', { error: 'Session not found.' });
      return;
    }
    const sGameState = session.gameState;
    if (sGameState.pendingNextLeg) return;
    const player = sGameState.players.find(p => p.id === playerId);
    if (!player) return;
    const previousScore = player.score;
    const newScore = player.score - score;
    const isBust = newScore < 0 || newScore === 1 || (newScore === 0 && !isCheckoutable(previousScore));
    if (isBust) {
      // Bust - record bust without changing score
      const bustRecord = {
        score: 'bust',
        timestamp: new Date(),
        remainingScore: player.score,
        playerId,
        previousScore: player.score
      };
      // Update histories
      player.throws.push(bustRecord);
      sGameState.throwHistory.push(bustRecord);

      // Cap history sizes
      if (player.throws.length > 10) {
        player.throws = player.throws.slice(-10);
      }
      if (sGameState.throwHistory.length > 50) {
        sGameState.throwHistory = sGameState.throwHistory.slice(-50);
      }

      // Notify room and rotate player
      io.to(code).emit('bust', { playerId });
      sGameState.currentPlayer = sGameState.currentPlayer === 1 ? 2 : 1;
      io.to(code).emit('gameState', sGameState);
      scheduleBotIfNeededInSession(session, code);
      return;
    }

    // Valid throw - record it
    const throwRecord = {
      score,
      timestamp: new Date(),
      remainingScore: newScore,
      playerId,
      previousScore: player.score
    };

    // Update histories
    player.throws.push(throwRecord);
    sGameState.throwHistory.push(throwRecord);
    updateTotalsForTurn(player, throwRecord.score);

    // Cap history sizes
    if (player.throws.length > 10) {
      player.throws = player.throws.slice(-10);
    }
    if (sGameState.throwHistory.length > 50) {
      sGameState.throwHistory = sGameState.throwHistory.slice(-50);
    }

    if (newScore === 0) {
      player.score = 0;
      handleLegWinInSession(session, code, player);
      return;
    }

    // Regular valid throw
    player.score = newScore;
    updatePlayerAverage(player);
    sGameState.currentPlayer = sGameState.currentPlayer === 1 ? 2 : 1;
    io.to(code).emit('gameState', sGameState);
    scheduleBotIfNeededInSession(session, code);
  });

  // Undo last throw within a specific session
  socket.on('undoLastThrowInSession', ({ code }) => {
    const session = getSession(code);
    if (!session) {
      socket.emit('sessionError', { error: 'Session not found.' });
      return;
    }
    const sGameState = session.gameState;
    if (sGameState.throwHistory.length > 0) {
      const lastThrow = sGameState.throwHistory.pop();
      const player = sGameState.players.find(p => p.id === lastThrow.playerId);
      if (player) {
        // Restore player's score
        player.score = lastThrow.previousScore;
        // Remove from player's individual history
        const idx = player.throws.findIndex(t => {
          const txTs = (t.timestamp instanceof Date) ? t.timestamp.getTime() : new Date(t.timestamp).getTime();
          const lastTs = (lastThrow.timestamp instanceof Date) ? lastThrow.timestamp.getTime() : new Date(lastThrow.timestamp).getTime();
          return txTs === lastTs && t.score === lastThrow.score;
        });
        if (idx !== -1) {
          player.throws.splice(idx, 1);
        }
        // Adjust totals if this was a numeric score
        if (typeof lastThrow.score === 'number') {
          player.totalThrows = Math.max(0, (player.totalThrows || 0) - 1);
          player.totalScore = Math.max(0, (player.totalScore || 0) - lastThrow.score);
          const denom = player.totalThrows || 1;
          player.matchAverageScore = Math.round(((player.totalScore || 0) / denom) * 100) / 100;

          player.legTotalThrows = Math.max(0, (player.legTotalThrows || 0) - 1);
          player.legTotalScore = Math.max(0, (player.legTotalScore || 0) - lastThrow.score);
          const legDenom = player.legTotalThrows || 1;
          player.legAverageScore = Math.round(((player.legTotalScore || 0) / legDenom) * 100) / 100;
        }
        // Update average
        updatePlayerAverage(player);
        // Set current player back to the one who made the undone throw
        sGameState.currentPlayer = lastThrow.playerId;
        io.to(code).emit('gameState', sGameState);
      }
    }
  });

  // Handle player name updates
  socket.on('updatePlayerName', (data) => {
    const { playerId, name } = data;
    const player = gameState.players.find(p => p.id === playerId);
    if (player) {
      player.name = name;
      gameState.settings.playerNames[playerId - 1] = name;
      io.emit('gameState', gameState);
    }
  });

  // Handle manual starting player selection and start the game
  socket.on('setStartingPlayer', (data) => {
    const { playerId } = data;
    if (playerId === 1 || playerId === 2) {
      gameState.currentPlayer = playerId;
      gameState.legStartingPlayer = playerId;
      gameState.gameStarted = true; // Now start the game
      
      // Initialize DartBot if enabled (now that the game is starting)
      if (gameState.settings.dartBot?.enabled) {
        // Create bot instance for player 2 (since player 2 is the bot)
    dartBotInstances[2] = new RealisticDartBot(gameState.settings.dartBot.skillLevel, gameState.settings.dartBot.averageScore);
        console.log(`🤖 DartBot initialized for Player 2 with skill level ${gameState.settings.dartBot.skillLevel}`);
        // Mark Player 2 as bot for turn scheduling
        gameState.players[1].isBot = true;
      } else {
        dartBotInstances[1] = null;
        dartBotInstances[2] = null;
        gameState.players[1].isBot = false;
      }
      
      console.log(`🎯 Starting player manually set to: Player ${playerId} and starting the game`);
      io.emit('gameState', gameState);
      
      // If DartBot is the starting player and it's their turn, make them throw immediately
      if (gameState.currentPlayer === 1 && gameState.players[0].isBot) {
        setTimeout(() => makeBotThrow(1), BOT_THINK_MS);
      } else if (gameState.currentPlayer === 2 && gameState.players[1].isBot) {
        setTimeout(() => makeBotThrow(2), BOT_THINK_MS);
      }
    }
  });
  
  // Handle score submission
  socket.on('submitScore', (data) => {
    const { score, playerId } = data;
    const player = gameState.players.find(p => p.id === playerId);
    
    if (player && score >= 0 && score <= 180) {
      // Check if this would be a bust before recording anything
      const previousScore = player.score;
      const newScore = player.score - score;
      
      if (newScore < 0 || newScore === 1 || (newScore === 0 && !isCheckoutable(previousScore))) {
        // Bust - don't record the throw, just emit bust event
        socket.emit('bust', { playerId });
        
        // Record a bust in the throw history for display purposes
        const bustRecord = {
          score: 'bust',
          timestamp: new Date(),
          remainingScore: player.score, // Score remains unchanged
          playerId: playerId,
          previousScore: player.score
        };
        
        // Add bust record to player's throw history
        player.throws.push(bustRecord);
        
        // Add to global throw history for proper undo functionality
        gameState.throwHistory.push(bustRecord);
        
        // Keep only last 10 throws per player
        if (player.throws.length > 10) {
          player.throws = player.throws.slice(-10);
        }
        
        // Keep only last 50 throws in global history
        if (gameState.throwHistory.length > 50) {
          gameState.throwHistory = gameState.throwHistory.slice(-50);
        }
        
        // Move to next player (alternate between player IDs 1 and 2)
        gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
        
        // Broadcast updated state
        io.emit('gameState', gameState);
        
        // If next player is a bot, make them throw
        const nextPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
        if (nextPlayer && nextPlayer.isBot) {
          setTimeout(() => makeBotThrow(gameState.currentPlayer), BOT_THINK_MS);
        }
        return;
      }
      
      // Valid throw - record it
      const throwRecord = {
        score,
        timestamp: new Date(),
        remainingScore: newScore,
        playerId: playerId,
        previousScore: player.score
      };
      
      // Add to player's throw history
      player.throws.push(throwRecord);
      // Update match-long totals for valid throws
      if (typeof throwRecord.score === 'number') {
        player.totalThrows = (player.totalThrows || 0) + 1;
        player.totalScore = (player.totalScore || 0) + throwRecord.score;
        player.matchAverageScore = Math.round(((player.totalScore || 0) / (player.totalThrows || 1)) * 100) / 100;
      }
      
      // Add to global throw history for proper undo functionality
      gameState.throwHistory.push(throwRecord);
      
      // Keep only last 10 throws per player
      if (player.throws.length > 10) {
        player.throws = player.throws.slice(-10);
      }
      
      // Keep only last 50 throws in global history
      if (gameState.throwHistory.length > 50) {
        gameState.throwHistory = gameState.throwHistory.slice(-50);
      }
      
      if (newScore === 0) {
        // Player wins the leg
        player.legsWon++;
        
        // Check if player wins the set (if sets are enabled)
        if (gameState.settings.setsEnabled) {
          const legsNeeded = gameState.settings.gameFormat === 'bestOf' 
            ? Math.ceil(gameState.settings.legsToWin / 2) 
            : gameState.settings.legsToWin;
            
          if (player.legsWon >= legsNeeded) {
            player.setsWon++;
            // Reset legs for new set
            gameState.players.forEach(p => p.legsWon = 0);
            gameState.currentSet++;
            
            // Check if player wins the match
            const setsNeeded = gameState.settings.gameFormat === 'bestOf' 
              ? Math.ceil(gameState.settings.setsToWin / 2) 
              : gameState.settings.setsToWin;
              
            if (player.setsWon >= setsNeeded) {
              // Game over - player wins
              resetLeg(); // Reset scores for display purposes
              io.emit('gameWon', { winner: player });
              return;
            } else {
              // Set won but match continues - reset for new set
              resetLeg();
              io.emit('gameState', gameState);
              
              // Check if the new starting player is a bot and make them throw
              const newStartingPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
              if (newStartingPlayer && newStartingPlayer.isBot) {
                setTimeout(() => makeBotThrow(gameState.currentPlayer), BOT_THINK_MS);
              }
              return;
            }
          }
        } else {
          // No sets - check if player wins the match based on legs
          const legsNeeded = gameState.settings.gameFormat === 'bestOf' 
            ? Math.ceil(gameState.settings.legsToWin / 2) 
            : gameState.settings.legsToWin;
            
          if (player.legsWon >= legsNeeded) {
            // Game over - player wins
            resetLeg(); // Reset scores for display purposes
            io.emit('gameWon', { winner: player });
            return;
          }
        }
        
        resetLeg();
        // Broadcast updated state after leg reset
        io.emit('gameState', gameState);
        
        // Check if the new starting player is a bot and make them throw
        const newStartingPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
        if (newStartingPlayer && newStartingPlayer.isBot) {
          setTimeout(() => makeBotThrow(gameState.currentPlayer), BOT_THINK_MS);
        }
        return;
      }
      
      // Update score (only for valid, non-bust throws)
      player.score = newScore;
      
      // Calculate average
      updatePlayerAverage(player);
      
      // Move to next player (alternate between player IDs 1 and 2)
      gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
      
      // Broadcast updated state
      io.emit('gameState', gameState);
      
      // If next player is a bot, make them throw
      const nextPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
      console.log(`🎯 Next player: ${nextPlayer?.name} (ID: ${nextPlayer?.id}), isBot: ${nextPlayer?.isBot}`);
      if (nextPlayer && nextPlayer.isBot) {
        console.log(`🤖 Scheduling bot throw for player ${gameState.currentPlayer}`);
        setTimeout(() => makeBotThrow(gameState.currentPlayer), BOT_THINK_MS);
      } else {
        console.log(`👤 Next player is human or not found`);
      }
    }
  });
  
  // Handle undo last throw
  socket.on('undoLastThrow', () => {
    if (gameState.throwHistory.length > 0) {
      // Get the most recent throw from global history
      const lastThrow = gameState.throwHistory.pop();
      const player = gameState.players.find(p => p.id === lastThrow.playerId);
      
      if (player) {
        // Restore the player's score to what it was before the throw
        player.score = lastThrow.previousScore;
        
        // Remove the throw from the player's individual history
        const throwIndex = player.throws.findIndex(t => 
          t.timestamp.getTime() === lastThrow.timestamp.getTime() && 
          t.score === lastThrow.score
        );
        if (throwIndex !== -1) {
          player.throws.splice(throwIndex, 1);
        }

        // Adjust match-long totals if this was a valid throw
        if (typeof lastThrow.score === 'number') {
          player.totalThrows = Math.max(0, (player.totalThrows || 0) - 1);
          player.totalScore = Math.max(0, (player.totalScore || 0) - lastThrow.score);
          const denom = player.totalThrows || 1;
          player.matchAverageScore = Math.round(((player.totalScore || 0) / denom) * 100) / 100;
        }
        
        // Update player average
        updatePlayerAverage(player);
        
        // Set current player to the player who made the undone throw
        gameState.currentPlayer = lastThrow.playerId;
        
        io.emit('gameState', gameState);
      }
    }
  });
  
  // Handle game reset
socket.on('resetGame', () => {
  const start = gameState.settings?.startingScore || 501;
  gameState.players.forEach(player => {
    player.score = start;
    player.legsWon = 0;
    player.setsWon = 0;
    player.throws = [];
    player.averageScore = 0;
    player.totalScore = 0;
    player.totalThrows = 0;
    player.matchAverageScore = 0;
  });
  gameState.currentPlayer = 1;
  gameState.legStartingPlayer = 1;
  gameState.currentLeg = 1;
  gameState.currentSet = 1;
  gameState.gameStarted = false;
  gameState.gameWon = false;
  gameState.winner = undefined;
  gameState.throwHistory = [];
  io.emit('gameState', gameState);
});
  
  // Handle start game
  socket.on('startGame', () => {
    gameState.gameStarted = true;
    io.emit('gameState', gameState);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    removeClientFromAllSessions(socket.id);
  });
});

function resetLeg() {
  gameState.players.forEach(player => {
    player.score = gameState.settings.startingScore;
    player.throws = [];
  });
  
  // Alternate the starting player for each leg
  gameState.legStartingPlayer = gameState.legStartingPlayer === 1 ? 2 : 1;
  gameState.currentPlayer = gameState.legStartingPlayer;
  gameState.currentLeg++;
  gameState.throwHistory = [];
}

function updatePlayerAverage(player) {
  if (player.throws.length === 0) {
    player.averageScore = 0;
    return;
  }
  
  // Filter out bust throws when calculating average
  const validThrows = player.throws.filter(throw_ => typeof throw_.score === 'number');
  if (validThrows.length === 0) {
    player.averageScore = 0;
    return;
  }
  
  const totalScore = validThrows.reduce((sum, throw_) => sum + throw_.score, 0);
  player.averageScore = Math.round((totalScore / validThrows.length) * 100) / 100;
}

function makeBotThrow(playerId) {
  const player = gameState.players.find(p => p.id === playerId);
  const botInstance = dartBotInstances[playerId];
  
  console.log(`🤖 makeBotThrow called for player ${playerId}`);
  console.log(`Player found: ${!!player}, isBot: ${player?.isBot}, botInstance: ${!!botInstance}, currentPlayer: ${gameState.currentPlayer}`);
  
  if (!player || !player.isBot || !botInstance || gameState.currentPlayer !== playerId) {
    console.log(`❌ Bot throw cancelled - conditions not met`);
    return;
  }
  
  console.log(`DartBot (Player ${playerId}) is throwing...`);
  
  // Generate bot turn score
  const turnScore = botInstance.generateTurn(player.score, gameState.settings);
  
  // Simulate the throw with a delay for realism
  setTimeout(() => {
    // Check if this would be a bust before recording anything
    const previousScore = player.score;
    const newScore = player.score - turnScore;
    
    if (newScore < 0 || newScore === 1 || (newScore === 0 && !isCheckoutable(previousScore))) {
      // Bust - don't record the throw, just emit bust event
      io.emit('bust', { playerId });
      
      // Record a bust in the throw history for display purposes
      const bustRecord = {
        score: 'bust',
        timestamp: new Date(),
        remainingScore: player.score, // Score remains unchanged
        playerId: playerId,
        previousScore: player.score
      };
      
      // Add bust record to player's throw history
      player.throws.push(bustRecord);
      
      // Add to global throw history for proper undo functionality
      gameState.throwHistory.push(bustRecord);
      
      // Keep only last 10 throws per player
      if (player.throws.length > 10) {
        player.throws = player.throws.slice(-10);
      }
      
      // Keep only last 50 throws in global history
      if (gameState.throwHistory.length > 50) {
        gameState.throwHistory = gameState.throwHistory.slice(-50);
      }
      
      // Move to next player
      gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
      
      // Broadcast updated state
      io.emit('gameState', gameState);
      
      // If next player is also a bot, make them throw
      const nextPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
      if (nextPlayer && nextPlayer.isBot) {
        setTimeout(() => makeBotThrow(gameState.currentPlayer), BOT_THINK_MS);
      }
      
      return;
    }
    
    // Valid throw - record it
    const throwRecord = {
      score: turnScore,
      timestamp: new Date(),
      remainingScore: newScore,
      playerId: playerId,
      previousScore: player.score
    };
    
    // Add to player's throw history
    player.throws.push(throwRecord);
    // Update match-long totals for valid throws
    if (typeof throwRecord.score === 'number') {
      player.totalThrows = (player.totalThrows || 0) + 1;
      player.totalScore = (player.totalScore || 0) + throwRecord.score;
      player.matchAverageScore = Math.round(((player.totalScore || 0) / (player.totalThrows || 1)) * 100) / 100;
    }
    
    // Add to global throw history for proper undo functionality
    gameState.throwHistory.push(throwRecord);
    
    // Keep only last 10 throws per player
    if (player.throws.length > 10) {
      player.throws = player.throws.slice(-10);
    }
    
    // Keep only last 50 throws in global history
    if (gameState.throwHistory.length > 50) {
      gameState.throwHistory = gameState.throwHistory.slice(-50);
    }
    
    if (newScore === 0) {
      // Player wins the leg
      player.legsWon++;
      
      // Check if player wins the set (if sets are enabled)
      if (gameState.settings.setsEnabled) {
        const legsNeeded = gameState.settings.gameFormat === 'bestOf' 
          ? Math.ceil(gameState.settings.legsToWin / 2) 
          : gameState.settings.legsToWin;
          
        if (player.legsWon >= legsNeeded) {
          player.setsWon++;
          // Reset legs for new set
          gameState.players.forEach(p => p.legsWon = 0);
          gameState.currentSet++;
          
          // Check if player wins the match
          const setsNeeded = gameState.settings.gameFormat === 'bestOf' 
            ? Math.ceil(gameState.settings.setsToWin / 2) 
            : gameState.settings.setsToWin;
            
          if (player.setsWon >= setsNeeded) {
            // Game over - player wins
            resetLeg(); // Reset scores for display purposes
            io.emit('gameWon', { winner: player });
            return;
          } else {
            // Set won but match continues - reset for new set
            resetLeg();
            io.emit('gameState', gameState);
            
            // Check if the new starting player is a bot and make them throw
            const newStartingPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
            if (newStartingPlayer && newStartingPlayer.isBot) {
              setTimeout(() => makeBotThrow(gameState.currentPlayer), BOT_THINK_MS);
            }
            return;
          }
        }
      } else {
        // No sets - check if player wins the match based on legs
        const legsNeeded = gameState.settings.gameFormat === 'bestOf' 
          ? Math.ceil(gameState.settings.legsToWin / 2) 
          : gameState.settings.legsToWin;
          
        if (player.legsWon >= legsNeeded) {
          // Game over - player wins
          resetLeg(); // Reset scores for display purposes
          io.emit('gameWon', { winner: player });
          return;
        }
      }
      
      resetLeg();
      // Broadcast updated state after leg reset
      io.emit('gameState', gameState);
      
      // Check if the new starting player is a bot and make them throw
      const newStartingPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
      if (newStartingPlayer && newStartingPlayer.isBot) {
        setTimeout(() => makeBotThrow(gameState.currentPlayer), BOT_THINK_MS);
      }
      return;
    }
    
    // Update score (only for valid, non-bust throws)
    player.score = newScore;

    // Calculate average
    updatePlayerAverage(player);
    
    // Move to next player
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    
    // Broadcast updated state
    io.emit('gameState', gameState);
    
    // If next player is a bot, make them throw
    const nextPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
    if (nextPlayer && nextPlayer.isBot) {
      setTimeout(() => makeBotThrow(gameState.currentPlayer), BOT_THINK_MS);
    }
  }, BOT_THINK_MS);
}

const PORT = process.env.PORT || 3001;

// Log environment information for debugging
console.log('🌍 Environment Information:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('  RENDER:', process.env.RENDER || 'undefined');
console.log('  PORT:', PORT);
console.log('  __dirname:', __dirname);
console.log('  dist path:', path.join(__dirname, '../dist'));

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Access the app at: http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
});
