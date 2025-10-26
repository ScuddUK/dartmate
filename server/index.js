import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Simple DartBot implementation for server
class SimpleDartBot {
  constructor(skillLevel) {
    this.skillLevel = skillLevel;
    this.averageScore = 20 + (skillLevel - 1) * 10; // 20-110 range
    this.accuracy = Math.min(0.3 + (skillLevel - 1) * 0.07, 0.95); // 30% to 95%
  }

  generateThrow(targetScore = null, isFinishingAttempt = false) {
    // Simple scoring algorithm
    const random = Math.random();
    
    // Miss chance (decreases with skill)
    const missChance = Math.max(0.05, 0.25 - (this.skillLevel - 1) * 0.02);
    if (random < missChance) {
      return 0;
    }

    // If trying to finish with a double
    if (isFinishingAttempt && targetScore && targetScore <= 40 && targetScore % 2 === 0) {
      const doubleAccuracy = Math.min(0.1 + (this.skillLevel - 1) * 0.05, 0.6);
      if (Math.random() < doubleAccuracy) {
        return targetScore; // Hit the double to finish
      }
    }

    // Generate a score based on skill level
    const baseScore = Math.floor(Math.random() * 60) + 1; // 1-60
    const skillBonus = Math.floor(Math.random() * (this.skillLevel * 10)); // 0 to skillLevel*10
    const totalScore = Math.min(baseScore + skillBonus, 180);
    
    // Ensure we don't go below 0 or create impossible finishes
    if (targetScore && totalScore > targetScore) {
      return Math.floor(Math.random() * Math.min(targetScore, 60)) + 1;
    }
    
    return totalScore;
  }

  generateTurn(currentScore) {
    const throws = [];
    let remainingScore = currentScore;
    const numThrows = Math.floor(Math.random() * 3) + 1; // 1-3 throws

    for (let i = 0; i < numThrows; i++) {
      const isFinishingAttempt = remainingScore <= 170 && remainingScore > 1;
      const throwScore = this.generateThrow(remainingScore, isFinishingAttempt);
      
      // Check for bust conditions
      if (remainingScore - throwScore < 0 || 
          (remainingScore - throwScore === 1) ||
          (remainingScore - throwScore === 0 && remainingScore > 50)) {
        // Bust or invalid finish - stop throwing
        break;
      }

      throws.push({
        score: throwScore,
        timestamp: Date.now() + i
      });

      remainingScore -= throwScore;

      // Game finished
      if (remainingScore === 0) {
        break;
      }
    }

    // Calculate total score for this turn
    const totalTurnScore = throws.reduce((sum, throw_) => sum + throw_.score, 0);
    return totalTurnScore;
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
}

// Game state
let gameState = {
  players: [
    { id: 1, name: 'Player 1', score: 501, legsWon: 0, setsWon: 0, throws: [], averageScore: 0, isBot: false },
    { id: 2, name: 'Player 2', score: 501, legsWon: 0, setsWon: 0, throws: [], averageScore: 0, isBot: false }
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

// DartBot instances
let dartBotInstances = {
  1: null,
  2: null
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  console.log('Current game state:', JSON.stringify(gameState, null, 2));
  
  // Send current game state to new client
  socket.emit('gameState', gameState);

  // Handle explicit game state requests
  socket.on('requestGameState', () => {
    console.log('Game state requested by:', socket.id);
    socket.emit('gameState', gameState);
  });
  
  // Handle starting a new game with settings
  socket.on('startGameWithSettings', (settings) => {
    gameState.settings = settings;
    gameState.players[0].name = settings.playerNames[0];
    gameState.players[1].name = settings.playerNames[1];
    gameState.players[0].score = settings.startingScore;
    gameState.players[1].score = settings.startingScore;
    gameState.players[0].legsWon = 0;
    gameState.players[1].legsWon = 0;
    gameState.players[0].setsWon = 0;
    gameState.players[1].setsWon = 0;
    gameState.players[0].throws = [];
    gameState.players[1].throws = [];
    gameState.players[0].averageScore = 0;
    gameState.players[1].averageScore = 0;
    gameState.players[0].isBot = false;
    gameState.players[1].isBot = settings.dartBot?.enabled || false;
    gameState.players[0].botSkillLevel = undefined;
    gameState.players[1].botSkillLevel = settings.dartBot?.enabled ? settings.dartBot.skillLevel : undefined;
    gameState.currentPlayer = 1;
    gameState.gameMode = settings.startingScore.toString();
    gameState.gameStarted = true; // Start the game
    gameState.throwHistory = [];
    gameState.currentLeg = 1;
    gameState.currentSet = 1;
    gameState.legStartingPlayer = 1; // Default, but will be overridden by player selection
    
    io.emit('gameState', gameState);
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
        dartBotInstances[2] = new SimpleDartBot(gameState.settings.dartBot.skillLevel);
        console.log(`DartBot initialized with skill level ${gameState.settings.dartBot.skillLevel}`);
      } else {
        dartBotInstances[2] = null;
      }
      
      console.log(`🎯 Starting player manually set to: Player ${playerId} and starting the game`);
      io.emit('gameState', gameState);
      
      // If DartBot is the starting player and it's their turn, make them throw immediately
      if (gameState.currentPlayer === 1 && gameState.players[0].isBot) {
        setTimeout(() => makeBotThrow(1), 1000);
      } else if (gameState.currentPlayer === 2 && gameState.players[1].isBot) {
        setTimeout(() => makeBotThrow(2), 1000);
      }
    }
  });
  
  // Handle score submission
  socket.on('submitScore', (data) => {
    const { score, playerId } = data;
    const player = gameState.players.find(p => p.id === playerId);
    
    if (player && score >= 0 && score <= 180) {
      // Check if this would be a bust before recording anything
      const newScore = player.score - score;
      
      if (newScore < 0) {
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
          setTimeout(() => makeBotThrow(gameState.currentPlayer), 1000);
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
                setTimeout(() => makeBotThrow(gameState.currentPlayer), 1000);
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
          setTimeout(() => makeBotThrow(gameState.currentPlayer), 1000);
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
      if (nextPlayer && nextPlayer.isBot) {
        setTimeout(() => makeBotThrow(gameState.currentPlayer), 1000);
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
    gameState.players.forEach(player => {
      player.score = 501;
      player.legsWon = 0;
      player.throws = [];
      player.averageScore = 0;
    });
    gameState.currentPlayer = 1;
    gameState.gameStarted = false;
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
  
  if (!player || !player.isBot || !botInstance || gameState.currentPlayer !== playerId) {
    return;
  }
  
  console.log(`DartBot (Player ${playerId}) is throwing...`);
  
  // Generate bot turn score
  const turnScore = botInstance.generateTurn(player.score);
  
  // Simulate the throw with a delay for realism
  setTimeout(() => {
    // Check if this would be a bust before recording anything
    const newScore = player.score - turnScore;
    
    if (newScore < 0 || newScore === 1) {
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
        setTimeout(() => makeBotThrow(gameState.currentPlayer), 2000);
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
              setTimeout(() => makeBotThrow(gameState.currentPlayer), 1000);
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
        setTimeout(() => makeBotThrow(gameState.currentPlayer), 1000);
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
      setTimeout(() => makeBotThrow(gameState.currentPlayer), 1000);
    }
  }, 1500); // 1.5 second delay to simulate thinking/throwing time
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