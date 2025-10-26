import { ThrowRecord } from '../types/game';

export interface DartBotThrow {
  score: number;
  multiplier: number;
  segment: number;
  isDouble?: boolean;
  isTriple?: boolean;
  isBull?: boolean;
  isMiss?: boolean;
}

export class DartBotEngine {
  private skillLevel: number;
  private averageScore: number;
  private accuracy: number;
  private doubleAccuracy: number;
  private tripleAccuracy: number;

  constructor(skillLevel: number) {
    this.skillLevel = skillLevel;
    this.averageScore = 20 + (skillLevel - 1) * 10; // 20-110 range
    
    // Calculate accuracy percentages based on skill level
    this.accuracy = Math.min(0.3 + (skillLevel - 1) * 0.07, 0.95); // 30% to 95%
    this.doubleAccuracy = Math.min(0.1 + (skillLevel - 1) * 0.05, 0.6); // 10% to 60%
    this.tripleAccuracy = Math.min(0.05 + (skillLevel - 1) * 0.03, 0.4); // 5% to 40%
  }

  /**
   * Generate a realistic dart throw based on skill level
   */
  generateThrow(targetScore?: number, isFinishingAttempt: boolean = false): DartBotThrow {
    // If trying to finish, prioritize doubles
    if (isFinishingAttempt && targetScore && targetScore <= 170 && targetScore % 2 === 0) {
      return this.generateFinishingThrow(targetScore);
    }

    // Random number for determining throw quality
    const random = Math.random();
    
    // Miss chance (decreases with skill)
    const missChance = Math.max(0.05, 0.25 - (this.skillLevel - 1) * 0.02);
    if (random < missChance) {
      return { score: 0, multiplier: 1, segment: 0, isMiss: true };
    }

    // Bull chance (increases with skill)
    const bullChance = Math.min(0.02 + (this.skillLevel - 1) * 0.01, 0.15);
    if (random < missChance + bullChance) {
      const isBullseye = Math.random() < this.doubleAccuracy;
      return {
        score: isBullseye ? 50 : 25,
        multiplier: isBullseye ? 2 : 1,
        segment: 25,
        isBull: true
      };
    }

    // Generate regular throw
    return this.generateRegularThrow();
  }

  /**
   * Generate a throw when trying to finish the game
   */
  private generateFinishingThrow(targetScore: number): DartBotThrow {
    const possibleDoubles = [];
    
    // Find possible finishing doubles
    for (let i = 1; i <= 20; i++) {
      if (i * 2 === targetScore) {
        possibleDoubles.push(i);
      }
    }
    
    // Bull finish
    if (targetScore === 50) {
      possibleDoubles.push(25);
    }

    if (possibleDoubles.length > 0 && Math.random() < this.doubleAccuracy) {
      const segment = possibleDoubles[Math.floor(Math.random() * possibleDoubles.length)];
      return {
        score: targetScore,
        multiplier: 2,
        segment,
        isDouble: true
      };
    }

    // If can't hit the double, throw at a high-value target
    return this.generateRegularThrow();
  }

  /**
   * Generate a regular throw (not finishing)
   */
  private generateRegularThrow(): DartBotThrow {
    // Prefer higher value segments based on skill
    const segments = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    
    // Weight towards higher segments for higher skill levels
    const segmentWeights = segments.map((_, index) => {
      const baseWeight = segments.length - index;
      const skillMultiplier = 1 + (this.skillLevel - 1) * 0.2;
      return baseWeight * skillMultiplier;
    });

    const segment = this.weightedRandomChoice(segments, segmentWeights);
    
    // Determine multiplier based on accuracy
    const random = Math.random();
    
    if (random < this.tripleAccuracy) {
      return { score: segment * 3, multiplier: 3, segment, isTriple: true };
    } else if (random < this.tripleAccuracy + this.doubleAccuracy) {
      return { score: segment * 2, multiplier: 2, segment, isDouble: true };
    } else if (random < this.accuracy) {
      return { score: segment, multiplier: 1, segment };
    } else {
      // Missed the target, hit adjacent or lower value
      const adjacentSegments = this.getAdjacentSegments(segment);
      const hitSegment = adjacentSegments[Math.floor(Math.random() * adjacentSegments.length)];
      return { score: hitSegment, multiplier: 1, segment: hitSegment };
    }
  }

  /**
   * Generate a complete turn (3 throws) for the DartBot
   */
  generateTurn(currentScore: number): ThrowRecord[] {
    const throws: ThrowRecord[] = [];
    let remainingScore = currentScore;

    for (let i = 0; i < 3; i++) {
      const isLastThrow = i === 2;
      const isFinishingAttempt = remainingScore <= 170 && remainingScore > 1;
      
      const dartThrow = this.generateThrow(remainingScore, isFinishingAttempt);
      
      // Check for bust conditions
      if (remainingScore - dartThrow.score < 0 || 
          (remainingScore - dartThrow.score === 1) ||
          (remainingScore - dartThrow.score === 0 && !dartThrow.isDouble)) {
        // Bust - remaining throws are 0
        throws.push({
          score: 0,
          multiplier: 1,
          segment: 0,
          timestamp: Date.now() + i
        });
        break;
      }

      throws.push({
        score: dartThrow.score,
        multiplier: dartThrow.multiplier,
        segment: dartThrow.segment,
        timestamp: Date.now() + i
      });

      remainingScore -= dartThrow.score;

      // Game finished
      if (remainingScore === 0 && dartThrow.isDouble) {
        break;
      }
    }

    return throws;
  }

  /**
   * Weighted random choice helper
   */
  private weightedRandomChoice<T>(items: T[], weights: number[]): T {
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return items[i];
      }
    }
    
    return items[items.length - 1];
  }

  /**
   * Get adjacent segments on dartboard
   */
  private getAdjacentSegments(segment: number): number[] {
    const dartboardOrder = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];
    const index = dartboardOrder.indexOf(segment);
    
    if (index === -1) return [segment]; // Bull or invalid segment
    
    const prevIndex = (index - 1 + dartboardOrder.length) % dartboardOrder.length;
    const nextIndex = (index + 1) % dartboardOrder.length;
    
    return [
      dartboardOrder[prevIndex],
      segment,
      dartboardOrder[nextIndex],
      Math.floor(segment / 2), // Lower value miss
      Math.max(1, segment - Math.floor(Math.random() * 5)) // Random lower value
    ];
  }

  /**
   * Get bot skill description
   */
  getSkillDescription(): string {
    if (this.skillLevel <= 3) return 'Beginner';
    if (this.skillLevel <= 6) return 'Intermediate';
    if (this.skillLevel <= 8) return 'Advanced';
    return 'Expert';
  }

  /**
   * Get expected statistics for this skill level
   */
  getExpectedStats() {
    return {
      averageScore: this.averageScore,
      accuracy: Math.round(this.accuracy * 100),
      doubleAccuracy: Math.round(this.doubleAccuracy * 100),
      tripleAccuracy: Math.round(this.tripleAccuracy * 100)
    };
  }
}