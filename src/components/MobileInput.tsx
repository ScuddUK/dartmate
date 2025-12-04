import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '../types/game';
import { useTheme } from '../contexts/ThemeContext';

interface MobileInputProps {
  gameState: GameState;
  onSubmitScore: (score: number, playerId: number) => void;
  onUndoLastThrow: () => void;
}

const MobileInput: React.FC<MobileInputProps> = ({ 
  gameState, 
  onSubmitScore, 
  onUndoLastThrow 
}) => {
  const { currentTheme } = useTheme();
  const [inputScore, setInputScore] = useState('');
  const gridWrapRef = useRef<HTMLDivElement>(null);
  const [btnSize, setBtnSize] = useState<number>(80);
  const [fonts, setFonts] = useState<{ name: number; score: number; info: number; btn: number }>({ name: 24, score: 40, info: 16, btn: 24 });

  // Always use the current player from game state for automatic alternation
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);

  // Update input when current player changes
  useEffect(() => {
    // Clear input when player changes
    setInputScore('');
  }, [gameState.currentPlayer]);

  useEffect(() => {
    let rafId: number | null = null;
    const recalc = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const wrap = gridWrapRef.current;
        if (!wrap) return;
        const rect = wrap.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const gap = 8; // Tailwind gap-2
        const cols = 3;
        const rows = 4;
        const byWidth = Math.floor((width - gap * (cols - 1)) / cols);
        const byHeight = Math.floor((height - gap * (rows - 1)) / rows);
        const sizeRaw = Math.min(byWidth, byHeight);
        const size = Math.max(52, Math.floor(sizeRaw * 0.9)); // slightly smaller buttons
        setBtnSize(size);
        const nameSize = Math.max(18, Math.floor(size * 0.28));
        const scoreSize = Math.max(24, Math.floor(size * 0.46));
        const infoSize = Math.max(14, Math.floor(size * 0.18));
        const btnText = Math.max(18, Math.floor(size * 0.34));
        setFonts({ name: nameSize, score: scoreSize, info: infoSize, btn: btnText });
      });
    };
    recalc();
    const onResize = () => recalc();
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleNumberInput = (num: string) => {
    if (inputScore.length < 3) {
      setInputScore(prev => prev + num);
    }
  };

  const handleCancel = () => {
    setInputScore('');
  };

  // Context-sensitive button handler
  const handleContextButton = () => {
    if (inputScore === '') {
      // If no score entered, act as Undo button
      onUndoLastThrow();
    } else {
      // If score entered, act as Cancel button
      handleCancel();
    }
  };

  const handleSubmit = () => {
    const score = parseInt(inputScore);
    if (score >= 0 && score <= 180 && inputScore !== '' && currentPlayer) {
      onSubmitScore(score, currentPlayer.id);
      setInputScore('');
    }
  };

  const isValidScore = () => {
    const score = parseInt(inputScore);
    return inputScore !== '' && score >= 0 && score <= 180;
  };

  // Determine button appearance and text based on input state
  const getContextButtonProps = () => {
    if (inputScore === '') {
      return {
        text: '↶',
        bgColor: 'bg-gray-600',
        disabled: !gameState.gameStarted
      };
    } else {
      return {
        text: 'C',
        bgColor: 'var(--color-error)',
        disabled: false
      };
    }
  };

  const contextButtonProps = getContextButtonProps();

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      {/* Game Status */}
      {!gameState.gameStarted && (
        <div className="text-center py-4 flex-shrink-0">
          <div className="text-yellow-100 px-4 py-2 rounded-lg mt-2 mx-4" style={{ backgroundColor: 'var(--color-warning)' }}>
            ⚠️ Game not started yet. Switch to Scoreboard view to start.
          </div>
        </div>
      )}

      {/* Current Player Display - Compact */}
      <div className="text-center py-2 flex-shrink-0">
        <div className="dart-display p-3 rounded-xl mx-4">
          <div className="font-bold mb-2" style={{ color: 'var(--color-primary)', fontSize: fonts.name }}>
            {currentPlayer?.name}
          </div>
          <div className="font-score font-bold mb-1" style={{ color: 'var(--color-text)', fontSize: fonts.score }}>
            {inputScore || '0'}
          </div>
          <div className="text-gray-400" style={{ fontSize: fonts.info }}>
            Remaining: <span className="font-main-score">{currentPlayer?.score}</span> points
          </div>
        </div>
      </div>

      {/* Number Pad - Dynamically Scaled for Touch */}
      <div ref={gridWrapRef} className="flex-1 flex flex-col justify-start px-4 pb-3 mt-1">
        {/* Calculate dynamic button size based on screen width */}
        <div className="grid grid-cols-3 gap-2 w-full mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberInput(num.toString())}
              className="text-white font-bold active:scale-95 transition-transform rounded-lg flex items-center justify-center justify-self-center"
              style={{ width: btnSize, height: btnSize, backgroundColor: 'var(--color-primary)', border: '1px solid var(--color-border)', fontSize: fonts.btn }}
            >
              {num}
            </button>
          ))}
          
          {/* Bottom row: Context-sensitive Cancel/Undo, 0, Submit */}
          <button
            onClick={handleContextButton}
            disabled={contextButtonProps.disabled}
            className="text-white font-bold active:scale-95 transition-all duration-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center justify-self-center"
            style={{ width: btnSize, height: btnSize, backgroundColor: 'var(--color-primary)', border: '1px solid var(--color-border)', fontSize: fonts.btn }}
          >
            {contextButtonProps.text}
          </button>
          <button
            onClick={() => handleNumberInput('0')}
            className="text-white font-bold active:scale-95 transition-transform rounded-lg flex items-center justify-center justify-self-center"
            style={{ width: btnSize, height: btnSize, backgroundColor: 'var(--color-primary)', border: '1px solid var(--color-border)', fontSize: fonts.btn }}
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValidScore() || !gameState.gameStarted}
            className="text-white font-bold active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center justify-center justify-self-center"
            style={{ width: btnSize, height: btnSize, backgroundColor: 'var(--color-primary)', border: '1px solid var(--color-border)', fontSize: fonts.btn }}
          >
            ✓
          </button>
        </div>

        {/* Score Validation */}
        {inputScore && !isValidScore() && (
          <div className="text-center mt-4">
            <div className="text-white px-3 py-1 rounded text-sm" style={{ backgroundColor: 'var(--color-error)' }}>
              ⚠️ Score must be 0-180
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileInput;