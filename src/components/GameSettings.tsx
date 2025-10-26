import React, { useState } from 'react';
import { GameSettings } from '../types/game';
import { useTheme } from '../contexts/ThemeContext';

interface GameSettingsProps {
  onStartGame: (settings: GameSettings) => void;
}

const GameSettingsComponent: React.FC<GameSettingsProps> = ({ onStartGame }) => {
  const { currentTheme, setTheme, themes } = useTheme();
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
    <div className="min-h-screen bg-dart-dark text-white p-6" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>🎯 Dart Scorer</h1>
          <p className="text-gray-300">Configure your game settings</p>
        </div>

        <div className="bg-gray-800 rounded-xl p-8 space-y-8">
          {/* Player Names */}
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Players</h2>
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
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Starting Score</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[301, 501, 601, 701].map((score) => (
                <button
                  key={score}
                  onClick={() => setSettings({ ...settings, startingScore: score as 301 | 501 | 601 | 701 })}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                      settings.startingScore === score
                        ? 'text-white'
                        : 'bg-gray-700 text-white hover:bg-gray-600'
                    }`}
                    style={settings.startingScore === score ? { backgroundColor: 'var(--color-primary)' } : {}}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          {/* Game Format */}
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Game Format</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setSettings({ ...settings, gameFormat: 'firstTo' })}
                className={`py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                  settings.gameFormat === 'firstTo'
                    ? 'text-white'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
                style={settings.gameFormat === 'firstTo' ? { backgroundColor: 'var(--color-primary)' } : {}}
              >
                First To
              </button>
              <button
                onClick={() => setSettings({ ...settings, gameFormat: 'bestOf' })}
                className={`py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                  settings.gameFormat === 'bestOf'
                    ? 'text-white'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
                style={settings.gameFormat === 'bestOf' ? { backgroundColor: 'var(--color-primary)' } : {}}
              >
                Best Of
              </button>
            </div>
          </div>

          {/* Legs */}
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
              {settings.gameFormat === 'firstTo' ? 'Legs to Win' : 'Total Legs'}
            </h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {[1, 3, 5, 7, 9, 11].map((legs) => (
                <button
                  key={legs}
                  onClick={() => setSettings({ ...settings, legsToWin: legs })}
                  className={`py-3 px-4 rounded-lg font-bold text-lg transition-all ${
                    settings.legsToWin === legs
                      ? 'text-white'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                  style={settings.legsToWin === legs ? { backgroundColor: 'var(--color-primary)' } : {}}
                >
                  {legs}
                </button>
              ))}
            </div>
          </div>

          {/* Sets Option */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-primary)' }}>Enable Sets</h2>
              <button
                onClick={() => setSettings({ ...settings, setsEnabled: !settings.setsEnabled })}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                  settings.setsEnabled ? '' : 'bg-gray-600'
                }`}
                style={settings.setsEnabled ? { backgroundColor: 'var(--color-primary)' } : {}}
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
                          ? 'text-white'
                          : 'bg-gray-700 text-white hover:bg-gray-600'
                      }`}
                      style={settings.setsToWin === sets ? { backgroundColor: 'var(--color-primary)' } : {}}
                    >
                      {sets}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme Selection */}
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Theme</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setTheme(theme)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    currentTheme.id === theme.id
                      ? 'bg-opacity-10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  style={currentTheme.id === theme.id ? { 
                    borderColor: 'var(--color-primary)', 
                    backgroundColor: 'var(--color-primary-alpha)' 
                  } : {}}
                >
                  <div className="flex items-center space-x-3">
                    {/* Theme Color Preview */}
                    <div className="flex space-x-1">
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-400"
                        style={{ backgroundColor: theme.colors.primary }}
                      ></div>
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-400"
                        style={{ backgroundColor: theme.colors.secondary }}
                      ></div>
                      <div 
                        className="w-4 h-4 rounded-full border border-gray-400"
                        style={{ backgroundColor: theme.colors.accent }}
                      ></div>
                    </div>
                    {/* Theme Name */}
                    <span className={`font-medium ${
                      currentTheme.id === theme.id ? '' : 'text-white'
                    }`}
                    style={currentTheme.id === theme.id ? { color: 'var(--color-primary)' } : {}}>
                      {theme.name}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Start Game Button */}
          <div className="pt-6">
            <button
              onClick={handleStartGame}
              disabled={!settings.playerNames[0].trim() || !settings.playerNames[1].trim()}
              className="w-full py-4 px-6 text-white font-bold text-xl rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ backgroundColor: 'var(--color-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
            >
              🚀 Start Game
            </button>
          </div>
        </div>


      </div>
    </div>
  );
};

export default GameSettingsComponent;