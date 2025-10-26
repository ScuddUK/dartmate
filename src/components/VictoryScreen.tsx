import React, { useState, useEffect } from 'react';
import { GameState, Player } from '../types/game';

interface VictoryScreenProps {
  gameState: GameState;
  onNewGame: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({ gameState, onNewGame }) => {
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

  // Find the winner
  const winner = gameState.players.reduce((prev, current) => 
    (prev.legsWon > current.legsWon) ? prev : current
  );

  // Calculate total average for the winner
  const calculateTotalAverage = (player: Player): number => {
    if (player.throws.length === 0) return 0;
    const validThrows = player.throws.filter(throwRecord => 
      typeof throwRecord.score === 'number' && throwRecord.score >= 0
    );
    if (validThrows.length === 0) return 0;
    const totalScore = validThrows.reduce((sum, throwRecord) => sum + throwRecord.score, 0);
    return totalScore / validThrows.length;
  };

  // Get winner's top 3 highest scores
  const getWinnerTop3Scores = (): number[] => {
    const winnerScores = winner.throws
      .map(throwRecord => throwRecord.score)
      .filter(score => typeof score === 'number' && score > 0);
    return winnerScores.sort((a, b) => b - a).slice(0, 3);
  };

  const winnerAverage = calculateTotalAverage(winner);
  const top3Scores = getWinnerTop3Scores();

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
    <div className="min-h-screen bg-gradient-to-br from-dart-dark via-gray-900 to-black text-white flex items-center justify-center">
      <div 
        className="text-center w-full max-w-4xl"
        style={styles.container}
      >
        
        {/* Winner Section */}
        <div>
          <div 
            className="flex items-center justify-center flex-wrap"
            style={styles.spacing}
          >
            <h1 
              className="font-bold text-dart-gold mr-4"
              style={styles.titleText}
            >
              WINNER
            </h1>
            <h2 
              className="font-bold text-white mr-4"
              style={styles.titleText}
            >
              {winner.name}
            </h2>
            <span style={styles.titleText}>
              🏆
            </span>
          </div>

          {/* Consolidated Stats Box - Total Average & Top 3 Highest Scores */}
          <div 
            className="bg-gray-800 rounded-xl"
            style={{ ...styles.cardPadding, ...styles.spacing }}
          >
            {/* Total Average Section */}
            <div 
              className="mb-6"
              style={{ marginBottom: `${Math.max(16, 24 * spacingScale)}px` }}
            >
              <h3 
                className="font-bold text-dart-gold"
                style={{ ...styles.sectionTitle, marginBottom: `${Math.max(6, 12 * spacingScale)}px` }}
              >
                Total Average
              </h3>
              <div 
                className="font-bold text-green-400"
                style={{ 
                  fontSize: `${Math.max(28, 48 * textScale)}px`,
                  lineHeight: '1'
                }}
              >
                {winnerAverage.toFixed(1)}
              </div>
            </div>

            {/* Divider */}
            <div 
              className="border-t border-gray-600"
              style={{ marginBottom: `${Math.max(16, 24 * spacingScale)}px` }}
            />

            {/* Top 3 Highest Scores Section */}
            <div>
              <h3 
                className="font-bold text-dart-gold"
                style={{ ...styles.sectionTitle, marginBottom: `${Math.max(12, 16 * spacingScale)}px` }}
              >
                3 Highest Scores
              </h3>
              <div 
                className={`grid ${isLandscape ? 'grid-cols-3' : 'grid-cols-1'}`}
                style={{ gap: `${Math.max(6, 12 * spacingScale)}px` }}
              >
                {top3Scores.length > 0 ? (
                  top3Scores.map((score, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-700 rounded-lg"
                      style={{ padding: `${Math.max(8, 16 * spacingScale)}px` }}
                    >
                      <div 
                        className="font-bold text-dart-gold"
                        style={{ 
                          fontSize: `${Math.max(10, 14 * textScale)}px`,
                          lineHeight: '1.2',
                          marginBottom: `${Math.max(2, 6 * spacingScale)}px`
                        }}
                      >
                        #{index + 1}
                      </div>
                      <div 
                        className="font-bold text-white"
                        style={{ 
                          fontSize: `${Math.max(16, 28 * textScale)}px`,
                          lineHeight: '1'
                        }}
                      >
                        {score}
                      </div>
                    </div>
                  ))
                ) : (
                  <div 
                    className="col-span-full text-gray-400 italic"
                    style={styles.sectionTitle}
                  >
                    No scores recorded
                  </div>
                )}
                
                {/* Fill empty slots if less than 3 scores */}
                {Array.from({ length: Math.max(0, 3 - top3Scores.length) }).map((_, index) => (
                  <div 
                    key={`empty-${index}`} 
                    className="bg-gray-700 rounded-lg opacity-50"
                    style={{ padding: `${Math.max(8, 16 * spacingScale)}px` }}
                  >
                    <div 
                      className="font-bold text-gray-500"
                      style={{ 
                        fontSize: `${Math.max(10, 14 * textScale)}px`,
                        lineHeight: '1.2',
                        marginBottom: `${Math.max(2, 6 * spacingScale)}px`
                      }}
                    >
                      #{top3Scores.length + index + 1}
                    </div>
                    <div 
                      className="font-bold text-gray-500"
                      style={{ 
                        fontSize: `${Math.max(16, 28 * textScale)}px`,
                        lineHeight: '1'
                      }}
                    >
                      -
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Start New Game Button */}
          <button
            onClick={onNewGame}
            className="bg-dart-gold hover:bg-yellow-500 text-black font-bold rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
            style={styles.button}
          >
            🎯 Start New Game
          </button>
        </div>
      </div>
    </div>
  );
};