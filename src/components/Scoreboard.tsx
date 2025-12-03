import React, { useState, useEffect, useRef } from 'react';
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
  // Dynamic font sizing for recent throws per player
  const player1HistoryRef = useRef<HTMLDivElement | null>(null);
  const player2HistoryRef = useRef<HTMLDivElement | null>(null);
  const [historyFontSizes, setHistoryFontSizes] = useState<{ [key: number]: number }>({ 1: 18, 2: 18 });

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

  // Calculate dynamic font sizes to fit 5 lines in the history area
  useEffect(() => {
    const rafRef = { current: 0 } as React.MutableRefObject<number>;
    const updateFontSizes = () => {
      const calcSize = (el: HTMLDivElement | null) => {
        if (!el) return 18;
        const h = el.clientHeight;
        if (!h || h < 100) return 18;
        // Fit exactly five lines with a small padding buffer
        const size = Math.floor(h / 5) - 2;
        return Math.max(18, Math.min(size, 96));
      };
      const applySizes = () => {
        const nextSizes = {
          1: calcSize(player1HistoryRef.current),
          2: calcSize(player2HistoryRef.current)
        };
        setHistoryFontSizes(prev => (
          Math.abs(prev[1] - nextSizes[1]) > 0.5 || Math.abs(prev[2] - nextSizes[2]) > 0.5
            ? nextSizes
            : prev
        ));
      };
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(applySizes);
    };

    updateFontSizes();
    const observers: ResizeObserver[] = [];
    [player1HistoryRef.current, player2HistoryRef.current].forEach(el => {
      if (el) {
        const ro = new ResizeObserver(() => updateFontSizes());
        ro.observe(el);
        observers.push(ro);
      }
    });
    window.addEventListener('resize', updateFontSizes);
    window.addEventListener('orientationchange', updateFontSizes);
    return () => {
      window.removeEventListener('resize', updateFontSizes);
      window.removeEventListener('orientationchange', updateFontSizes);
      observers.forEach(o => o.disconnect());
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const formatThrowHistory = (throws: any[], lineFontSize: number) => {
    const recent = throws.slice(-5);
    const rows = [...recent];
    while (rows.length < 5) rows.push(null);
    return rows.map((throwRecord, i) => {
      if (!throwRecord) {
        return (
          <div
            key={`empty-${i}`}
            className={`text-center mb-0`}
            style={{
              fontSize: `${lineFontSize}px`,
              lineHeight: 1.0
            }}
          >
            <div className="flex items-center justify-center">
              <span className="font-score opacity-40" style={{ color: 'var(--color-text)' }}>{'\u00A0'}</span>
            </div>
          </div>
        );
      }
      const previousTotal = i === 0 ? 501 : (501 - throws.slice(0, throws.indexOf(throwRecord)).reduce((sum, t) => {
        return sum + (typeof t.score === 'number' ? t.score : 0);
      }, 0));
      const newTotal = throwRecord.remainingScore;
      const isBust = throwRecord.score === 'bust';
      const displayScore = typeof throwRecord.score === 'string'
        ? throwRecord.score.toUpperCase()
        : throwRecord.score;
      const isHighScore = typeof throwRecord.score === 'number' && throwRecord.score >= 100;
      
      return (
        <div
          key={i}
          className={`text-center mb-0`}
          style={{
            fontSize: `${lineFontSize}px`,
            lineHeight: 1.0
          }}
        >
          <div className={`font-bold flex items-center justify-center ${
            isLandscape ? 'gap-2' : 'gap-3 lg:gap-4'
          }`}>
            <div className="flex items-center gap-1">
              <span 
                className={`font-score ${isLandscape ? 'min-w-[30px]' : 'min-w-[40px] lg:min-w-[60px]'}`}
                style={{ 
                  color: isBust ? 'var(--color-error)' : isHighScore ? 'var(--color-accent)' : 'var(--color-primary)' 
                }}
              >
                {displayScore}
              </span>
              <span 
                className={`${isLandscape ? '' : ''}`}
                style={{ color: 'var(--color-primary)' }}
              >•</span>
            </div>
            <span className={`flex items-center ${
              isLandscape ? 'gap-2' : 'gap-3 lg:gap-4'
            }`}>
              <span className={`font-score line-through opacity-80 ${isLandscape ? 'min-w-[30px]' : 'min-w-[40px] lg:min-w-[60px]'}`} style={{ color: 'red' }}>{previousTotal}</span>
              <span 
                className={`${isLandscape ? 'mx-2' : 'mx-2'}`}
                style={{ color: 'var(--color-primary)' }}
              >→</span>
              <span className={`font-score font-bold ${
                isLandscape ? 'min-w-[30px]' : 'min-w-[40px] lg:min-w-[60px]'
              }`} style={{ color: 'var(--color-text)', fontSize: `${Math.max(lineFontSize * 0.9, 14)}px` }}>{newTotal}</span>
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
                  isLandscape ? 'text-7xl mb-1' : 'text-9xl lg:text-[12rem] xl:text-[14rem] mb-2'
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
              <div
                className="flex-1 overflow-y-hidden"
                ref={player.id === 1 ? player1HistoryRef : player2HistoryRef}
                style={{ height: '100%' }}
              >
                  {player.throws.length > 0 ? (
                    <div className={'grid grid-rows-5 h-full'}>
                      {formatThrowHistory(player.throws, historyFontSizes[player.id] || 18)}
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