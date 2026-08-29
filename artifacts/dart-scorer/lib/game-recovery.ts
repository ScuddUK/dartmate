export interface StoredGameSnapshot<
  TOptions,
  TPlayer,
  TLegResult,
  TTurnHistoryEntry,
> {
  version: 1;
  options: TOptions;
  players: [TPlayer, TPlayer];
  currentIdx: 0 | 1;
  legResult: TLegResult | null;
  targetWins: number;
  revision: number;
  updatedAt: number;
  turnHistory: TTurnHistoryEntry[];
}

export interface StoredReconnectSession {
  code: string;
  url: string;
  token: string;
  ts?: number;
}

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return value !== null && typeof value === "object";
}

function isNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return isNonNegativeNumber(value) && Number.isInteger(value);
}

function isGameOptions(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.player1Name === "string" &&
    typeof value.player2Name === "string" &&
    [301, 501, 601, 701].includes(value.startScore as number) &&
    isNonNegativeInteger(value.numLegs) &&
    value.numLegs > 0 &&
    (value.winRule === "first_to" || value.winRule === "best_of")
  );
}

function isThrowRecord(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isNonNegativeNumber(value.prevScore) &&
    isNonNegativeNumber(value.scored) &&
    value.scored <= 180 &&
    isNonNegativeNumber(value.newScore) &&
    (value.bust === undefined || typeof value.bust === "boolean")
  );
}

function isPlayerState(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    typeof value.name === "string" &&
    isNonNegativeNumber(value.score) &&
    Array.isArray(value.history) &&
    value.history.every(isThrowRecord) &&
    isNonNegativeInteger(value.legsWon) &&
    isNonNegativeInteger(value.legThrows) &&
    isNonNegativeInteger(value.overallThrows) &&
    isNonNegativeNumber(value.legTotalScored) &&
    isNonNegativeNumber(value.overallTotalScored)
  );
}

function isLegResult(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    (value.legWinnerIdx === 0 || value.legWinnerIdx === 1) &&
    Array.isArray(value.legsWon) &&
    value.legsWon.length === 2 &&
    value.legsWon.every(isNonNegativeInteger) &&
    typeof value.matchOver === "boolean"
  );
}

function isTurnHistory(value: unknown): boolean {
  return (
    Array.isArray(value) &&
    value.every(
      (entry) =>
        isRecord(entry) &&
        (entry.idx === 0 || entry.idx === 1) &&
        isNonNegativeNumber(entry.ts),
    )
  );
}

export function isDartSyncState(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return (
    isGameOptions(value.options) &&
    Array.isArray(value.players) &&
    value.players.length === 2 &&
    value.players.every(isPlayerState) &&
    (value.currentIdx === 0 || value.currentIdx === 1) &&
    (value.legResult === null || isLegResult(value.legResult)) &&
    isNonNegativeInteger(value.targetWins) &&
    value.targetWins > 0 &&
    (value.revision === undefined || isNonNegativeInteger(value.revision)) &&
    (value.updatedAt === undefined || isNonNegativeNumber(value.updatedAt)) &&
    (value.turnHistory === undefined || isTurnHistory(value.turnHistory))
  );
}

export function gameFingerprint(value: {
  options: unknown;
  players: [unknown, unknown];
  currentIdx: 0 | 1;
  legResult: unknown;
  turnHistory: unknown[];
}): string {
  return JSON.stringify(value);
}

export function revisionOf(value: unknown): number {
  if (
    value !== null &&
    typeof value === "object" &&
    "revision" in value &&
    typeof value.revision === "number" &&
    Number.isFinite(value.revision)
  ) {
    return value.revision;
  }
  return 0;
}

export function shouldAcceptResume(
  localRevision: number,
  hasDurableLocalGame: boolean,
  incoming: unknown,
): boolean {
  const incomingRevision = revisionOf(incoming);
  return (
    incomingRevision > localRevision ||
    (!hasDurableLocalGame && incomingRevision >= localRevision)
  );
}

export function parseReconnectSession(
  raw: string | null,
): StoredReconnectSession | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredReconnectSession>;
    if (
      typeof value.code !== "string" ||
      typeof value.url !== "string" ||
      typeof value.token !== "string"
    ) {
      return null;
    }
    return {
      code: value.code,
      url: value.url,
      token: value.token,
      ...(typeof value.ts === "number" ? { ts: value.ts } : {}),
    };
  } catch {
    return null;
  }
}

export function parseStoredGame<
  TOptions,
  TPlayer,
  TLegResult,
  TTurnHistoryEntry,
>(
  raw: string | null,
): StoredGameSnapshot<TOptions, TPlayer, TLegResult, TTurnHistoryEntry> | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<
      StoredGameSnapshot<TOptions, TPlayer, TLegResult, TTurnHistoryEntry>
    >;
    if (
      !isDartSyncState(value) ||
      value.version !== 1 ||
      !isTurnHistory(value.turnHistory) ||
      !isNonNegativeInteger(value.revision) ||
      !isNonNegativeNumber(value.updatedAt)
    ) {
      return null;
    }
    return value as StoredGameSnapshot<
      TOptions,
      TPlayer,
      TLegResult,
      TTurnHistoryEntry
    >;
  } catch {
    return null;
  }
}