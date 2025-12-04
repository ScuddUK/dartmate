import React, { useState } from 'react';
import { GameState } from '../types/game';

interface LegStartPopupProps {
  gameState: GameState;
  isVisible: boolean;
  onClose: () => void;
  onPlayerSelected: (playerId: number) => void;
}

export const LegStartPopup: React.FC<LegStartPopupProps> = ({
  gameState,
  isVisible,
  onClose,
  onPlayerSelected
}) => {
  const [selectedPlayer, setSelectedPlayer] = useState<number>(gameState.legStartingPlayer);
  

  if (!isVisible) return null;

  const handleStartLeg = () => {
    onPlayerSelected(selectedPlayer);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🎯 Match Starting!
        </h2>
        
        {gameState.settings.setsEnabled && (
          <p className="text-sm text-gray-500 mb-6">
            First to {gameState.settings.setsToWin} sets wins
          </p>
        )}

        <div className="mb-6">
          <p className="text-lg text-gray-600 mb-4">Choose who throws first in this match:</p>
          
          <div className="flex gap-4 mb-6">
            {gameState.players.map((player) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player.id)}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  selectedPlayer === player.id
                    ? 'border-purple-700 bg-purple-50 text-purple-900 shadow-md'
                    : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="font-semibold">{player.name}</div>
                {player.isBot && (
                  <div className="text-sm text-gray-500">Bot</div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleStartLeg}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors ml-4"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};