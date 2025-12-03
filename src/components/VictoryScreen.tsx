import React, { useState, useEffect } from 'react';
import { GameState, Player } from '../types/game';
import { useTheme } from '../contexts/ThemeContext';

interface VictoryScreenProps {
  gameState: GameState;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ gameState }) => {
  const { currentTheme } = useTheme();
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Use the server-provided winner to avoid mismatches
  const winner: Player = (gameState.winner as Player) || gameState.players[0];

  // Prefer match-long average if available; fallback to per-throw calc
  const calculateTotalAverage = (player: Player): number => {
    if (typeof player.matchAverageScore === 'number' && player.matchAverageScore > 0) {
      return player.matchAverageScore;
    }
    if (player.throws.length === 0) return 0;
    const validThrows = player.throws.filter(throwRecord => 
      typeof throwRecord.score === 'number' && throwRecord.score >= 0
    );
    if (validThrows.length === 0) return 0;
    const totalScore = validThrows.reduce((sum, throwRecord) => sum + throwRecord.score, 0);
    return totalScore / validThrows.length;
  };

  const winnerAverage = calculateTotalAverage(winner);

  // Dynamic viewport-based scaling
  const isLandscape = screenSize.width > screenSize.height;
  const viewportMin = Math.min(screenSize.width, screenSize.height);
  const viewportMax = Math.max(screenSize.width, screenSize.height);
  
  // Calculate scale factors based on viewport size
  const baseScale = viewportMin / 400; // Base scale factor
  const textScale = Math.max(0.6, Math.min(2.5, baseScale)); // Constrain text scaling
  const spacingScale = Math.max(0.5, Math.min(2, baseScale)); // Constrain spacing scaling
  
  // Dynamic inline styles for perfect scaling
  const getDynamicStyles = () => ({
    container: {
      padding: `${Math.max(8, 16 * spacingScale)}px`,
      maxHeight: '100vh',
      overflow: 'auto'
    },
    titleText: {
      fontSize: `${Math.max(24, 48 * textScale)}px`,
      lineHeight: '1.1'
    },
    sectionTitle: {
      fontSize: `${Math.max(16, 24 * textScale)}px`,
      lineHeight: '1.2'
    },
    averageNumber: {
      fontSize: `${Math.max(32, 64 * textScale)}px`,
      lineHeight: '1'
    },
    scoreNumber: {
      fontSize: `${Math.max(20, 36 * textScale)}px`,
      lineHeight: '1'
    },
    scoreLabel: {
      fontSize: `${Math.max(12, 16 * textScale)}px`,
      lineHeight: '1.2'
    },
    button: {
      fontSize: `${Math.max(16, 20 * textScale)}px`,
      padding: `${Math.max(8, 12 * spacingScale)}px ${Math.max(16, 24 * spacingScale)}px`,
      lineHeight: '1.2'
    },
    spacing: {
      marginBottom: `${Math.max(12, 24 * spacingScale)}px`
    },
    cardPadding: {
      padding: `${Math.max(12, 24 * spacingScale)}px`
    },
    gridGap: {
      gap: `${Math.max(8, 16 * spacingScale)}px`
    }
  });

  const styles = getDynamicStyles();

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#ffffff', color: '#000000' }}>
      <div 
        className="text-center w-full max-w-4xl bg-white"
        style={styles.container}
      >
        
        {/* Winner Section */}
        <div>
          <div 
            className="flex items-center justify-center flex-wrap"
            style={styles.spacing}
          >
            <h1 
              className="font-bold mr-4"
              style={{ ...styles.titleText, color: '#000000' }}
            >
              WINNER
            </h1>
            <h2 
              className="font-bold mr-4"
              style={{ ...styles.titleText, color: '#000000' }}
            >
              {winner.name}
            </h2>
            <span style={styles.titleText}>
              🏆
            </span>
          </div>

          {/* Total Average Section */}
          <div 
            className="rounded-xl text-center bg-white border"
            style={{ ...styles.cardPadding, ...styles.spacing, borderColor: '#000000' }}
          >
            <h3 
              className="font-bold"
              style={{ ...styles.sectionTitle, marginBottom: `${Math.max(6, 12 * spacingScale)}px`, color: '#000000' }}
            >
              Total Average
            </h3>
            <div 
              className="font-score font-bold"
              style={{ 
                fontSize: `${Math.max(32, 64 * textScale)}px`,
                lineHeight: '1',
                color: '#000000'
              }}
            >
              {winnerAverage.toFixed(1)}
            </div>
          </div>

          {/* Scoreboard should not provide restart controls */}
        </div>
      </div>
    </div>
  );
};