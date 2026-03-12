const DARTBOARD_ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5];

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const weightedPick = (items) => {
  const total = items.reduce((s, it) => s + it.w, 0);
  let r = Math.random() * total;
  for (const it of items) {
    r -= it.w;
    if (r <= 0) return it.v;
  }
  return items[items.length - 1].v;
};

const adjacentSegments = (segment) => {
  const idx = DARTBOARD_ORDER.indexOf(segment);
  if (idx === -1) return [segment];
  const prev = DARTBOARD_ORDER[(idx - 1 + DARTBOARD_ORDER.length) % DARTBOARD_ORDER.length];
  const next = DARTBOARD_ORDER[(idx + 1) % DARTBOARD_ORDER.length];
  return [prev, next];
};

const requiredToWin = (format, target) => (format === 'bestOf' ? Math.ceil(target / 2) : target);

const isCheckoutDart = (remaining) => remaining === 50 || (remaining >= 2 && remaining <= 40 && remaining % 2 === 0);

const buildCheckoutCandidates = (remaining) => {
  const candidates = [];
  if (remaining >= 2 && remaining <= 40 && remaining % 2 === 0) candidates.push({ ring: 'D', seg: remaining / 2 });
  if (remaining === 50) candidates.push({ ring: 'BULL', seg: 25 });
  for (const seg of [20, 19, 18, 17, 16, 15, 14, 13, 12]) {
    candidates.push({ ring: 'T', seg });
  }
  for (const seg of [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10]) {
    candidates.push({ ring: 'S', seg });
  }
  candidates.push({ ring: 'SBULL', seg: 25 });
  return candidates;
};

const scoreForTarget = (t) => {
  if (t.ring === 'BULL') return 50;
  if (t.ring === 'SBULL') return 25;
  if (t.ring === 'T') return t.seg * 3;
  if (t.ring === 'D') return t.seg * 2;
  return t.seg;
};

const isFinishable = (remaining, dartsLeft) => {
  if (remaining === 0) return true;
  if (dartsLeft <= 0) return false;
  if (dartsLeft === 1) return isCheckoutDart(remaining);
  for (const cand of buildCheckoutCandidates(remaining)) {
    const s = scoreForTarget(cand);
    const next = remaining - s;
    if (next < 0 || next === 1) continue;
    if (isFinishable(next, dartsLeft - 1)) return true;
  }
  return false;
};

const planCheckout = (remaining, dartsLeft = 3) => {
  if (remaining <= 1 || remaining > 170) return [];
  const route = [];
  let rem = remaining;
  for (let i = 0; i < dartsLeft; i++) {
    if (rem <= 1) break;
    if (isCheckoutDart(rem) && i === dartsLeft - 1) {
      if (rem === 50) route.push({ ring: 'BULL', seg: 25 });
      else route.push({ ring: 'D', seg: rem / 2 });
      break;
    }
    const candidates = buildCheckoutCandidates(rem).filter((c) => {
      const s = scoreForTarget(c);
      const next = rem - s;
      if (next < 0 || next === 1) return false;
      return isFinishable(next, dartsLeft - i - 1);
    });
    if (candidates.length === 0) break;
    const pick = weightedPick(
      candidates.map((c) => {
        const s = scoreForTarget(c);
        const preferTreble = c.ring === 'T' ? 1.0 : 0.0;
        const preferFinish = isCheckoutDart(rem - s) ? 0.75 : 0.0;
        const w = 1 + preferTreble + preferFinish;
        return { v: c, w };
      })
    );
    route.push(pick);
    rem -= scoreForTarget(pick);
    if (rem === 0) break;
  }
  return route;
};

export class RealisticDartBot {
  constructor(skillLevel, targetAverage = null) {
    this.skillLevel = typeof skillLevel === 'number' ? skillLevel : 5;
    this.targetAverage = typeof targetAverage === 'number' ? targetAverage : null;
    this.ema = null;
  }

  _skillFactor() {
    const avg = this.targetAverage ?? (20 + (this.skillLevel - 1) * 10);
    const avgFactor = clamp((avg - 25) / 85, 0, 1);
    const levelFactor = clamp((this.skillLevel - 1) / 9, 0, 1);
    return clamp(avgFactor * 0.75 + levelFactor * 0.25, 0, 1);
  }

