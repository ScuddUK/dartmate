import React from 'react';
import type { TournamentConfig } from '../types/game';

type Props = {
  value: TournamentConfig;
  onChange: (next: TournamentConfig) => void;
};

const TournamentSettings: React.FC<Props> = ({ value, onChange }) => {
  const shuffle = <T,>(arr: T[]) => {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  const RandomizeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16 3h5v5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 7c-1.6-2.4-4.3-4-7.4-4C8.2 3 4 7.2 4 12c0 1.3.3 2.6.8 3.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 21H3v-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 17c1.6 2.4 4.3 4 7.4 4 5.4 0 9.6-4.2 9.6-9.6 0-1.3-.3-2.6-.8-3.7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );

  const setTeamName = (idx: 0 | 1, name: string) => {
    const next: TournamentConfig = {
      ...value,
      teamNames: idx === 0 ? [name.toUpperCase(), value.teamNames[1]] : [value.teamNames[0], name.toUpperCase()]
    };
    onChange(next);
  };

  const setRosterName = (teamIdx: 0 | 1, slotIdx: number, name: string) => {
    const rosters: [string[], string[]] = [[...(value.rosters?.[0] || [])], [...(value.rosters?.[1] || [])]];
    rosters[teamIdx][slotIdx] = name.toUpperCase();
    onChange({ ...value, rosters });
  };

  const addRosterSlot = (teamIdx: 0 | 1) => {
    const rosters: [string[], string[]] = [[...(value.rosters?.[0] || [])], [...(value.rosters?.[1] || [])]];
    if (rosters[teamIdx].length < 12) rosters[teamIdx].push('');
    if (rosters[teamIdx].length === 0) rosters[teamIdx] = [''];
    onChange({ ...value, rosters });
  };

  const removeRosterSlot = (teamIdx: 0 | 1) => {
    const rosters: [string[], string[]] = [[...(value.rosters?.[0] || [])], [...(value.rosters?.[1] || [])]];
    if (rosters[teamIdx].length > 1) rosters[teamIdx].pop();
    onChange({ ...value, rosters });
  };

  const rosterOptions = (teamIdx: 0 | 1) => (value.rosters?.[teamIdx] || []).map(n => n.trim()).filter(Boolean);

  const setMatchPlayer = (matchId: string, teamIdx: 0 | 1, slotIdx: number, playerName: string) => {
    const matches = (value.matches || []).map(m => {
      if (m.id !== matchId) return m;
      const next = { ...m };
      const list = teamIdx === 0 ? [...(next.team1Players || [])] : [...(next.team2Players || [])];
      list[slotIdx] = playerName.toUpperCase();
      if (teamIdx === 0) next.team1Players = list;
      else next.team2Players = list;
      return next;
    });
    onChange({ ...value, matches });
  };

  const randomFillMatch = (matchId: string) => {
    const getPool = (teamIdx: 0 | 1) => {
      const raw = rosterOptions(teamIdx).map(n => n.toUpperCase());
      return Array.from(new Set(raw));
    };

    const fillSlots = (pool: string[], count: number) => {
      if (count <= 0) return [];
      if (!pool.length) return Array.from({ length: count }, () => '');
      if (pool.length >= count) return shuffle(pool).slice(0, count);
      let bag = shuffle(pool);
      let cursor = 0;
      const picked: string[] = [];
      for (let i = 0; i < count; i++) {
        if (cursor >= bag.length) {
          bag = shuffle(pool);
          cursor = 0;
        }
        picked.push(bag[cursor] || '');
        cursor += 1;
      }
      return picked;
    };

    const pool1 = getPool(0);
    const pool2 = getPool(1);

    const matches = (value.matches || []).map(m => {
      if (m.id !== matchId) return m;
      const t1Count = (m.team1Players || []).length;
      const t2Count = (m.team2Players || []).length;
      return {
        ...m,
        team1Players: fillSlots(pool1, t1Count),
        team2Players: fillSlots(pool2, t2Count)
      };
    });

    onChange({ ...value, matches });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Teams</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Team 1</label>
            <input
              type="text"
              value={value.teamNames[0]}
              onChange={(e) => setTeamName(0, e.target.value)}
              className="w-full px-4 py-3 rounded-lg focus:outline-none uppercase"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Team 2</label>
            <input
              type="text"
              value={value.teamNames[1]}
              onChange={(e) => setTeamName(1, e.target.value)}
              className="w-full px-4 py-3 rounded-lg focus:outline-none uppercase"
              style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
            />
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Team Members (up to 12)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[0, 1].map((t) => (
            <div key={t} className="space-y-2">
              <div className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{value.teamNames[t as 0 | 1]}</div>
              {(value.rosters?.[t as 0 | 1] || ['']).map((name, idx) => (
                <input
                  key={idx}
                  type="text"
                  value={name}
                  onChange={(e) => setRosterName(t as 0 | 1, idx, e.target.value)}
                  className="w-full px-4 py-2 rounded-lg focus:outline-none uppercase"
                  style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                  placeholder={`PLAYER ${idx + 1}`}
                />
              ))}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-background)' }}
                  onClick={() => addRosterSlot(t as 0 | 1)}
                >
                  + Add
                </button>
                <button
                  type="button"
                  className="px-3 py-2 rounded-lg font-semibold"
                  style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  onClick={() => removeRosterSlot(t as 0 | 1)}
                >
                  − Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>Match Setup</h2>
        <div className="space-y-6">
          {(value.matches || []).map((m) => (
            <div key={m.id} className="p-4 rounded-lg" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              <div className="flex items-center justify-between">
                <div className="font-bold" style={{ color: 'var(--color-text)' }}>{m.label}</div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={`Randomize ${m.label}`}
                    className="p-2 rounded-lg active:scale-95 transition-transform"
                    style={{ backgroundColor: 'var(--color-border)', color: 'var(--color-primary)' }}
                    onClick={() => randomFillMatch(m.id)}
                  >
                    <RandomizeIcon />
                  </button>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {m.startingScore} • {m.gameFormat === 'firstTo' ? `First to ${m.legsToWin}` : `Best of ${m.legsToWin}`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {[0, 1].map((teamIdx) => (
                  <div key={teamIdx}>
                    <div className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>{value.teamNames[teamIdx as 0 | 1]}</div>
                    <div className="space-y-2">
                      {(teamIdx === 0 ? (m.team1Players || []) : (m.team2Players || [])).map((sel, i) => (
                        <select
                          key={i}
                          value={sel}
                          onChange={(e) => setMatchPlayer(m.id, teamIdx as 0 | 1, i, e.target.value)}
                          className="w-full px-4 py-2 rounded-lg focus:outline-none uppercase"
                          style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                        >
                          <option value="">Select player…</option>
                          {rosterOptions(teamIdx as 0 | 1).map((name) => (
                            <option key={name} value={name.toUpperCase()}>{name.toUpperCase()}</option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TournamentSettings;
