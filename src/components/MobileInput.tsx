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

      {/* Number Pad - Optimized for Touch (48x48px buttons, rounded corners) */}
      <div className="flex-1 flex flex-col justify-center px-4 pb-4">
        <div className="grid grid-cols-3 max-w-[144px] mx-auto mb-0">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberInput(num.toString())}
              className="w-12 h-12 bg-dart-gold text-dart-dark text-xl font-bold active:scale-95 transition-transform border border-dart-dark rounded-lg"
            >
              {num}
            </button>
          ))}
          
          {/* Bottom row: Cancel, 0, Submit */}
          <button
            onClick={handleCancel}
            className="w-12 h-12 bg-red-600 text-white text-xl font-bold active:scale-95 transition-transform border border-dart-dark rounded-lg"
          >
            C
          </button>
          <button
            onClick={() => handleNumberInput('0')}
            className="w-12 h-12 bg-dart-gold text-dart-dark text-xl font-bold active:scale-95 transition-transform border border-dart-dark rounded-lg"
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValidScore() || !gameState.gameStarted}
            className="w-12 h-12 bg-green-600 text-white text-lg font-bold active:scale-95 transition-transform border border-dart-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
          >
            ✓
          </button>
        </div>

        {/* Undo Button - Single button under 0 */}
        <div className="max-w-[144px] mx-auto">
          <div className="grid grid-cols-3">
            <div></div> {/* Empty space */}
            <button
              onClick={onUndoLastThrow}
              disabled={!gameState.gameStarted}
              className="w-12 h-12 bg-gray-600 text-white text-lg font-bold active:scale-95 transition-transform border border-dart-dark disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
            >
              ↶
            </button>
            <div></div> {/* Empty space */}
          </div>
        </div>

        {/* Score Validation */}
        {inputScore && !isValidScore() && (
          <div className="text-center mt-4">
            <div className="bg-red-600 text-white px-3 py-1 rounded text-sm">
              ⚠️ Score must be 0-180
            </div>
          </div>
        )}

        {/* Recent Throws - Compact */}
        {currentPlayer && currentPlayer.throws.length > 0 && (
          <div className="mt-4 text-center">
            <h3 className="text-sm font-semibold mb-2">Recent:</h3>
            <div className="flex justify-center gap-1 flex-wrap">
              {currentPlayer.throws.slice(-5).map((throwRecord, index) => (
                <span
                  key={index}
                  className="bg-gray-700 px-2 py-1 rounded text-xs text-dart-gold font-mono"
                >
                  {throwRecord.score}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileInput;