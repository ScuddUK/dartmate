import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, GameSettings } from '../types/game';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);

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
    const newSocket = io(serverUrl);
    
    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to server successfully');
      // Request initial game state
      newSocket.emit('requestGameState');
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
    });
    
    newSocket.on('gameState', (state: GameState) => {
      setGameState(state);
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
    
    newSocket.on('bust', (data) => {
      alert(`Player ${data.playerId} went bust!`);
    });
    
    setSocket(newSocket);
    
    return () => {
      newSocket.close();
    };
  }, []);

  const submitScore = (score: number, playerId: number) => {
    if (socket) {
      socket.emit('submitScore', { score, playerId });
    }
  };

  const undoLastThrow = () => {
    if (socket) {
      socket.emit('undoLastThrow');
    }
  };

  const resetGame = () => {
    if (socket) {
      socket.emit('resetGame');
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
      socket.emit('startGameWithSettings', settings);
    }
  };

  return {
    gameState,
    connected,
    submitScore,
    undoLastThrow,
    resetGame,
    startGame,
    updatePlayerName,
    startGameWithSettings
  };
};