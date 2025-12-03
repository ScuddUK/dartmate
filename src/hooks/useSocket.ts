import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, GameSettings } from '../types/game';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [pairCode, setPairCode] = useState<string | null>(null);
  const [masterCode, setMasterCode] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);

  useEffect(() => {
    // Determine the correct server URL based on environment
    const getServerUrl = () => {
      if (typeof window !== 'undefined') {
        // In production, use the same origin as the current page
        if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
          return window.location.origin;
        }
      }
      // In development, use localhost
      return 'http://localhost:3001';
    };

    const serverUrl = getServerUrl();
    console.log('Connecting to server:', serverUrl);
    const newSocket = io(serverUrl, {
      transports: ['websocket'],
      reconnectionAttempts: 6,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      timeout: 8000
    });
    
    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to server successfully');
      // Session-based flow will fetch game state after create/join
    });
    
    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected after', attemptNumber, 'attempts');
      setConnected(true);
      // Auto rejoin on reconnect to maintain session persistence
      if (sessionCode) {
        newSocket.emit('joinSession', { code: sessionCode });
      }
    });
    
    newSocket.on('gameState', (state: GameState) => {
      setGameState(state);
    });

    newSocket.on('pairCode', ({ code, masterCode }) => {
      setPairCode(code);
      setMasterCode(masterCode ?? null);
      setSessionCode(code);
      console.log('✅ Pair code received:', code);
    });

    newSocket.on('pairCodeError', ({ error }) => {
      console.error('Pair code error:', error);
      setSessionError(error);
    });

    newSocket.on('sessionJoined', ({ code }) => {
      setSessionCode(code);
      setSessionError(null);
    });

    newSocket.on('sessionError', ({ error }) => {
      setSessionError(error);
    });

    newSocket.on('connectionStatus', (status) => {
      setConnectionStatus(status);
    });
    
    newSocket.on('gameWon', (data: { winner: Player }) => {
      setGameState(prevState => {
        if (prevState) {
          return {
            ...prevState,
            gameWon: true,
            winner: data.winner
          };
        }
        return prevState;
      });
    });
    
    // Bust should be recorded in history without popups
    newSocket.on('bust', (data) => {
      console.log(`Bust: player ${data.playerId}`);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, []);

  const submitScore = (score: number, playerId: number) => {
    if (socket) {
      if (sessionCode) {
        socket.emit('submitScoreInSession', { code: sessionCode, score, playerId });
      } else {
        // Fallback to legacy behavior
        socket.emit('submitScore', { score, playerId });
      }
    }
  };

  const undoLastThrow = () => {
    if (socket) {
      if (sessionCode) {
        socket.emit('undoLastThrowInSession', { code: sessionCode });
      } else {
        socket.emit('undoLastThrow');
      }
    }
  };

  const resetGame = () => {
    if (socket) {
      if (sessionCode) {
        socket.emit('resetGameInSession', { code: sessionCode });
      } else {
        socket.emit('resetGame');
      }
    }
  };

  const startGame = () => {
    if (socket) {
      socket.emit('startGame');
    }
  };

  const updatePlayerName = (playerId: number, name: string) => {
    if (socket) {
      socket.emit('updatePlayerName', { playerId, name });
    }
  };

  const startGameWithSettings = (settings: GameSettings) => {
    if (socket) {
      console.log('🔧 Starting game with settings:', settings);
      socket.emit('startGameWithSettings', settings);
    }
  };

  // Apply settings mid-match and restart the session or start new if unpaired
  const applySettingsAndRestart = (settings: GameSettings) => {
    if (socket) {
      if (sessionCode) {
        socket.emit('updateSettingsInSession', { code: sessionCode, settings });
      } else {
        // No session yet; start a new game with these settings
        socket.emit('startGameWithSettings', settings);
      }
    }
  };

  const joinSession = (code: string) => {
    if (socket) {
      socket.emit('joinSession', { code });
    }
  };

  const requestPairCode = () => {
    if (socket) {
      console.log('🔁 Requesting pair code re-emit');
      socket.emit('requestPairCode');
    }
  };

  const requestGameState = () => {
    if (socket) {
      socket.emit('requestGameState');
    }
  };

  const setStartingPlayer = (playerId: number) => {
    if (socket) {
      if (sessionCode) {
        socket.emit('setStartingPlayerInSession', { code: sessionCode, playerId });
      } else {
        socket.emit('setStartingPlayer', { playerId });
      }
    }
  };

  return {
    gameState,
    connected,
    sessionCode,
    pairCode,
    masterCode,
    sessionError,
    connectionStatus,
    submitScore,
    undoLastThrow,
    resetGame,
    startGame,
    updatePlayerName,
    startGameWithSettings,
    applySettingsAndRestart,
    setStartingPlayer,
    joinSession,
    requestPairCode
    ,requestGameState
  };
};