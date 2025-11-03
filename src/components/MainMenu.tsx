import React from 'react';

interface MainMenuProps {
  onScoreboard: () => void;
  onMobileScorer: () => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onScoreboard, onMobileScorer }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="max-w-3xl w-full">
        <h1 className="text-4xl font-bold text-center mb-8" style={{ color: 'var(--color-primary)' }}>🎯 Dart Scorer</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            aria-label="Open Scoreboard"
            onClick={onScoreboard}
            className="rounded-xl flex items-center justify-center aspect-square text-2xl font-semibold transition-colors"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-background)' }}
          >
            Scoreboard
          </button>
          <button
            aria-label="Open Mobile Scorer"
            onClick={onMobileScorer}
            className="rounded-xl flex items-center justify-center aspect-square text-2xl font-semibold transition-colors"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-background)' }}
          >
            Mobile Scorer
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;