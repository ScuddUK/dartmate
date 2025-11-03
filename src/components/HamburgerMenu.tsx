import React, { useState } from 'react';

interface HamburgerMenuProps {
  viewMode: 'settings' | 'scoreboard' | 'mobile';
  onViewModeChange: (mode: 'settings' | 'scoreboard' | 'mobile') => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ viewMode, onViewModeChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuItemClick = (mode: 'settings' | 'scoreboard' | 'mobile') => {
    onViewModeChange(mode);
    setIsOpen(false);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="text-white p-3 rounded-lg transition-colors duration-200 shadow-lg"
        style={{ backgroundColor: 'var(--color-primary)' }}
        aria-label="Menu"
      >
        <div className="w-6 h-6 flex flex-col justify-center items-center">
          <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : 'mb-1'}`}></div>
          <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isOpen ? 'opacity-0' : 'mb-1'}`}></div>
          <div className={`w-5 h-0.5 bg-white transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></div>
        </div>
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-20 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          
          {/* Menu Items */}
          <div
            className="absolute top-16 right-0 rounded-lg shadow-xl overflow-hidden z-50 min-w-48"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <button
              onClick={() => handleMenuItemClick('scoreboard')}
              className={`w-full px-4 py-3 text-left transition-colors duration-200 flex items-center gap-3 ${
                viewMode === 'scoreboard' ? 'font-semibold' : ''
              }`}
              style={viewMode === 'scoreboard'
                ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-background)' }
                : { color: 'var(--color-text)' }}
            >
              <span className="text-xl">📺</span>
              <span>Scoreboard</span>
            </button>
            
            <button
              onClick={() => handleMenuItemClick('mobile')}
              className={`w-full px-4 py-3 text-left transition-colors duration-200 flex items-center gap-3 ${
                viewMode === 'mobile' ? 'font-semibold' : ''
              }`}
              style={viewMode === 'mobile'
                ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-background)' }
                : { color: 'var(--color-text)' }}
            >
              <span className="text-xl">📱</span>
              <span>Mobile Scorer</span>
            </button>
            
            <button
              onClick={() => handleMenuItemClick('settings')}
              className={`w-full px-4 py-3 text-left transition-colors duration-200 flex items-center gap-3 ${
                viewMode === 'settings' ? 'font-semibold' : ''
              }`}
              style={viewMode === 'settings'
                ? { backgroundColor: 'var(--color-primary)', color: 'var(--color-background)' }
                : { color: 'var(--color-text)' }}
            >
              <span className="text-xl">⚙️</span>
              <span>Settings</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default HamburgerMenu;