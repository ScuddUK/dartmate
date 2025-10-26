import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import Scoreboard from './components/Scoreboard';
import MobileInput from './components/MobileInput';
import GameSettings from './components/GameSettings';
import ConnectionStatus from './components/ConnectionStatus';
import HamburgerMenu from './components/HamburgerMenu';
import { GameSettings as GameSettingsType } from './types/game';

function App() {
  console.log('🎯 App component initializing...');
  const [viewMode, setViewMode] = useState<'settings' | 'scoreboard' | 'mobile'>('settings');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const { gameState, connected, submitScore, undoLastThrow, resetGame, startGame, updatePlayerName, startGameWithSettings } = useSocket();
  
  console.log('📊 App state:', { gameState: !!gameState, connected, viewMode, loadingTimeout });

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
      
      {/* Hamburger Menu */}
      <HamburgerMenu viewMode={viewMode} onViewModeChange={setViewMode} />

      {viewMode === 'settings' ? (
        <GameSettings onStartGame={handleStartGame} />
      ) : viewMode === 'scoreboard' ? (
        <Scoreboard 
          gameState={gameState}
          onResetGame={resetGame}
          onStartGame={startGame}
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