import React, { useState, useEffect } from 'react';
import { useSocket } from './hooks/useSocket';
import Scoreboard from './components/Scoreboard';
import MobileInput from './components/MobileInput';
import GameSettings from './components/GameSettings';
import MainMenu from './components/MainMenu';
import PairCodeModal from './components/PairCodeModal';
import JoinCodeModal from './components/JoinCodeModal';
import ConnectionStatus from './components/ConnectionStatus';
import HamburgerMenu from './components/HamburgerMenu';
import { VictoryScreen } from './components/VictoryScreen';
import { MobilePostMatch } from './components/MobilePostMatch';
import { LegStartPopup } from './components/LegStartPopup';
import { GameSettings as GameSettingsType } from './types/game';
import { ThemeProvider } from './contexts/ThemeContext';

function AppContent() {
  console.log('🎯 App component initializing...');
  const [viewMode, setViewMode] = useState<'menu' | 'settings' | 'scoreboard' | 'mobile'>('menu');
  const [showPairCodeModal, setShowPairCodeModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showLegStartPopup, setShowLegStartPopup] = useState(false);
  const [lastLegNumber, setLastLegNumber] = useState(1);
  const { gameState, connected, submitScore, undoLastThrow, resetGame, startGame, updatePlayerName, startGameWithSettings, applySettingsAndRestart, setStartingPlayer, pairCode, masterCode, joinSession, sessionError, sessionCode, connectionStatus, requestGameState } = useSocket();
  // connectionStatus is provided by the socket hook; used to auto-close pairing modal
  
  console.log('📊 App state:', { gameState: !!gameState, connected, viewMode, sessionCode });

  // Add a timeout for loading state to prevent infinite loading
  // Show pair code modal when received
  useEffect(() => {
    if (pairCode) {
      console.log('📨 Pair code available in App, opening modal');
      setShowPairCodeModal(true);
    }
  }, [pairCode]);

  useEffect(() => {
    // Auto switch to mobile input after join
    if (sessionCode && viewMode === 'menu') {
      setViewMode('mobile');
    }
  }, [sessionCode, viewMode]);

  // If scoreboard is visible but no game state yet, request it
  useEffect(() => {
    if (viewMode === 'scoreboard' && !gameState) {
      requestGameState();
    }
  }, [viewMode, gameState]);

  // Close PairCodeModal automatically when a client joins the session
  useEffect(() => {
    if (connectionStatus?.status === 'client_joined' && showPairCodeModal) {
      setShowPairCodeModal(false);
    }
  }, [connectionStatus, showPairCodeModal]);

  // Show starting player selection on mobile after pairing, before any throws
  const [startPending, setStartPending] = useState(false);

  useEffect(() => {
    if (
      viewMode === 'mobile' &&
      gameState &&
      !gameState.gameStarted &&
      sessionCode &&
      !showLegStartPopup &&
      !startPending
    ) {
      setShowLegStartPopup(true);
    }
  }, [viewMode, gameState?.gameStarted, sessionCode, showLegStartPopup, startPending]);

  // Clear pending flag once the server confirms the game has started
  useEffect(() => {
    if (gameState?.gameStarted) {
      setStartPending(false);
    }
  }, [gameState?.gameStarted]);

  const handleStartGame = (settings: GameSettingsType) => {
    // Apply settings and restart if paired; otherwise start new game/session
    applySettingsAndRestart(settings);
    // Preserve view context: paired mobile stays mobile; otherwise go to scoreboard
    if (sessionCode) {
      setViewMode('mobile');
    } else {
      setViewMode('scoreboard');
      // Proactively request game state so the scoreboard doesn't hang
      requestGameState();
    }
  };

  const handleRestartMatch = () => {
    // Only reset; scoreboard or mobile will explicitly start next match to avoid loops
    resetGame();
  };

  const handleChangeSettingsFromMobile = () => {
    setViewMode('settings');
  };

  const handlePlayerSelected = (playerId: number) => {
    setStartPending(true);
    setStartingPlayer(playerId);
    setShowLegStartPopup(false);
  };

  // Show main menu when not in a session yet
  if (viewMode === 'menu') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <ConnectionStatus connected={connected} />
        <MainMenu
          onScoreboard={() => setViewMode('settings')}
          onMobileScorer={() => setShowJoinModal(true)}
        />
        {showJoinModal && (
          <JoinCodeModal
            onSubmit={(code) => {
              joinSession(code);
              setShowJoinModal(false);
            }}
            onCancel={() => setShowJoinModal(false)}
            error={sessionError || undefined}
          />
        )}
      </div>
    );
  }

  // Show victory screen if game is won
  if (gameState && gameState.gameWon && gameState.winner) {
    if (viewMode === 'scoreboard') {
      return (
        <VictoryScreen 
          gameState={gameState}
        />
      );
    }
    // Mobile post-match controls
    const winner = gameState.winner;
    const winnerAvg = typeof winner.matchAverageScore === 'number' && winner.matchAverageScore > 0
      ? winner.matchAverageScore
      : (() => {
          const validThrows = (winner.throws || []).filter(t => typeof t.score === 'number');
          if (!validThrows.length) return 0;
          const total = validThrows.reduce((sum, t) => sum + (t.score as number), 0);
          return total / validThrows.length;
        })();
    return (
      <MobilePostMatch
        winnerName={winner.name}
        winnerAverage={winnerAvg}
        onRestart={handleRestartMatch}
        onChangeSettings={handleChangeSettingsFromMobile}
      />
    );
  }

  // Show settings whenever requested
  if (viewMode === 'settings') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        <ConnectionStatus connected={connected} />
        {/* Back arrow to Main Menu */}
        <div className="fixed top-4 left-4 z-50">
          <button
            onClick={() => setViewMode('menu')}
            className="px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-background)' }}
            aria-label="Back to Main Menu"
          >
            ← Back
          </button>
        </div>
        <GameSettings onStartGame={handleStartGame} />
        {showPairCodeModal && pairCode && (
          <PairCodeModal 
            code={pairCode} 
            onClose={() => {
              setShowPairCodeModal(false);
              // Keep current view; starter selection happens on mobile after game starts
            }} 
          />
        )}
        {sessionError && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow">{sessionError}</div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <ConnectionStatus connected={connected} />
      
      {/* Hamburger Menu */}
      <HamburgerMenu viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* Pair code badge (top-left) remains visible on scoreboard */}
      {viewMode === 'scoreboard' && pairCode && (
        <div className="fixed top-4 left-4 z-50 px-3 py-2 rounded-lg shadow" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
          Pair Code: <span className="font-mono font-bold">{pairCode}</span>
        </div>
      )}

      {viewMode === 'scoreboard' ? (
        gameState ? (
          <Scoreboard 
            gameState={gameState}
            onResetGame={resetGame}
            onStartGame={startGame}
          />
        ) : (
          <div className="text-center p-8" style={{ color: 'var(--color-text)' }}>Preparing game…</div>
        )
      ) : (
        gameState ? (
          <MobileInput 
            gameState={gameState}
            onSubmitScore={submitScore}
            onUndoLastThrow={undoLastThrow}
          />
        ) : (
          <div className="text-center p-8" style={{ color: 'var(--color-text)' }}>Waiting to join session…</div>
        )
      )}

      {/* Leg Start Popup on mobile only */}
      {viewMode === 'mobile' && gameState && (
        <LegStartPopup
          gameState={gameState}
          isVisible={showLegStartPopup}
          onClose={() => setShowLegStartPopup(false)}
          onPlayerSelected={handlePlayerSelected}
        />
      )}

      {/* Pair Code Modal should also be available in non-settings views */}
      {showPairCodeModal && pairCode && (
        <PairCodeModal 
          code={pairCode} 
          onClose={() => {
            setShowPairCodeModal(false);
            // Starter selection now occurs on mobile after game start
          }} 
        />
      )}
      {sessionError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow">{sessionError}</div>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;