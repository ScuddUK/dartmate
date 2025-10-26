import React from 'react';
import { GameState } from '../types/game';

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
  const formatThrowHistory = (throws: any[]) => {
    return throws.slice(-5).map((throwRecord, i) => {
      const previousTotal = i === 0 ? 501 : (501 - throws.slice(0, throws.indexOf(throwRecord)).reduce((sum, t) => sum + t.score, 0));
      const newTotal = throwRecord.remainingScore;
      const isHighScore = throwRecord.score >= 100;
      
      return (
        <div key={i} className="mb-2 text-center">
          <div className="text-3xl lg:text-5xl xl:text-6xl font-bold flex items-center justify-center gap-3 lg:gap-4">
            <span className={`min-w-[60px] lg:min-w-[80px] ${isHighScore ? 'text-green-400' : 'text-dart-gold'}`}>
              {throwRecord.score}
            </span>
            <span className="text-dart-gold text-3xl lg:text-5xl xl:text-6xl">•</span>
            <span className="text-gray-300 flex items-center gap-2 lg:gap-3 text-3xl lg:text-5xl xl:text-6xl">
              <span className="line-through opacity-60 min-w-[60px] lg:min-w-[80px]">{previousTotal}</span>
              <span className="mx-1 text-dart-gold">→</span>
              <span className="font-bold text-white min-w-[60px] lg:min-w-[80px] text-4xl lg:text-6xl xl:text-7xl">{newTotal}</span>
            </span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen p-4 text-white">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl lg:text-6xl font-bold text-dart-gold mb-4">🎯 DART SCORER PRO</h1>
        <div className="text-xl lg:text-2xl text-gray-300 mb-2">
          Game Mode: <span className="text-dart-gold">{gameState.gameMode}</span>
        </div>
        {gameState.settings && (
          <div className="text-base lg:text-lg text-gray-400">
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
        )}
      </div>

      {/* Game Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          onClick={onStartGame}
          className="btn-primary text-lg lg:text-xl px-6 lg:px-8 py-3 lg:py-4"
          disabled={gameState.gameStarted}
        >
          {gameState.gameStarted ? '🎮 Game In Progress' : '🚀 Start Game'}
        </button>
        <button
          onClick={onResetGame}
          className="btn-secondary text-lg lg:text-xl px-6 lg:px-8 py-3 lg:py-4"
        >
          🔄 Reset Game
        </button>
      </div>

      {/* Players Grid - Dynamic scaling based on screen size */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 h-[calc(100vh-300px)] max-w-full mx-auto">
        {gameState.players.map((player) => (
          <div
            key={player.id}
            className={`dart-display p-4 lg:p-8 rounded-xl border-4 transition-all duration-300 flex flex-col h-full ${
              gameState.currentPlayer === player.id
                ? 'border-dart-gold bg-dart-gold bg-opacity-10 shadow-lg shadow-dart-gold/30'
                : 'border-gray-600 bg-gray-800 bg-opacity-50'
            }`}
          >
            {/* Player Name - No editing functionality */}
            <div className="text-center mb-4 lg:mb-6">
              <h2 className="text-3xl lg:text-5xl xl:text-6xl font-bold text-dart-gold">
                {player.name}
              </h2>
            </div>

            {/* Current Score */}
            <div className="text-center mb-6 lg:mb-8">
              <div className="text-6xl lg:text-8xl xl:text-9xl font-bold text-dart-gold mb-2">
                {player.score}
              </div>
              <div className="text-lg lg:text-2xl xl:text-3xl text-gray-300">
                Remaining Score
              </div>
            </div>

            {/* Stats Row */}
            <div className={`grid gap-4 lg:gap-6 mb-4 lg:mb-6 ${gameState.settings?.setsEnabled ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {gameState.settings?.setsEnabled && (
                <div className="text-center">
                  <div className="text-2xl lg:text-4xl xl:text-5xl font-bold text-purple-400">
                    {player.setsWon || 0}
                  </div>
                  <div className="text-sm lg:text-lg xl:text-xl text-gray-400">Sets Won</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl lg:text-4xl xl:text-5xl font-bold text-green-400">
                  {player.legsWon}
                </div>
                <div className="text-sm lg:text-lg xl:text-xl text-gray-400">Legs Won</div>
              </div>
              <div className="text-center">
                <div className="text-2xl lg:text-4xl xl:text-5xl font-bold text-blue-400">
                  {player.averageScore.toFixed(1)}
                </div>
                <div className="text-sm lg:text-lg xl:text-xl text-gray-400">Average</div>
              </div>
            </div>

            {/* Recent Throws - Flexible height */}
            <div className="border-t border-gray-600 pt-4 flex-1 flex flex-col">
              <div className="text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-300 mb-4 text-center">Recent Throws</div>
              <div className="flex-1 overflow-y-auto">
                {player.throws.length > 0 ? (
                  <div className="space-y-2">
                    {formatThrowHistory(player.throws)}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 italic text-lg lg:text-2xl py-8">
                    No throws yet
                  </div>
                )}
              </div>
            </div>

            {/* Current Player Indicator */}
            {gameState.currentPlayer === player.id && gameState.gameStarted && (
              <div className="text-center mt-4">
                <div className="inline-block bg-dart-gold text-dart-dark px-4 lg:px-6 py-2 lg:py-3 rounded-full font-bold animate-pulse text-lg lg:text-xl">
                  🎯 YOUR TURN
                </div>
              </div>
            )}
          </div>
        ))}
      </div>


    </div>
  );
};

export default Scoreboard;