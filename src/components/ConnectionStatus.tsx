import React from 'react';

interface ConnectionStatusProps {
  connected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ connected }) => {
  return (
    <div className={`fixed top-4 left-4 z-50 rounded-lg text-sm font-semibold transition-all duration-200 ${
      connected 
        ? 'bg-green-600 text-white' 
        : 'bg-red-600 text-white animate-pulse'
    } ${
      // Mobile: smaller padding for dot-only display
      // Desktop: normal padding for full text display
      'px-2 py-2 md:px-3 md:py-2'
    }`}>
      <div className="flex items-center gap-2">
        {/* Dot indicator - always visible */}
        <div className={`rounded-full transition-all duration-200 ${
          connected ? 'bg-green-300' : 'bg-red-300'
        } ${
          // Mobile: larger dot (since it's the only indicator)
          // Desktop: smaller dot (accompanies text)
          'w-3 h-3 md:w-2 md:h-2'
        }`}></div>
        
        {/* Text - hidden on mobile, visible on desktop */}
        <span className="hidden md:inline">
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;