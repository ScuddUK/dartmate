import React from 'react';

type Props = {
  teamNames: [string, string];
  teamPoints: [number, number];
};

const TournamentEndScreen: React.FC<Props> = ({ teamNames, teamPoints }) => {
  const [a, b] = teamPoints;
  const winner = a === b ? 0 : a > b ? 1 : 2;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="text-center mb-6">
        <div className="text-3xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>Tournament Finished</div>
        <div className="text-base" style={{ color: 'var(--color-text-secondary)' }}>Final score</div>
      </div>

      <div className="w-full max-w-md rounded-xl p-6 space-y-4" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
        <div className="flex items-center justify-between text-xl font-bold">
          <div className="flex items-center gap-2">
            <span>{teamNames[0]}</span>
            {winner === 1 && <span>🏆</span>}
          </div>
          <div style={{ color: 'var(--color-primary)' }}>{a}</div>
        </div>

        <div className="flex items-center justify-between text-xl font-bold">
          <div className="flex items-center gap-2">
            <span>{teamNames[1]}</span>
            {winner === 2 && <span>🏆</span>}
          </div>
          <div style={{ color: 'var(--color-primary)' }}>{b}</div>
        </div>

        {winner === 0 && (
          <div className="text-center font-semibold pt-2" style={{ color: 'var(--color-text-secondary)' }}>
            Draw
          </div>
        )}
      </div>
    </div>
  );
};

export default TournamentEndScreen;
