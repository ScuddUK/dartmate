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
    playerNames: ['Player 1', 'Player 2'],
    dartBot: {
      enabled: false,
      skillLevel: 5,
      averageScore: 65, // Middle skill level
      name: 'DartBot'
    }
  });



  const handlePlayerNameChange = (index: 0 | 1, name: string) => {
    const newNames = [...settings.playerNames] as [string, string];
    newNames[index] = name;
    setSettings({ ...settings, playerNames: newNames });
  };

  // Calculate DartBot average score based on skill level (1-10 = 20-110 average)
  const calculateBotAverageScore = (skillLevel: number): number => {
    return 20 + (skillLevel - 1) * 10;
  };

  const handleDartBotToggle = (enabled: boolean) => {
    setSettings({
      ...settings,
      dartBot: {
        ...settings.dartBot,
        enabled,
        averageScore: calculateBotAverageScore(settings.dartBot.skillLevel)
      }
    });
  };

  const handleDartBotSkillChange = (skillLevel: number) => {
    setSettings({
      ...settings,
      dartBot: {
        ...settings.dartBot,
        skillLevel,
        averageScore: calculateBotAverageScore(skillLevel),
        name: `DartBot (Level ${skillLevel})`
      }
    });
  };

  const handleStartGame = () => {
    const player1Valid = settings.playerNames[0].trim();
    const player2Valid = settings.dartBot.enabled || settings.playerNames[1].trim();
    
    if (player1Valid && player2Valid) {
      // If DartBot is enabled, update player 2 name to DartBot name
      const finalSettings = settings.dartBot.enabled 
        ? { ...settings, playerNames: [settings.playerNames[0], settings.dartBot.name] as [string, string] }
        : settings;
      
      onStartGame(finalSettings);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>🎯 Dart Scorer</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Configure your game settings</p>
        </div>

        <div className="rounded-xl p-8 space-y-8" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          {/* Player Names */}
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Players</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Player 1</label>
                <input
                  type="text"
                  value={settings.playerNames[0]}
                  onChange={(e) => handlePlayerNameChange(0, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg focus:outline-none"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                  placeholder="Enter player 1 name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Player 2</label>
                {!settings.dartBot.enabled ? (
                  <input
                     type="text"
                     value={settings.playerNames[1]}
                     onChange={(e) => handlePlayerNameChange(1, e.target.value)}
                     className="w-full px-4 py-3 rounded-lg focus:outline-none"
                     style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                     placeholder="Enter player 2 name"
                   />
                ) : (
                  <div className="w-full px-4 py-3 rounded-lg flex items-center" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                    <span className="text-blue-400 mr-2">🤖</span>
                    <span>{settings.dartBot.name}</span>
                    <span className="ml-auto text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Avg: {settings.dartBot.averageScore}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* DartBot Controls */}
            <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">🤖 DartBot</h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Play against an AI opponent</p>
                </div>
                <button
                  onClick={() => handleDartBotToggle(!settings.dartBot.enabled)}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors`}
                  style={settings.dartBot.enabled ? { backgroundColor: 'var(--color-primary)' } : { backgroundColor: 'var(--color-border)' }}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      settings.dartBot.enabled ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {settings.dartBot.enabled && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                    Skill Level (Avg Score: {settings.dartBot.averageScore})
                  </label>
                  <select
                    value={settings.dartBot.skillLevel}
                    onChange={(e) => handleDartBotSkillChange(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg focus:outline-none"
                    style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                  >
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((level) => (
                      <option key={level} value={level}>
                        Level {level} - {level <= 3 ? 'Beginner 🟢' : level <= 6 ? 'Intermediate 🟡' : level <= 8 ? 'Advanced 🟠' : 'Expert 🔴'} 
                        (Avg: {calculateBotAverageScore(level)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                        : 'hover:opacity-90'
                    }`}
                    style={settings.startingScore === score ? { backgroundColor: 'var(--color-primary)' } : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
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
                    : 'hover:opacity-90'
                }`}
                style={settings.gameFormat === 'firstTo' ? { backgroundColor: 'var(--color-primary)' } : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              >
                First To
              </button>
              <button
                onClick={() => setSettings({ ...settings, gameFormat: 'bestOf' })}
                className={`py-4 px-6 rounded-lg font-bold text-lg transition-all ${
                  settings.gameFormat === 'bestOf'
                    ? 'text-white'
                    : 'hover:opacity-90'
                }`}
                style={settings.gameFormat === 'bestOf' ? { backgroundColor: 'var(--color-primary)' } : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
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
                      : 'hover:opacity-90'
                  }`}
                  style={settings.legsToWin === legs ? { backgroundColor: 'var(--color-primary)' } : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
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
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors`}
                style={settings.setsEnabled ? { backgroundColor: 'var(--color-primary)' } : { backgroundColor: 'var(--color-border)' }}
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
                <h3 className="text-lg font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
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
                          : 'hover:opacity-90'
                      }`}
                      style={settings.setsToWin === sets ? { backgroundColor: 'var(--color-primary)' } : { backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                    >
                      {sets}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme selection removed per request */}

          {/* Start Game Button */}
          <div className="pt-6">
            <button
              onClick={handleStartGame}
              disabled={!settings.playerNames[0].trim() || (!settings.dartBot.enabled && !settings.playerNames[1].trim())}
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