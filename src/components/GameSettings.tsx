import React, { useState } from 'react';
import { GameSettings } from '../types/game';

interface GameSettingsProps {
  onStartGame: (settings: GameSettings) => void;
}

const GameSettingsComponent: React.FC<GameSettingsProps> = ({ onStartGame }) => {
  const [settings, setSettings] = useState<GameSettings>({
    startingScore: 501,
    gameFormat: 'firstTo',
    legsToWin: 3,
    setsEnabled: false,
    setsToWin: 3,
    playerNames: ['Player 1', 'Player 2']
  });

  const handlePlayerNameChange = (index: 0 | 1, name: string) => {
    const newNames = [...settings.playerNames] as [string, string];
    newNames[index] = name;
    setSettings({ ...settings, playerNames: newNames });
  };

  const handleStartGame = () => {
    if (settings.playerNames[0].trim() && settings.playerNames[1].trim()) {
      onStartGame(settings);
    }
  };

  return (
    <div className="min-h-screen bg-dart-dark text-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-dart-gold mb-4">🎯 Dart Scorer Pro</h1>
          <p className="text-xl text-gray-300">Configure your game settings</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 space-y-8">
          {/* Player Names */}
          <div>
            <h2 className="text-2xl font-bold text-dart-gold mb-4">Player Names</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Player 1</label>
                <input
                  type="text"
                  value={settings.playerNames[0]}
                  onChange={(e) => handlePlayerNameChange(0, e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-dart-gold focus:border-transparent"
                  placeholder="Enter player 1 name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Player 2</label>
                <input
                  type="text"
                  value={settings.playerNames[1]}
                  onChange={(e) => handlePlayerNameChange(1, e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-dart-gold focus:border-transparent"
                  placeholder="Enter player 2 name"
                />
              </div>
            </div>
          </div>

          {/* Starting Score */}
          <div>
            <h2 className="text-2xl font-bold text-dart-gold mb-4">Starting Score</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[301, 501, 601, 701].map((score) => (
                <button
                  key={score}
                  onClick={() => setSettings({ ...settings, startingScore: score as 301 | 501 | 601 | 701 })}
                  className={`py-3 px-4 rounded-lg font-bold text-lg transition-all ${
                    settings.startingScore === score
                      ? 'bg-dart-gold text-dart-dark'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Game Format */}
          <div>
            <h2 className="text-2xl font-bold text-dart-gold mb-4">Game Format</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSettings({ ...settings, gameFormat: 'firstTo' })}
                className={`py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                  settings.gameFormat === 'firstTo'
                    ? 'bg-dart-gold text-dart-dark'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                First To
              </button>
              <button
                onClick={() => setSettings({ ...settings, gameFormat: 'bestOf' })}
                className={`py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                  settings.gameFormat === 'bestOf'
                    ? 'bg-dart-gold text-dart-dark'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Best Of
              </button>
            </div>
          </div>

          {/* Legs */}
          <div>
            <h2 className="text-2xl font-bold text-dart-gold mb-4">
              {settings.gameFormat === 'firstTo' ? 'Legs to Win' : 'Total Legs'}
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[1, 3, 5, 7, 9, 11].map((legs) => (
                <button
                  key={legs}
                  onClick={() => setSettings({ ...settings, legsToWin: legs })}
                  className={`py-3 px-4 rounded-lg font-bold text-lg transition-all ${
                    settings.legsToWin === legs
                      ? 'bg-dart-gold text-dart-dark'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {legs}
                </button>
              ))}
            </div>
          </div>

          {/* Sets Option */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-dart-gold">Enable Sets</h2>
              <button
                onClick={() => setSettings({ ...settings, setsEnabled: !settings.setsEnabled })}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  settings.setsEnabled ? 'bg-dart-gold' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                    settings.setsEnabled ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            
            {settings.setsEnabled && (
              <div>
                <h3 className="text-lg font-medium text-gray-300 mb-3">
                  {settings.gameFormat === 'firstTo' ? 'Sets to Win' : 'Total Sets'}
                </h3>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                  {[1, 3, 5, 7, 9].map((sets) => (
                    <button
                      key={sets}
                      onClick={() => setSettings({ ...settings, setsToWin: sets })}
                      className={`py-3 px-4 rounded-lg font-bold text-lg transition-all ${
                        settings.setsToWin === sets
                          ? 'bg-dart-gold text-dart-dark'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                    >
                      {sets}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Start Game Button */}
          <div className="pt-6">
            <button
              onClick={handleStartGame}
              disabled={!settings.playerNames[0].trim() || !settings.playerNames[1].trim()}
              className="w-full py-4 px-6 bg-dart-gold text-dart-dark font-bold text-xl rounded-lg hover:bg-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              🚀 Start Game
            </button>
          </div>
        </div>

        {/* Game Summary */}
        <div className="mt-6 bg-gray-900 rounded-lg p-4">
          <h3 className="text-lg font-bold text-dart-gold mb-2">Game Summary</h3>
          <div className="text-gray-300 space-y-1">
            <p><strong>{settings.playerNames[0]}</strong> vs <strong>{settings.playerNames[1]}</strong></p>
            <p>Starting Score: <strong>{settings.startingScore}</strong></p>
            <p>Format: <strong>{settings.gameFormat === 'firstTo' ? 'First to' : 'Best of'} {settings.legsToWin} leg{settings.legsToWin !== 1 ? 's' : ''}</strong></p>
            {settings.setsEnabled && (
              <p>Sets: <strong>{settings.gameFormat === 'firstTo' ? 'First to' : 'Best of'} {settings.setsToWin} set{settings.setsToWin !== 1 ? 's' : ''}</strong></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSettingsComponent;