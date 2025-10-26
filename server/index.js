import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  // Handle React Router - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Game state
let gameState = {
  players: [
    { id: 1, name: 'Player 1', score: 501, legsWon: 0, setsWon: 0, throws: [], averageScore: 0 },
    { id: 2, name: 'Player 2', score: 501, legsWon: 0, setsWon: 0, throws: [], averageScore: 0 }
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
    playerNames: ['Player 1', 'Player 2']
  },
  currentLeg: 1,
  currentSet: 1
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
    gameState.currentPlayer = 1;
    gameState.gameMode = settings.startingScore.toString();
    gameState.gameStarted = true;
    gameState.throwHistory = [];
    gameState.currentLeg = 1;
    gameState.currentSet = 1;
    
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
  
  // Handle score submission
  socket.on('submitScore', (data) => {
    const { score, playerId } = data;
    const player = gameState.players.find(p => p.id === playerId);
    
    if (player && score >= 0 && score <= 180) {
      // Add to throw history
      player.throws.push({
        score,
        timestamp: new Date(),
        remainingScore: player.score - score
      });
      
      // Keep only last 10 throws
      if (player.throws.length > 10) {
        player.throws = player.throws.slice(-10);
      }
      
      // Update score
      const newScore = player.score - score;
      
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
              io.emit('gameWon', { winner: player });
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
            io.emit('gameWon', { winner: player });
            return;
          }
        }
        
        resetLeg();
      } else if (newScore < 0) {
        // Bust - reset to previous score
        socket.emit('bust', { playerId });
      } else {
        player.score = newScore;
      }
      
      // Calculate average
      updatePlayerAverage(player);
      
      // Move to next player (alternate between player IDs 1 and 2)
      gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
      
      // Broadcast updated state
      io.emit('gameState', gameState);
    }
  });
  
  // Handle undo last throw
  socket.on('undoLastThrow', () => {
    const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);
    if (currentPlayer && currentPlayer.throws.length > 0) {
      const lastThrow = currentPlayer.throws.pop();
      currentPlayer.score = lastThrow.remainingScore + lastThrow.score;
      updatePlayerAverage(currentPlayer);
      // Switch back to previous player
      gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
      io.emit('gameState', gameState);
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
  gameState.currentPlayer = 1;
  gameState.currentLeg++;
}

function updatePlayerAverage(player) {
  if (player.throws.length === 0) {
    player.averageScore = 0;
    return;
  }
  
  const totalScore = player.throws.reduce((sum, throw_) => sum + throw_.score, 0);
  player.averageScore = Math.round((totalScore / player.throws.length) * 100) / 100;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});