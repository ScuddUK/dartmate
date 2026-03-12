import type { FC } from 'react';

type LegWonPopupProps = {
  winnerName: string;
  legAverage: number;
  isVisible: boolean;
  onStartNextLeg?: () => void;
};

export const LegWonPopup: FC<LegWonPopupProps> = ({ winnerName, legAverage, isVisible, onStartNextLeg }) => {
  if (!isVisible) return null;

  const avgText = Number.isFinite(legAverage) ? legAverage.toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="bg-white text-black rounded-xl shadow-xl"
        style={{
          width: 'min(92vw, clamp(560px, 66vw, 1040px))',
          padding: 'clamp(20px, 2.2vw, 48px)'
        }}
      >
        <div className="text-center">
          <div className="font-extrabold tracking-wide" style={{ fontSize: 'clamp(28px, 3.2vw, 56px)' }}>
            GAME SHOT
          </div>
          <div className="mt-2 font-bold" style={{ fontSize: 'clamp(22px, 2.6vw, 44px)' }}>
            {winnerName}
          </div>
          <div className="mt-6" style={{ fontSize: 'clamp(18px, 2.1vw, 36px)' }}>
            Leg Average: <span className="font-bold">{avgText}</span>
          </div>
          {onStartNextLeg && (
            <button
              onClick={onStartNextLeg}
              className="mt-8 w-full rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
              style={{
                padding: 'clamp(14px, 1.6vw, 22px)',
                fontSize: 'clamp(18px, 2vw, 32px)'
              }}
            >
              Start Next Leg
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
