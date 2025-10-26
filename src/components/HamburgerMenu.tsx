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
        className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg transition-colors duration-200 shadow-lg"
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
          <div className="absolute top-16 right-0 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50 min-w-48">
            <button
              onClick={() => handleMenuItemClick('scoreboard')}
              className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors duration-200 flex items-center gap-3 ${
                viewMode === 'scoreboard' 
                  ? 'bg-dart-gold text-dart-dark font-semibold' 
                  : 'text-white'
              }`}
            >
              <span className="text-xl">📺</span>
              <span>Scoreboard</span>
            </button>
            
            <button
              onClick={() => handleMenuItemClick('mobile')}
              className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors duration-200 flex items-center gap-3 ${
                viewMode === 'mobile' 
                  ? 'bg-dart-gold text-dart-dark font-semibold' 
                  : 'text-white'
              }`}
            >
              <span className="text-xl">📱</span>
              <span>Mobile Input</span>
            </button>
            
            <button
              onClick={() => handleMenuItemClick('settings')}
              className={`w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors duration-200 flex items-center gap-3 ${
                viewMode === 'settings' 
                  ? 'bg-dart-gold text-dart-dark font-semibold' 
                  : 'text-white'
              }`}
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