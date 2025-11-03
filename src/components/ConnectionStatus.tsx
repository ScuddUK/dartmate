import React from 'react';

interface ConnectionStatusProps {
  connected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ connected }) => {
  return (
    <div 
      className="fixed top-4 left-4 z-50"
      aria-label={connected ? 'Connected' : 'Disconnected'}
      title={connected ? 'Connected' : 'Disconnected'}
    >
      {/* Simple dot indicator without background or outline */}
      <div
        className="rounded-full w-3 h-3"
        style={{
          backgroundColor: connected ? '#22c55e' /* green-500 */ : '#ef4444' /* red-500 */,
        }}
      />
    </div>
  );
};

export default ConnectionStatus;