  _adjustment() {
    if (this.targetAverage == null || this.ema == null) return 0;
    const diff = this.targetAverage - this.ema;
    return clamp(diff / 200, -0.12, 0.12);
  }

  _pTreble() {
    const s = this._skillFactor();
    const base = 0.02 + 0.38 * Math.pow(s, 1.6);
    const adj = base + this._adjustment() * 0.25;
    return clamp(adj, 0.01, 0.45);
  }

  _pSingle() {
    const s = this._skillFactor();
    const base = 0.28 + 0.62 * Math.pow(s, 0.75);
    const pT = this._pTreble();
    const adj = base + this._adjustment() * 0.35;
    return clamp(adj, 0.18, Math.max(0.2, 0.97 - pT));
  }

  _pDouble() {
    const s = this._skillFactor();
    const base = 0.06 + 0.46 * Math.pow(s, 1.35);
    const adj = base + this._adjustment() * 0.2;
    return clamp(adj, 0.03, 0.55);
  }

  _throwAtT20() {
    const pT = this._pTreble();
    const pS = this._pSingle();
    const r = Math.random();
    if (r < pT) return 60;
    if (r < pT + pS) return 20;
    const miss = weightedPick([
      { v: 1, w: 0.42 },
      { v: 5, w: 0.42 },
      { v: 20, w: 0.08 },
      { v: 0, w: 0.08 },
    ]);
    return miss;
  }

  _throwAtTarget(target) {
    if (target.ring === 'BULL') {
      const s = this._skillFactor();
      const pBull = clamp(0.12 + 0.45 * Math.pow(s, 1.4), 0.05, 0.65);
      return Math.random() < pBull ? 50 : 25;
    }
    if (target.ring === 'SBULL') {
      const s = this._skillFactor();
      const p25 = clamp(0.65 + 0.25 * Math.pow(s, 0.8), 0.45, 0.92);
      return Math.random() < p25 ? 25 : 50;
    }

    const seg = target.seg;
    const adj = adjacentSegments(seg);
    const s = this._skillFactor();
    const r = Math.random();

    if (target.ring === 'T') {
      const p = this._pTreble();
      if (r < p) return seg * 3;
      if (r < p + clamp(0.55 + 0.25 * s, 0.45, 0.9)) return seg;
      const missSeg = weightedPick([
        { v: adj[0], w: 0.44 },
        { v: adj[1], w: 0.44 },
        { v: seg, w: 0.08 },
        { v: 0, w: 0.04 },
      ]);
      return missSeg;
    }

    if (target.ring === 'D') {
      const p = this._pDouble();
      if (r < p) return seg * 2;
      if (r < p + clamp(0.62 + 0.22 * s, 0.5, 0.92)) return seg;
      const missSeg = weightedPick([
        { v: adj[0], w: 0.45 },
        { v: adj[1], w: 0.45 },
        { v: 0, w: 0.1 },
      ]);
      return missSeg;
    }

    const pSingle = clamp(0.62 + 0.32 * s, 0.45, 0.95);
    if (r < pSingle) return seg;
    const missSeg = weightedPick([
      { v: adj[0], w: 0.44 },
      { v: adj[1], w: 0.44 },
      { v: 0, w: 0.12 },
    ]);
    return missSeg;
  }

  generateTurn(remainingScore, settings = null) {
    let total = 0;
    let rem = remainingScore;

    const shouldCheckout = rem <= 170 && rem > 1;
    const route = shouldCheckout ? planCheckout(rem, 3) : [];

    for (let i = 0; i < 3; i++) {
      if (rem <= 1) break;
      let dartScore = 0;

      if (shouldCheckout && route[i]) {
        dartScore = this._throwAtTarget(route[i]);
      } else if (!shouldCheckout) {
        dartScore = this._throwAtT20();
      } else {
        dartScore = this._throwAtT20();
      }

      total += dartScore;
      rem -= dartScore;
      if (rem === 0) break;
      if (rem < 0 || rem === 1) break;
    }

    if (typeof total === 'number' && total >= 0) {
      const nextEma = this.ema == null ? total : (0.9 * this.ema + 0.1 * total);
      this.ema = nextEma;
    }

    return total;
  }

  getExpectedAverage() {
    return this.targetAverage ?? (20 + (this.skillLevel - 1) * 10);
  }
}
