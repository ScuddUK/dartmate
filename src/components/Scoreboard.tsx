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
        <div key={i} className={`text-center ${isLandscape ? 'mb-1' : 'mb-4'}`}>
          <div className={`font-bold flex items-center justify-center ${
            isLandscape ? 'text-sm gap-1' : 'text-3xl lg:text-5xl xl:text-6xl gap-6 lg:gap-7'
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
                className={`${isLandscape ? 'text-sm' : 'text-3xl lg:text-5xl xl:text-6xl'}`}
                style={{ color: 'var(--color-primary)' }}
              >•</span>
            </div>
            <span className={`text-gray-300 flex items-center ${
              isLandscape ? 'gap-1 text-sm' : 'gap-4 lg:gap-5 text-3xl lg:text-5xl xl:text-6xl'
            }`}>
              <span className={`font-score line-through opacity-60 ${isLandscape ? 'min-w-[30px]' : 'min-w-[60px] lg:min-w-[80px]'}`}>{previousTotal}</span>
              <span 
                className={`${isLandscape ? 'mx-1' : 'mx-2'}`}
                style={{ color: 'var(--color-primary)' }}
              >→</span>
              <span className={`font-score font-bold text-white ${
                isLandscape ? 'min-w-[30px] text-sm' : 'min-w-[60px] lg:min-w-[80px] text-4xl lg:text-6xl xl:text-7xl'
              }`}>{newTotal}</span>
            </span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen p-4 text-white">
      {/* Game Info */}
      {gameState.settings && (
        <div className={`text-center ${isLandscape ? 'mb-3' : 'mb-6'}`}>
          <div className={`text-gray-400 ${isLandscape ? 'text-sm' : 'text-xl lg:text-2xl'}`}>
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
                : 'border-gray-600 bg-gray-800 bg-opacity-50'
            }`}
            style={gameState.currentPlayer === player.id ? {
              borderColor: 'var(--color-primary)',
              backgroundColor: 'var(--color-primary-alpha)',
              boxShadow: `0 10px 15px -3px var(--color-primary-alpha), 0 4px 6px -2px var(--color-primary-alpha)`
            } : {}}
          >
            {/* Player Name - No editing functionality */}
            <div className={`text-center ${isLandscape ? 'mb-2' : 'mb-4 lg:mb-6'}`}>
              <h2 className={`font-bold ${
                isLandscape ? 'text-xl' : 'text-3xl lg:text-5xl xl:text-6xl'
              }`}
              style={{ color: 'var(--color-primary)' }}>
                {player.name}
              </h2>
            </div>

            {/* Current Score */}
            <div className={`text-center ${isLandscape ? 'mb-3' : 'mb-6 lg:mb-8'}`}>
              <div 
                className={`font-main-score font-bold ${
                  isLandscape ? 'text-4xl mb-1' : 'text-6xl lg:text-8xl xl:text-9xl mb-2'
                }`}
                style={{ color: 'var(--color-primary)' }}
              >
                {player.score}
              </div>
              <div className={`text-gray-300 ${
                isLandscape ? 'text-xs' : 'text-lg lg:text-2xl xl:text-3xl'
              }`}>
                Remaining Score
              </div>
            </div>

            {/* Stats Row */}
            <div className={`grid ${gameState.settings?.setsEnabled ? 'grid-cols-3' : 'grid-cols-2'} ${
              isLandscape ? 'gap-2 mb-2' : 'gap-4 lg:gap-6 mb-4 lg:mb-6'
            }`}>
              {gameState.settings?.setsEnabled && (
                <div className="text-center">
                  <div className={`font-score font-bold text-purple-400 ${
                  isLandscape ? 'text-lg' : 'text-2xl lg:text-4xl xl:text-5xl'
                }`}>
                  {player.setsWon || 0}
                </div>
                  <div className={`text-gray-400 ${
                    isLandscape ? 'text-xs' : 'text-sm lg:text-lg xl:text-xl'
                  }`}>Sets Won</div>
                </div>
              )}
              <div className="text-center">
                <div className={`font-score font-bold text-green-400 ${
                  isLandscape ? 'text-lg' : 'text-2xl lg:text-4xl xl:text-5xl'
                }`}>
                  {player.legsWon}
                </div>
                <div className={`text-gray-400 ${
                  isLandscape ? 'text-xs' : 'text-sm lg:text-lg xl:text-xl'
                }`}>Legs Won</div>
              </div>
              <div className="text-center">
                <div className={`font-score font-bold text-blue-400 ${
                  isLandscape ? 'text-lg' : 'text-2xl lg:text-4xl xl:text-5xl'
                }`}>
                  {player.averageScore.toFixed(1)}
                </div>
                <div className={`text-gray-400 ${
                  isLandscape ? 'text-xs' : 'text-sm lg:text-lg xl:text-xl'
                }`}>Average</div>
              </div>
            </div>

            {/* Recent Throws - Flexible height */}
            <div className={`border-t border-gray-600 flex-1 flex flex-col ${
              isLandscape ? 'pt-2' : 'pt-4'
            }`}>
              <div className={`font-semibold text-gray-300 text-center ${
                isLandscape ? 'text-sm mb-2' : 'text-xl lg:text-2xl xl:text-3xl mb-4'
              }`}>Recent Throws</div>
              <div className="flex-1 overflow-y-auto">
                  {player.throws.length > 0 ? (
                    <div className={isLandscape ? 'space-y-0' : 'space-y-2'}>
                      {formatThrowHistory(player.throws)}
                    </div>
                  ) : (
                    <div className={`text-center text-gray-500 italic ${
                      isLandscape ? 'text-sm py-4' : 'text-lg lg:text-2xl py-8'
                    }`}>
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