import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import Scoreboard from './components/Scoreboard';
import MobileInput from './components/MobileInput';
import GameSettings from './components/GameSettings';
import ConnectionStatus from './components/ConnectionStatus';
import { GameSettings as GameSettingsType } from './types/game';

function App() {
  const [viewMode, setViewMode] = useState<'settings' | 'scoreboard' | 'mobile'>('settings');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const { gameState, connected, submitScore, undoLastThrow, resetGame, startGame, updatePlayerName, startGameWithSettings } = useSocket();

  // Add a timeout for loading state to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!gameState) {
        console.warn('Game state not loaded after 10 seconds, showing fallback');
        setLoadingTimeout(true);
      }
    }, 10000);

    if (gameState) {
      setLoadingTimeout(false);
      clearTimeout(timer);
    }

    return () => clearTimeout(timer);
  }, [gameState]);

  useEffect(() => {
    // Only auto-detect view mode after game has started
    if (gameState?.gameStarted) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isSmallScreen = window.innerWidth <= 768;
      
      if (isMobile || isSmallScreen) {
        setViewMode('mobile');
      } else {
        setViewMode('scoreboard');
      }
    }
  }, [gameState?.gameStarted]);

  const handleStartGame = (settings: GameSettingsType) => {
    startGameWithSettings(settings);
    // Auto-detect view mode after starting game
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth <= 768;
    
    if (isMobile || isSmallScreen) {
      setViewMode('mobile');
    } else {
      setViewMode('scoreboard');
    }
  };

  if (!gameState && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-dart-dark flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-dart-gold mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-white mb-4">Loading Dart Scorer...</h2>
          <div className="text-sm text-gray-300 mb-4">
            Connection Status: {connected ? '✅ Connected' : '❌ Connecting...'}
          </div>
          <div className="text-xs text-gray-400">
            If this takes too long, please check your internet connection and refresh the page.
          </div>
        </div>
      </div>
    );
  }

  // Fallback when loading times out
  if (!gameState && loadingTimeout) {
    return (
      <div className="min-h-screen bg-dart-dark flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-400 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-semibold text-white mb-4">Connection Issue</h2>
          <p className="text-gray-300 mb-6">
            Unable to connect to the game server. This might be due to network issues or server maintenance.
          </p>
          <div className="text-sm text-gray-400 mb-6">
            Connection Status: {connected ? '✅ Connected' : '❌ Disconnected'}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-dart-gold text-dart-dark px-6 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  // Show settings if game hasn't started
  if (!gameState.gameStarted) {
    return (
      <div className="min-h-screen bg-dart-dark">
        <ConnectionStatus connected={connected} />
        <GameSettings onStartGame={handleStartGame} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dart-dark">
      <ConnectionStatus connected={connected} />
      
      {/* View Mode Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <div className="bg-gray-800 rounded-lg p-2 flex gap-2">
          <button
            onClick={() => setViewMode('scoreboard')}
            className={`px-4 py-2 rounded ${
              viewMode === 'scoreboard' 
                ? 'bg-dart-gold text-dart-dark' 
                : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            📺 Scoreboard
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`px-4 py-2 rounded ${
              viewMode === 'mobile' 
                ? 'bg-dart-gold text-dart-dark' 
                : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            📱 Mobile
          </button>
          <button
            onClick={() => setViewMode('settings')}
            className={`px-4 py-2 rounded ${
              viewMode === 'settings' 
                ? 'bg-dart-gold text-dart-dark' 
                : 'bg-gray-600 text-white hover:bg-gray-500'
            }`}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>

      {viewMode === 'settings' ? (
        <GameSettings onStartGame={handleStartGame} />
      ) : viewMode === 'scoreboard' ? (
        <Scoreboard 
          gameState={gameState}
          onResetGame={resetGame}
          onStartGame={startGame}
          onUpdatePlayerName={updatePlayerName}
        />
      ) : (
        <MobileInput 
          gameState={gameState}
          onSubmitScore={submitScore}
          onUndoLastThrow={undoLastThrow}
        />
      )}
    </div>
  );
}

export default App;