import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ConnectionStatusProps {
  connected: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ connected }) => {
  const { currentTheme } = useTheme();
  
  return (
    <div 
      className={`fixed top-4 left-4 z-50 rounded-full transition-all duration-200 p-2 ${
        connected ? '' : 'animate-pulse'
      }`}
      style={{ backgroundColor: connected ? 'var(--color-accent)' : 'var(--color-error)' }}
    >
      {/* Dot indicator - only visual element */}
      <div className={`rounded-full transition-all duration-200 w-3 h-3 ${
        connected ? 'bg-green-300' : 'bg-red-300'
      }`}></div>
    </div>
  );
};

export default ConnectionStatus;