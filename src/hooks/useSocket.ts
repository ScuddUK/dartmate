import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { GameState, GameSettings } from '../types/game';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    
    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Connected to server');
    });
    
    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Disconnected from server');
    });
    
    newSocket.on('gameState', (state: GameState) => {
      setGameState(state);
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