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

  const handleClear = () => {
    setInputScore('');
  };

  const handleBackspace = () => {
    setInputScore(prev => prev.slice(0, -1));
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
    <div className="min-h-screen bg-dart-dark text-white p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-dart-gold mb-2">🎯 Dart Scorer</h1>
        <p className="text-gray-300">Mobile Input</p>
        {!gameState.gameStarted && (
          <div className="bg-yellow-600 text-yellow-100 px-4 py-2 rounded-lg">
            ⚠️ Game not started yet. Switch to Scoreboard view to start.
          </div>
        )}
      </div>

      {/* Current Player Display */}
      <div className="text-center mb-8">
        <div className="dart-display p-8 rounded-xl">
          <div className="text-2xl text-gray-300 mb-3">Current Player:</div>
          <div className="text-4xl font-bold text-dart-gold mb-4">
            {currentPlayer?.name}
          </div>
          <div className="text-6xl font-bold mb-4 text-white">
            {inputScore || '0'}
          </div>
          <div className="text-xl text-gray-400">
            Remaining: {currentPlayer?.score} points
          </div>
          {gameState.gameStarted && (
            <div className="mt-4 text-dart-gold font-bold text-lg animate-pulse">
              🎯 YOUR TURN
            </div>
          )}
        </div>
      </div>

      {/* Number Pad - Optimized for Touch */}
      <div className="mb-8">
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleNumberInput(num.toString())}
              className="btn-primary aspect-square text-4xl font-bold h-20 w-20 rounded-xl shadow-lg active:scale-95 transition-transform"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="btn-secondary aspect-square text-xl font-bold h-20 w-20 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            Clear
          </button>
          <button
            onClick={() => handleNumberInput('0')}
            className="btn-primary aspect-square text-4xl font-bold h-20 w-20 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="btn-secondary aspect-square text-2xl font-bold h-20 w-20 rounded-xl shadow-lg active:scale-95 transition-transform"
          >
            ⌫
          </button>
        </div>
      </div>

      {/* Action Buttons - Larger for Touch */}
      <div className="grid grid-cols-1 gap-6 max-w-sm mx-auto">
        <button
          onClick={handleSubmit}
          disabled={!isValidScore() || !gameState.gameStarted}
          className="btn-primary py-6 text-2xl font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          ✓ Submit Score
        </button>
        <button
          onClick={onUndoLastThrow}
          disabled={!gameState.gameStarted}
          className="btn-secondary py-4 text-xl font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          ↶ Undo Last Throw
        </button>
      </div>

      {/* Score Validation */}
      {inputScore && !isValidScore() && (
        <div className="text-center mt-4">
          <div className="bg-red-600 text-white px-4 py-2 rounded-lg inline-block">
            ⚠️ Score must be between 0 and 180
          </div>
        </div>
      )}

      {/* Recent Throws */}
      {currentPlayer && currentPlayer.throws.length > 0 && (
        <div className="mt-8 text-center">
          <h3 className="text-lg font-semibold mb-3">Recent Throws:</h3>
          <div className="flex justify-center gap-2 flex-wrap">
            {currentPlayer.throws.slice(-5).map((throwRecord, index) => (
              <span
                key={index}
                className="bg-gray-700 px-3 py-1 rounded text-dart-gold font-mono"
              >
                {throwRecord.score}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileInput;