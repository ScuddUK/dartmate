import React, { useState, useEffect } from 'react';
import { GameState } from '../types/game';

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
  const [inputScore, setInputScore] = useState('');

  // Always use the current player from game state for automatic alternation
  const currentPlayer = gameState.players.find(p => p.id === gameState.currentPlayer);

  // Update input when current player changes
  useEffect(() => {
    // Clear input when player changes
    setInputScore('');
  }, [gameState.currentPlayer]);

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
        bgColor: 'bg-red-600',
        disabled: false
      };
    }
  };

  const contextButtonProps = getContextButtonProps();

  return (
    <div className="min-h-screen bg-dart-dark text-white flex flex-col">
      {/* Header - Simplified */}
      <div className="text-center py-4 flex-shrink-0">
        <h1 className="text-3xl font-bold text-dart-gold">🎯 Dart Scorer</h1>
        {!gameState.gameStarted && (
          <div className="bg-yellow-600 text-yellow-100 px-4 py-2 rounded-lg mt-2 mx-4">
            ⚠️ Game not started yet. Switch to Scoreboard view to start.
          </div>
        )}
      </div>

      {/* Current Player Display - Compact */}
      <div className="text-center py-4 flex-shrink-0">
        <div className="dart-display p-4 rounded-xl mx-4">
          <div className="text-3xl font-bold text-dart-gold mb-2">
            {currentPlayer?.name}
          </div>
          <div className="text-5xl font-bold mb-2 text-white">
            {inputScore || '0'}
          </div>
          <div className="text-lg text-gray-400">
            Remaining: {currentPlayer?.score} points
          </div>
        </div>
      </div>

      {/* Number Pad - Dynamically Scaled for Touch */}
      <div className="flex-1 flex flex-col justify-center px-4 pb-4">
        {/* Calculate dynamic button size based on screen width */}
        <div className="grid grid-cols-3 gap-2 w-full max-w-sm mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberInput(num.toString())}
              className="aspect-square bg-dart-gold text-dart-dark text-2xl font-bold active:scale-95 transition-transform border border-dart-dark rounded-lg min-h-[60px] sm:min-h-[70px] md:min-h-[80px]"
            >
              {num}
            </button>
          ))}
          
          {/* Bottom row: Context-sensitive Cancel/Undo, 0, Submit */}
          <button
            onClick={handleContextButton}
            disabled={contextButtonProps.disabled}
            className={`aspect-square ${contextButtonProps.bgColor} text-white text-2xl font-bold active:scale-95 transition-all duration-200 border border-dart-dark rounded-lg min-h-[60px] sm:min-h-[70px] md:min-h-[80px] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {contextButtonProps.text}
          </button>
          <button
            onClick={() => handleNumberInput('0')}
            className="aspect-square bg-dart-gold text-dart-dark text-2xl font-bold active:scale-95 transition-transform border border-dart-dark rounded-lg min-h-[60px] sm:min-h-[70px] md:min-h-[80px]"
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValidScore() || !gameState.gameStarted}
            className="aspect-square bg-green-600 text-white text-xl font-bold active:scale-95 transition-transform border border-dart-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg min-h-[60px] sm:min-h-[70px] md:min-h-[80px]"
          >
            ✓
          </button>
        </div>

        {/* Score Validation */}
        {inputScore && !isValidScore() && (
          <div className="text-center mt-4">
            <div className="bg-red-600 text-white px-3 py-1 rounded text-sm">
              ⚠️ Score must be 0-180
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileInput;