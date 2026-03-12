import { useState, type FC } from 'react';

interface MainMenuProps {
  onScoreboard: () => void;
  onMobileScorer: () => void;
}

const MainMenu: FC<MainMenuProps> = ({ onScoreboard, onMobileScorer }) => {
  const [logoLoaded, setLogoLoaded] = useState(true);
  const [scoreboardIconLoaded, setScoreboardIconLoaded] = useState(true);
  const [mobileIconLoaded, setMobileIconLoaded] = useState(true);

  return (
    <div className="min-h-screen flex items-start justify-center p-6 pt-2" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="max-w-3xl w-full">
        <div className="flex justify-center mb-5">
          {logoLoaded ? (
            <img
              src="/dartmate-logo.png"
              alt="Dart Mate"
              style={{ width: 'clamp(250px, 44vw, 475px)', height: 'auto' }}
              onError={() => setLogoLoaded(false)}
            />
          ) : (
            <h1 className="text-4xl font-bold text-center" style={{ color: 'var(--color-primary)' }}>
              Dart Mate
            </h1>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            aria-label="Open Scoreboard"
            onClick={onScoreboard}
            className="rounded-xl flex items-center justify-center aspect-square text-2xl font-semibold transition-colors"
            style={{
              backgroundColor: 'transparent',
              border: '2px solid rgba(0, 0, 0, 0.16)',
              color: 'var(--color-text)'
            }}
          >
            {scoreboardIconLoaded ? (
              <img
                src="/scoreboard-button.png"
                alt=""
                aria-hidden="true"
                style={{ width: '86%', height: '86%', objectFit: 'contain' }}
                onError={() => setScoreboardIconLoaded(false)}
              />
            ) : (
              <span>Scoreboard</span>
            )}
          </button>
          <button
            aria-label="Open Mobile Scorer"
            onClick={onMobileScorer}
            className="rounded-xl flex items-center justify-center aspect-square text-2xl font-semibold transition-colors"
            style={{
              backgroundColor: 'transparent',
              border: '2px solid rgba(0, 0, 0, 0.16)',
              color: 'var(--color-text)'
            }}
          >
            {mobileIconLoaded ? (
              <img
                src="/mobile-scorer-button.png"
                alt=""
                aria-hidden="true"
                style={{ width: '86%', height: '86%', objectFit: 'contain' }}
                onError={() => setMobileIconLoaded(false)}
              />
            ) : (
              <span>Mobile Scorer</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
