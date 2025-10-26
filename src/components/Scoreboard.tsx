import React, { useState } from 'react';
import { GameState } from '../types/game';

interface ScoreboardProps {
  gameState: GameState;
  onResetGame: () => void;
  onStartGame: () => void;
  onUpdatePlayerName: (playerId: number, name: string) => void;
}

const Scoreboard: React.FC<ScoreboardProps> = ({ 
  gameState, 
  onResetGame, 
  onStartGame, 
  onUpdatePlayerName 
}) => {
  const [editingPlayer, setEditingPlayer] = useState<number | null>(null);
  const [editName, setEditName] = useState('');

  const handleNameEdit = (playerId: number, currentName: string) => {
    setEditingPlayer(playerId);
    setEditName(currentName);
  };

  const handleNameSave = () => {
    if (editingPlayer !== null && editName.trim()) {
      onUpdatePlayerName(editingPlayer, editName.trim());
      setEditingPlayer(null);
      setEditName('');
    }
  };

  const handleNameCancel = () => {
    setEditingPlayer(null);
    setEditName('');
  };

  const formatThrowHistory = (throws: any[]) => {
    return throws.slice(-8).map((throwRecord, i) => {
      const previousTotal = i === 0 ? 501 : (501 - throws.slice(0, throws.indexOf(throwRecord)).reduce((sum, t) => sum + t.score, 0));
      const newTotal = throwRecord.remainingScore;
      
      return (
        <div key={i} className="mb-3 text-center">
          <div className="text-2xl font-bold text-dart-gold mb-1">
            {throwRecord.score}
          </div>
          <div className="text-lg text-gray-300">
            <span className="line-through opacity-60">{previousTotal}</span>
            <span className="mx-2">→</span>
            <span className="font-bold text-white">{newTotal}</span>
          </div>
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen p-8 text-white">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold text-dart-gold mb-4">🎯 DART SCORER PRO</h1>
        <div className="text-2xl text-gray-300 mb-2">
          Game Mode: <span className="text-dart-gold">{gameState.gameMode}</span>
        </div>
        {gameState.settings && (
          <div className="text-lg text-gray-400">
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
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={onStartGame}
          className="btn-primary text-xl px-8 py-4"
          disabled={gameState.gameStarted}
        >
          {gameState.gameStarted ? '🎮 Game In Progress' : '🚀 Start Game'}
        </button>
        <button
          onClick={onResetGame}
          className="btn-secondary text-xl px-8 py-4"
        >
          🔄 Reset Game
        </button>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {gameState.players.map((player) => (
          <div
            key={player.id}
            className={`dart-display p-6 rounded-xl border-4 transition-all duration-300 ${
              gameState.currentPlayer === player.id
                ? 'border-dart-gold bg-dart-gold bg-opacity-10 shadow-lg shadow-dart-gold/30'
                : 'border-gray-600 bg-gray-800 bg-opacity-50'
            }`}
          >
            {/* Player Name */}
            <div className="text-center mb-4">
              {editingPlayer === player.id ? (
                <div className="flex items-center justify-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-gray-700 text-white px-3 py-2 rounded text-2xl text-center"
                    onKeyPress={(e) => e.key === 'Enter' && handleNameSave()}
                    autoFocus
                  />
                  <button
                    onClick={handleNameSave}
                    className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-white"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleNameCancel}
                    className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white"
                  >
                    ✗
                  </button>
                </div>
              ) : (
                <h2
                  className="text-3xl font-bold cursor-pointer hover:text-dart-gold transition-colors"
                  onClick={() => handleNameEdit(player.id, player.name)}
                >
                  {player.name}
                  <span className="text-sm ml-2 opacity-60">✏️</span>
                </h2>
              )}
            </div>

            {/* Current Score */}
            <div className="text-center mb-6">
              <div className="text-6xl font-bold text-dart-gold mb-2">
                {player.score}
              </div>
              <div className="text-lg text-gray-300">
                Remaining Score
              </div>
            </div>

            {/* Stats Row */}
            <div className={`grid gap-4 mb-4 ${gameState.settings?.setsEnabled ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {gameState.settings?.setsEnabled && (
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {player.setsWon || 0}
                  </div>
                  <div className="text-sm text-gray-400">Sets Won</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {player.legsWon}
                </div>
                <div className="text-sm text-gray-400">Legs Won</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {player.averageScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-400">Average</div>
              </div>
            </div>

            {/* Recent Throws */}
            <div className="border-t border-gray-600 pt-4">
              <div className="text-xl font-semibold text-gray-300 mb-4 text-center">Recent Throws</div>
              <div className="max-h-96 overflow-y-auto">
                {player.throws.length > 0 ? (
                  <div className="space-y-2">
                    {formatThrowHistory(player.throws)}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 italic text-lg py-8">
                    No throws yet
                  </div>
                )}
              </div>
            </div>

            {/* Current Player Indicator */}
            {gameState.currentPlayer === player.id && gameState.gameStarted && (
              <div className="text-center mt-4">
                <div className="inline-block bg-dart-gold text-dart-dark px-4 py-2 rounded-full font-bold animate-pulse">
                  🎯 YOUR TURN
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="text-center mt-12 text-gray-400">
        <p className="text-lg">
          📱 Switch to Mobile view for score input | 📺 Use this view for TV display
        </p>
        <p className="text-sm mt-2">
          Click player names to edit | Game starts at 501 points
        </p>
      </div>
    </div>
  );
};

export default Scoreboard;