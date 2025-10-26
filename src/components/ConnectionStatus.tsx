import React from 'react';

interface ConnectionStatusProps {
  connected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ connected }) => {
  return (
    <div className={`fixed top-4 left-4 z-50 px-3 py-2 rounded-lg text-sm font-semibold ${
      connected 
        ? 'bg-green-600 text-white' 
        : 'bg-red-600 text-white animate-pulse'
    }`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-300' : 'bg-red-300'}`}></div>
        {connected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
};

export default ConnectionStatus;