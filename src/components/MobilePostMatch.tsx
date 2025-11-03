import React from 'react';

interface MobilePostMatchProps {
  winnerName: string;
  winnerAverage: number;
  onRestart: () => void;
  onChangeSettings: () => void;
}

export const MobilePostMatch: React.FC<MobilePostMatchProps> = ({ winnerName, winnerAverage, onRestart, onChangeSettings }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="text-center mb-6">
        <div className="text-2xl font-bold mb-2" style={{ color: 'var(--color-primary)' }}>Match Finished</div>
        <div className="text-xl font-semibold">Winner: {winnerName}</div>
        <div className="text-lg mt-1">Average: {winnerAverage.toFixed(1)}</div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={onRestart}
          className="w-full rounded-lg py-3 font-semibold"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-background)' }}
        >
          🎯 Start Again
        </button>
        <button
          onClick={onChangeSettings}
          className="w-full rounded-lg py-3 font-semibold"
          style={{ backgroundColor: 'var(--color-secondary)', color: 'var(--color-background)' }}
        >
          ⚙️ Change Game Settings
        </button>
      </div>
    </div>
  );
};