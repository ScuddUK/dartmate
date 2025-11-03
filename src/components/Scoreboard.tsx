import React, { useState, useEffect } from 'react';
import { GameState } from '../types/game';
import { useTheme } from '../contexts/ThemeContext';

interface ScoreboardProps {
  gameState: GameState;
  onResetGame: () => void;
  onStartGame: () => void;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ 
  gameState, 
  onResetGame, 
  onStartGame
}) => {
  const { currentTheme } = useTheme();
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Check if device is in landscape mode and is mobile/tablet size
      const isLandscapeOrientation = window.innerHeight < window.innerWidth;
      const isMobileSize = window.innerWidth < 1024; // Below lg breakpoint
      setIsLandscape(isLandscapeOrientation && isMobileSize);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const formatThrowHistory = (throws: any[]) => {
    return throws.slice(-5).map((throwRecord, i) => {
      const previousTotal = i === 0 ? 501 : (501 - throws.slice(0, throws.indexOf(throwRecord)).reduce((sum, t) => {
        return sum + (typeof t.score === 'number' ? t.score : 0);
      }, 0));
      const newTotal = throwRecord.remainingScore;
      const isBust = throwRecord.score === 'bust';
      const isHighScore = typeof throwRecord.score === 'number' && throwRecord.score >= 100;
      
      return (
        <div key={i} className={`text-center ${isLandscape ? 'mb-2' : 'mb-5'}`}>
          <div className={`font-bold flex items-center justify-center ${
            isLandscape ? 'text-lg gap-2' : 'text-4xl lg:text-6xl xl:text-7xl gap-7 lg:gap-8'
          }`}>
            <div className="flex items-center gap-1">
              <span 
                className={`font-score ${isLandscape ? 'min-w-[30px]' : 'min-w-[60px] lg:min-w-[80px]'}`}
                style={{ 
                  color: isBust ? 'var(--color-error)' : isHighScore ? 'var(--color-accent)' : 'var(--color-primary)' 
                }}
              >
                {throwRecord.score}
              </span>
              <span 
                className={`${isLandscape ? 'text-lg' : 'text-4xl lg:text-6xl xl:text-7xl'}`}
                style={{ color: 'var(--color-primary)' }}
              >•</span>
            </div>
            <span className={`flex items-center ${
              isLandscape ? 'gap-2 text-lg' : 'gap-5 lg:gap-6 text-4xl lg:text-6xl xl:text-7xl'
            }`}>
              <span className={`font-score line-through opacity-80 ${isLandscape ? 'min-w-[30px]' : 'min-w-[60px] lg:min-w-[80px]'}`} style={{ color: 'red' }}>{previousTotal}</span>
              <span 
                className={`${isLandscape ? 'mx-2' : 'mx-3'}`}
                style={{ color: 'var(--color-primary)' }}
              >→</span>
              <span className={`font-score font-bold ${
                isLandscape ? 'min-w-[30px] text-base' : 'min-w-[60px] lg:min-w-[80px] text-5xl lg:text-7xl xl:text-8xl'
              }`} style={{ color: 'var(--color-text)' }}>{newTotal}</span>
            </span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen p-4" style={{ backgroundColor: 'var(--color-background)', color: '#000' }}>
      {/* Game Info */}
      {gameState.settings && (
        <div className={`text-center ${isLandscape ? 'mb-3' : 'mb-6'}`}>
          <div className={`${isLandscape ? 'text-sm' : 'text-xl lg:text-2xl'}`} style={{ color: '#333' }}>
            {gameState.settings.setsEnabled ? (
              <div>
                Set {gameState.currentSet || 1} • Leg {gameState.currentLeg || 1} • 
                {gameState.settings.gameFormat === 'bestOf' ? ' Best of ' : ' First to '}
                {gameState.settings.setsToWin} sets ({gameState.settings.legsToWin} legs per set)
              </div>
            ) : (
              <div>
                Leg {gameState.currentLeg || 1} • 
                {gameState.settings.gameFormat === 'bestOf' ? ' Best of ' : ' First to '}
                {gameState.settings.legsToWin} legs
              </div>
            )}
          </div>
        </div>
      )}

      {/* Players Grid - Dynamic scaling based on screen size and orientation */}
      <div className={`grid gap-4 lg:gap-8 h-[calc(100vh-200px)] max-w-full mx-auto ${
        isLandscape ? 'grid-cols-2' : 'grid-cols-1 lg:grid-cols-2'
      }`}>
        {gameState.players.map((player) => (
          <div
            key={player.id}
            className={`dart-display rounded-xl border-4 transition-all duration-300 flex flex-col h-full ${
              isLandscape ? 'p-2' : 'p-4 lg:p-8'
            } ${
              gameState.currentPlayer === player.id
                ? 'bg-opacity-10 shadow-lg'
                : ''
            }`}
            style={gameState.currentPlayer === player.id ? {
              borderColor: '#b7e4c7',
              backgroundColor: 'var(--color-primary-alpha)',
              boxShadow: `0 10px 15px -3px var(--color-primary-alpha), 0 4px 6px -2px var(--color-primary-alpha)`
            } : { borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
          >
            {/* Player Name - No editing functionality */}
            <div className={`text-center ${isLandscape ? 'mb-2' : 'mb-4 lg:mb-6'}`}>
              <h2 className={`font-bold ${
                isLandscape ? 'text-xl' : 'text-3xl lg:text-5xl xl:text-6xl'
              }`}
              style={{ color: '#000' }}>
                {player.name}
              </h2>
            </div>

            {/* Current Score */}
            <div className={`text-center ${isLandscape ? 'mb-3' : 'mb-6 lg:mb-8'}`}>
              <div 
                className={`font-main-score font-bold ${
                  isLandscape ? 'text-6xl mb-1' : 'text-7xl lg:text-9xl xl:text-9xl mb-2'
                }`}
                style={{ color: '#000' }}
              >
                {player.score}
              </div>
              <div className={`${
                isLandscape ? 'text-xs' : 'text-lg lg:text-2xl xl:text-3xl'
              }`} style={{ color: '#333' }}>
                Remaining Score
              </div>
            </div>

            {/* Stats Row */}
            <div className={`grid ${gameState.settings?.setsEnabled ? 'grid-cols-3' : 'grid-cols-2'} ${
              isLandscape ? 'gap-2 mb-2' : 'gap-4 lg:gap-6 mb-4 lg:mb-6'
            }`}>
              {gameState.settings?.setsEnabled && (
                <div className="text-center">
                  <div className={`font-score font-bold ${
                  isLandscape ? 'text-xl' : 'text-3xl lg:text-5xl xl:text-6xl'
                }`} style={{ color: '#000' }}>
                  {player.setsWon || 0}
                </div>
                  <div className={`${
                    isLandscape ? 'text-xs' : 'text-sm lg:text-lg xl:text-xl'
                  }`} style={{ color: '#333' }}>Sets Won</div>
                </div>
              )}
              <div className="text-center">
                <div className={`font-score font-bold ${
                  isLandscape ? 'text-xl' : 'text-3xl lg:text-5xl xl:text-6xl'
                }`} style={{ color: '#000' }}>
                  {player.legsWon}
                </div>
                <div className={`${
                  isLandscape ? 'text-xs' : 'text-sm lg:text-lg xl:text-xl'
                }`} style={{ color: '#333' }}>Legs Won</div>
              </div>
              <div className="text-center">
                <div className={`font-score font-bold ${
                  isLandscape ? 'text-xl' : 'text-3xl lg:text-5xl xl:text-6xl'
                }`} style={{ color: '#000' }}>
                  {player.averageScore.toFixed(1)}
                </div>
                <div className={`${
                  isLandscape ? 'text-xs' : 'text-sm lg:text-lg xl:text-xl'
                }`} style={{ color: '#333' }}>Average</div>
              </div>
            </div>

            {/* Recent Throws - Flexible height */}
            <div className={`flex-1 flex flex-col ${
              isLandscape ? 'pt-2' : 'pt-4'
            }`} style={{ borderTop: '1px solid var(--color-border)' }}>
              <div className={`font-semibold text-center ${
                isLandscape ? 'text-base mb-2' : 'text-2xl lg:text-3xl xl:text-4xl mb-4'
              }`} style={{ color: '#333' }}>Recent Throws</div>
              <div className="flex-1 overflow-y-auto">
                  {player.throws.length > 0 ? (
                    <div className={isLandscape ? 'space-y-0' : 'space-y-2'}>
                      {formatThrowHistory(player.throws)}
                    </div>
                  ) : (
                    <div className={`text-center italic ${
                      isLandscape ? 'text-base py-4' : 'text-xl lg:text-3xl py-8'
                    }`} style={{ color: 'var(--color-text-secondary)' }}>
                      No throws yet
                    </div>
                 )}
                </div>
              </div>


          </div>
        ))}
      </div>


    </div>
  );
};

export default Scoreboard;