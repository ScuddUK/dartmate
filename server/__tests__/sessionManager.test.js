import sessionManager, { createSession, getSession } from '../sessionManager.js';

describe('Session Manager', () => {
  test('generates unique 6-char codes', () => {
    const codes = new Set();
    for (let i = 0; i < 200; i++) {
      const { code } = createSession({ startingScore: 501, playerNames: ['A', 'B'] });
      expect(code).toMatch(/^[A-Z2-9]{6}$/);
      expect(codes.has(code)).toBe(false);
      codes.add(code);
    }
  });

  test('session isolation by code', () => {
    const s1 = createSession({ startingScore: 301, playerNames: ['P1', 'P2'] });
    const s2 = createSession({ startingScore: 501, playerNames: ['X', 'Y'] });
    expect(s1.code).not.toEqual(s2.code);
    expect(getSession(s1.code).gameState.settings.startingScore).toBe(301);
    expect(getSession(s2.code).gameState.settings.startingScore).toBe(501);
  });

  test('master code resolves to same session', () => {
    const { code, masterCode } = createSession({ startingScore: 501, playerNames: ['A', 'B'] });
    const primary = getSession(code);
    const viaMaster = getSession(masterCode);
    expect(primary).toBeDefined();
    expect(viaMaster).toBeDefined();
    expect(viaMaster).toBe(primary);
  });

  test('invalid code lookup returns undefined', () => {
    expect(getSession('BAD000')).toBeUndefined();
  });

  test('cleanup removes expired sessions', () => {
    const { code } = createSession({ startingScore: 501, playerNames: ['A', 'B'] });
    const sess = getSession(code);
    // Simulate expiry
    sess.expiresAt = Date.now() - 1000;
    sessionManager.cleanupExpiredSessions();
    expect(getSession(code)).toBeUndefined();
  });
});