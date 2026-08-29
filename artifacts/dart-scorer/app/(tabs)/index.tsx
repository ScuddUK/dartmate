import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ThrowRecord {
  prevScore: number;
  scored: number;
  newScore: number;
  bust?: boolean;
}

interface PlayerState {
  name: string;
  score: number;
  history: ThrowRecord[];
  legsWon: number;
  legTotalScored: number;
  legThrows: number;
  overallTotalScored: number;
  overallThrows: number;
}

interface GameOptions {
  player1Name: string;
  player2Name: string;
  startScore: 301 | 501 | 601 | 701;
  numLegs: number;
  winRule: "first_to" | "best_of";
}

interface LegResult {
  legWinnerIdx: 0 | 1;
  legsWon: [number, number];
  matchOver: boolean;
}

interface SyncState {
  options: GameOptions;
  players: [PlayerState, PlayerState];
  currentIdx: 0 | 1;
  legResult: LegResult | null;
  targetWins: number;
}

type WsPairStatus = "idle" | "connecting" | "waiting" | "paired" | "error";

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_OPTIONS: GameOptions = {
  player1Name: "Player 1",
  player2Name: "Player 2",
  startScore: 501,
  numLegs: 3,
  winRule: "first_to",
};

const C = {
  bg: "#121E12",
  panelBg: "#0D170D",
  panelActive: "#162116",
  accent: "#D4AF37",
  text: "#F0EAD6",
  mutedText: "#6A7C6A",
  score: "#FFFFFF",
  keypadBg: "#0F1A0F",
  keypadBtn: "#1C2C1C",
  keypadBtnBorder: "#2E4A2E",
  clearBtn: "#4A1010",
  clearBtnBorder: "#7A2020",
  clearText: "#FF8888",
  okBtn: "#104A10",
  okBtnBorder: "#207A20",
  okText: "#88FF88",
  bust: "#6A0000",
  activeBorder: "#D4AF37",
  histText: "#8A9E8A",
  strikeText: "#4A5A4A",
  divider: "#1A2A1A",
  modalBg: "#0A140A",
  modalCard: "#112211",
  inputBg: "#0D1A0D",
  segActive: "#D4AF37",
  segText: "#6A7C6A",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePlayer(name: string, startScore: number): PlayerState {
  return {
    name,
    score: startScore,
    history: [],
    legsWon: 0,
    legTotalScored: 0,
    legThrows: 0,
    overallTotalScored: 0,
    overallThrows: 0,
  };
}

function fmtAvg(total: number, throws: number): string {
  if (throws === 0) return "—";
  return (total / throws).toFixed(1);
}

function getTargetWins(opts: GameOptions): number {
  return opts.winRule === "first_to"
    ? opts.numLegs
    : Math.ceil(opts.numLegs / 2);
}

function winRuleLabel(opts: GameOptions): string {
  const target = getTargetWins(opts);
  if (opts.winRule === "first_to") {
    return `First to ${target} leg${target !== 1 ? "s" : ""} wins`;
  }
  return `Best of ${opts.numLegs} (first to ${target})`;
}

// ─── ThrowRow ─────────────────────────────────────────────────────────────────

function ThrowRow({
  record,
  isLatest,
}: {
  record: ThrowRecord;
  isLatest: boolean;
}) {
  if (record.bust) {
    return (
      <View style={s.throwRow}>
        <Text style={s.throwPrev} numberOfLines={1}>{record.prevScore}</Text>
        <Text style={s.throwArrow} numberOfLines={1}>{" → "}</Text>
        <Text style={s.throwScored} numberOfLines={1}>{record.scored}</Text>
        <Text style={s.throwArrow} numberOfLines={1}>{" - "}</Text>
        <Text style={[s.throwNew, s.throwBust, isLatest && s.throwBustLatest]} numberOfLines={1}>
          BUST
        </Text>
      </View>
    );
  }
  return (
    <View style={s.throwRow}>
      <Text style={s.throwPrev} numberOfLines={1}>{record.prevScore}</Text>
      <Text style={s.throwArrow} numberOfLines={1}>{" → "}</Text>
      <Text style={s.throwScored} numberOfLines={1}>{record.scored}</Text>
      <Text style={s.throwArrow} numberOfLines={1}>{" - "}</Text>
      <Text style={[s.throwNew, isLatest && s.throwNewLatest]} numberOfLines={1}>
        {record.newScore}
      </Text>
    </View>
  );
}

// ─── PlayerPanel ──────────────────────────────────────────────────────────────

function PlayerPanel({
  player,
  isActive,
  compact,
  targetWins,
}: {
  player: PlayerState;
  isActive: boolean;
  compact?: boolean;
  targetWins: number;
}) {
  const lastFive = player.history.slice(-5).reverse();

  return (
    <View
      style={[
        s.panel,
        isActive && s.panelActive,
        compact === true && s.panelCompact,
      ]}
    >
      {isActive && <View style={s.panelTopBar} />}

      <Text
        style={[s.panelName, isActive && s.panelNameActive]}
        numberOfLines={1}
      >
        {player.name}
      </Text>

      <Text
        style={[
          s.panelScore,
          isActive && s.panelScoreActive,
          compact === true && s.panelScoreCompact,
        ]}
      >
        {player.score}
      </Text>

      {/* Averages: leg avg (overall avg) */}
      <Text style={s.avgText} numberOfLines={1}>
        {fmtAvg(player.legTotalScored, player.legThrows)}
        {" ("}
        {fmtAvg(player.overallTotalScored, player.overallThrows)}
        {")"}
      </Text>

      {/* Legs dots */}
      <View style={s.legRow}>
        {Array.from({ length: targetWins }).map((_, i) => (
          <View
            key={i}
            style={[s.legDot, i < player.legsWon && s.legDotWon]}
          />
        ))}
      </View>

      <Text style={s.panelHistLabel}>Last throws</Text>

      {/* Fixed-height block always reserved for 5 history rows */}
      <View style={s.throwList}>
        {lastFive.map((r, i) => (
          <ThrowRow key={i} record={r} isLatest={i === 0} />
        ))}
        {lastFive.length === 0 && <Text style={s.noThrows}>—</Text>}
      </View>
    </View>
  );
}

// ─── KeyBtn ───────────────────────────────────────────────────────────────────

function KeyBtn({
  label,
  onPress,
  variant = "default",
  small,
}: {
  label: string;
  onPress: () => void;
  variant?: "default" | "clear" | "ok";
  small?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[
        s.keyBtn,
        variant === "clear" && s.keyBtnClear,
        variant === "ok" && s.keyBtnOk,
      ]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text
        style={[
          s.keyBtnText,
          variant === "clear" && s.keyBtnClearText,
          variant === "ok" && s.keyBtnOkText,
          small === true && s.keyBtnTextSmall,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Keypad ───────────────────────────────────────────────────────────────────

function Keypad({
  activePlayer,
  input,
  bust,
  clearLabel,
  onDigit,
  onClear,
  onOk,
  onOpenOptions,
  onOpenRemote,
  rowHeight = 58,
  fullScreen = false,
  isPaired = false,
}: {
  activePlayer: PlayerState;
  input: string;
  bust: boolean;
  clearLabel: string;
  onDigit: (d: string) => void;
  onClear: () => void;
  onOk: () => void;
  onOpenOptions: () => void;
  onOpenRemote?: () => void;
  rowHeight?: number;
  fullScreen?: boolean;
  isPaired?: boolean;
}) {
  const rh = fullScreen ? { flex: 1 } : { height: rowHeight };

  // Memoize individual digit handlers so every key button identity is stable
  // and doesn't cause re-renders across the whole keypad on every parent state change
  const d1 = useCallback(() => onDigit("1"), [onDigit]);
  const d2 = useCallback(() => onDigit("2"), [onDigit]);
  const d3 = useCallback(() => onDigit("3"), [onDigit]);
  const d4 = useCallback(() => onDigit("4"), [onDigit]);
  const d5 = useCallback(() => onDigit("5"), [onDigit]);
  const d6 = useCallback(() => onDigit("6"), [onDigit]);
  const d7 = useCallback(() => onDigit("7"), [onDigit]);
  const d8 = useCallback(() => onDigit("8"), [onDigit]);
  const d9 = useCallback(() => onDigit("9"), [onDigit]);
  const d0 = useCallback(() => onDigit("0"), [onDigit]);

  return (
    <View style={[s.keypadCol, bust && s.keypadColBust, fullScreen && s.keypadColFull]}>
      {/* Input display */}
      <View style={s.inputDisplay}>
        <TouchableOpacity style={s.menuBtn} onPress={onOpenOptions}>
          <Text style={s.menuIcon}>☰</Text>
        </TouchableOpacity>
        {onOpenRemote && (
          <TouchableOpacity style={s.remoteBtn} onPress={onOpenRemote}>
            <Ionicons
              name={isPaired ? "wifi" : "wifi-outline"}
              size={20}
              color={isPaired ? C.accent : C.mutedText}
            />
          </TouchableOpacity>
        )}
        <Text style={s.inputPlayerName} numberOfLines={1}>
          {activePlayer.name.toUpperCase()}
        </Text>
        <Text style={s.inputRemaining}>{activePlayer.score}</Text>
        <View style={s.inputBar}>
          <Text style={s.inputValue}>{input || " "}</Text>
        </View>
        {bust && <Text style={s.bustLabel}>BUST</Text>}
      </View>

      {/* Number pad */}
      <View style={[s.keypadGrid, fullScreen && s.keypadGridFull]}>
        <View style={[s.keyRow, rh]}>
          <KeyBtn label="1" onPress={d1} />
          <KeyBtn label="2" onPress={d2} />
          <KeyBtn label="3" onPress={d3} />
        </View>
        <View style={[s.keyRow, rh]}>
          <KeyBtn label="4" onPress={d4} />
          <KeyBtn label="5" onPress={d5} />
          <KeyBtn label="6" onPress={d6} />
        </View>
        <View style={[s.keyRow, rh]}>
          <KeyBtn label="7" onPress={d7} />
          <KeyBtn label="8" onPress={d8} />
          <KeyBtn label="9" onPress={d9} />
        </View>
        <View style={[s.keyRow, rh]}>
          <KeyBtn
            label={clearLabel}
            onPress={onClear}
            variant="clear"
            small={clearLabel === "UNDO"}
          />
          <KeyBtn label="0" onPress={d0} />
          <KeyBtn label="OK" onPress={onOk} variant="ok" />
        </View>
      </View>
    </View>
  );
}

// ─── OptionsModal ─────────────────────────────────────────────────────────────

function OptionsModal({
  visible,
  current,
  onApply,
  onClose,
  onUnpair,
}: {
  visible: boolean;
  current: GameOptions;
  onApply: (opts: GameOptions) => void;
  onClose: () => void;
  onUnpair?: () => void;
}) {
  const [p1, setP1] = useState(current.player1Name);
  const [p2, setP2] = useState(current.player2Name);
  const [score, setScore] = useState<301 | 501 | 601 | 701>(current.startScore);
  const [legs, setLegs] = useState(current.numLegs);
  const [rule, setRule] = useState<"first_to" | "best_of">(current.winRule);

  // Snap legs to a valid value for the given rule
  function snapLegs(currentLegs: number, toRule: "first_to" | "best_of"): number {
    if (toRule === "best_of") {
      // Must be odd and >= 3
      let v = Math.max(3, currentLegs);
      if (v % 2 === 0) v += 1;
      return Math.min(v, 9);
    }
    return Math.min(Math.max(1, currentLegs), 10);
  }

  function handleRuleChange(r: "first_to" | "best_of") {
    setRule(r);
    setLegs((n) => snapLegs(n, r));
  }

  function handleLegsDecrement() {
    if (rule === "best_of") setLegs((n) => Math.max(3, n - 2));
    else setLegs((n) => Math.max(1, n - 1));
  }

  function handleLegsIncrement() {
    if (rule === "best_of") setLegs((n) => Math.min(9, n + 2));
    else setLegs((n) => Math.min(10, n + 1));
  }

  useEffect(() => {
    if (visible) {
      setP1(current.player1Name);
      setP2(current.player2Name);
      setScore(current.startScore);
      setLegs(current.numLegs);
      setRule(current.winRule);
    }
  }, [visible]);

  const previewOpts: GameOptions = {
    player1Name: p1,
    player2Name: p2,
    startScore: score,
    numLegs: legs,
    winRule: rule,
  };
  const targetW = getTargetWins(previewOpts);
  const hint =
    rule === "first_to"
      ? `First player to win ${targetW} leg${targetW !== 1 ? "s" : ""} wins the match`
      : `Play up to ${legs} legs — first to win ${targetW} wins the match`;

  function handleApply() {
    onApply({
      player1Name: p1.trim() || "Player 1",
      player2Name: p2.trim() || "Player 2",
      startScore: score,
      numLegs: legs,
      winRule: rule,
    });
  }

  const { height: screenH } = useWindowDimensions();

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <View style={s.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.modalKAV}
        >
          <View style={[s.modalCard, { maxHeight: screenH * 0.78 }]}>
            {/* Header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Game Options</Text>
              <TouchableOpacity onPress={onClose} style={s.modalClose}>
                <Text style={s.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={s.modalScroll}
              contentContainerStyle={s.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Player names */}
              <Text style={s.sectionLabel}>PLAYERS</Text>
              <View style={s.optRow}>
                <Text style={s.optLabel}>Player 1</Text>
                <TextInput
                  style={s.nameInput}
                  value={p1}
                  onChangeText={setP1}
                  placeholder="Player 1"
                  placeholderTextColor={C.mutedText}
                  selectionColor={C.accent}
                  maxLength={16}
                />
              </View>
              <View style={s.optRow}>
                <Text style={s.optLabel}>Player 2</Text>
                <TextInput
                  style={s.nameInput}
                  value={p2}
                  onChangeText={setP2}
                  placeholder="Player 2"
                  placeholderTextColor={C.mutedText}
                  selectionColor={C.accent}
                  maxLength={16}
                />
              </View>

              {/* Starting score */}
              <Text style={[s.sectionLabel, { marginTop: 20 }]}>
                STARTING SCORE
              </Text>
              <View style={s.segRow}>
                {([301, 501, 601, 701] as const).map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[s.segBtn, score === v && s.segBtnActive]}
                    onPress={() => setScore(v)}
                  >
                    <Text
                      style={[s.segBtnText, score === v && s.segBtnTextActive]}
                    >
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Win rule */}
              <Text style={[s.sectionLabel, { marginTop: 20 }]}>
                WIN RULE
              </Text>
              <View style={s.segRow}>
                {(["first_to", "best_of"] as const).map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[s.segBtn, rule === r && s.segBtnActive]}
                    onPress={() => handleRuleChange(r)}
                  >
                    <Text
                      style={[s.segBtnText, rule === r && s.segBtnTextActive]}
                    >
                      {r === "first_to" ? "First to" : "Best of"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Number of legs stepper */}
              <Text style={[s.sectionLabel, { marginTop: 20 }]}>
                {rule === "first_to" ? "TARGET LEGS" : "SERIES LENGTH"}
              </Text>
              <View style={s.stepperRow}>
                <TouchableOpacity style={s.stepperBtn} onPress={handleLegsDecrement}>
                  <Text style={s.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <View style={s.stepperValue}>
                  <Text style={s.stepperValueText}>{legs}</Text>
                </View>
                <TouchableOpacity style={s.stepperBtn} onPress={handleLegsIncrement}>
                  <Text style={s.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.hintText}>{hint}</Text>

              {onUnpair && (
                <>
                  <Text style={[s.sectionLabel, { marginTop: 28 }]}>REMOTE CONNECTION</Text>
                  <TouchableOpacity
                    style={s.rmUnpairSection}
                    onPress={() => { onUnpair(); onClose(); }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="wifi-outline" size={18} color="#FF5555" />
                    <Text style={s.rmUnpairSectionText}>Disconnect Remote Scoring</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>

            {/* Footer buttons */}
            <View style={s.modalFooter}>
              <TouchableOpacity style={s.footerBtnSecondary} onPress={onClose}>
                <Text style={s.footerBtnSecondaryText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.footerBtnPrimary} onPress={handleApply}>
                <Text style={s.footerBtnPrimaryText}>Apply & New Game</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── LegResult Screen ─────────────────────────────────────────────────────────

function LegResultScreen({
  result,
  players,
  targetWins,
  onNextLeg,
  onNewGame,
}: {
  result: LegResult;
  players: [PlayerState, PlayerState];
  targetWins: number;
  onNextLeg: () => void;
  onNewGame: () => void;
}) {
  const winner = players[result.legWinnerIdx];
  const loser = players[result.legWinnerIdx === 0 ? 1 : 0];

  return (
    <View style={s.legScreen}>
      <View style={s.legBullseye}>
        <View style={s.legRing3} />
        <View style={s.legRing2} />
        <View style={s.legBull} />
      </View>

      <Text style={s.legWinnerName}>{winner.name}</Text>
      {result.matchOver ? (
        <>
          <Text style={s.legBigLabel}>WINS THE MATCH!</Text>
          <Text style={s.legScoreRow}>
            {players[0].name}: {result.legsWon[0]} leg
            {result.legsWon[0] !== 1 ? "s" : ""}{"  ·  "}
            {players[1].name}: {result.legsWon[1]} leg
            {result.legsWon[1] !== 1 ? "s" : ""}
          </Text>
          <TouchableOpacity style={s.legBtn} onPress={onNewGame}>
            <Text style={s.legBtnText}>NEW GAME</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={s.legBigLabel}>WINS THE LEG!</Text>
          <Text style={s.legScoreRow}>
            {players[0].name}: {result.legsWon[0]}{"  ·  "}
            {players[1].name}: {result.legsWon[1]}
            {"  (first to "}{targetWins}{")"}
          </Text>
          <Text style={s.legNextHint}>
            {loser.name} throws first in the next leg
          </Text>
          <TouchableOpacity style={s.legBtn} onPress={onNextLeg}>
            <Text style={s.legBtnText}>NEXT LEG</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ─── FirstThrowModal ──────────────────────────────────────────────────────────

function FirstThrowModal({
  visible,
  opts,
  onChoose,
}: {
  visible: boolean;
  opts: GameOptions | null;
  onChoose: (idx: 0 | 1) => void;
}) {
  if (!opts) return null;
  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={s.modalBackdrop}>
        <View style={s.ftCard}>
          <Text style={s.ftTitle}>Who throws first?</Text>
          <Text style={s.ftSub}>New game · {opts.startScore}</Text>
          <View style={s.ftBtnRow}>
            <TouchableOpacity style={s.ftBtn} onPress={() => onChoose(0)} activeOpacity={0.75}>
              <Text style={s.ftBtnText} numberOfLines={1}>
                {opts.player1Name || "Player 1"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.ftBtn} onPress={() => onChoose(1)} activeOpacity={0.75}>
              <Text style={s.ftBtnText} numberOfLines={1}>
                {opts.player2Name || "Player 2"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── RemoteModal ─────────────────────────────────────────────────────────────

const DEFAULT_WS_URL = `wss://${process.env["EXPO_PUBLIC_DOMAIN"] ?? "localhost"}/api/ws`;

function RemoteModal({
  visible,
  role,
  pairStatus,
  pairingCode,
  error,
  onChooseScoreboard,
  onChooseScorer,
  onUnpair,
  onClose,
}: {
  visible: boolean;
  role: "scoreboard" | "scorer" | null;
  pairStatus: WsPairStatus;
  pairingCode: string | null;
  error: string | null;
  onChooseScoreboard: (url: string) => void;
  onChooseScorer: (url: string, code: string) => void;
  onUnpair: () => void;
  onClose: () => void;
}) {
  const { height: screenH } = useWindowDimensions();
  const [step, setStep] = useState<"choose" | "scoreboard" | "scorer">("choose");
  const [serverUrl, setServerUrl] = useState(DEFAULT_WS_URL);
  const [codeInput, setCodeInput] = useState("");
  const [showUrl, setShowUrl] = useState(false);

  useEffect(() => {
    if (visible) {
      if (pairStatus === "paired") {
        setStep(role ?? "choose");
      } else if (role && pairStatus !== "idle") {
        setStep(role);
      } else {
        setStep("choose");
        setCodeInput("");
      }
    }
  }, [visible]);

  if (!visible) return null;

  // ── Already paired: show status ──
  if (pairStatus === "paired") {
    return (
      <Modal visible animationType="fade" transparent statusBarTranslucent>
        <View style={s.modalBackdrop}>
          <View style={s.ftCard}>
            <View style={s.rmConnectedRow}>
              <Ionicons name="wifi" size={26} color={C.accent} />
              <Text style={s.ftTitle}>Connected</Text>
            </View>
            <Text style={s.ftSub}>
              {role === "scoreboard"
                ? "Receiving scores from scoring device"
                : "Sending scores to scoreboard"}
            </Text>
            <TouchableOpacity
              style={s.rmUnpairBtn}
              onPress={() => { onUnpair(); onClose(); }}
              activeOpacity={0.75}
            >
              <Ionicons name="wifi-outline" size={16} color="#FF5555" />
              <Text style={s.rmUnpairBtnText}>Disconnect</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose}>
              <Text style={s.footerBtnSecondaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" transparent statusBarTranslucent>
      <View style={s.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={s.modalKAV}
        >
          <View style={[s.modalCard, { maxHeight: screenH * 0.78 }]}>
            {/* Header */}
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Remote Scoring</Text>
              <TouchableOpacity onPress={onClose} style={s.modalClose}>
                <Text style={s.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={s.modalScroll}
              contentContainerStyle={s.modalScrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* ── Role selection ── */}
              {step === "choose" && (
                <>
                  <Text style={s.sectionLabel}>THIS DEVICE IS</Text>
                  <View style={s.ftBtnRow}>
                    <TouchableOpacity
                      style={s.ftBtn}
                      onPress={() => setStep("scoreboard")}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="tv-outline" size={30} color={C.accent} />
                      <Text style={[s.ftBtnText, { marginTop: 10 }]}>Scoreboard</Text>
                      <Text style={s.rmRoleHint}>Display on TV</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.ftBtn}
                      onPress={() => setStep("scorer")}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="phone-portrait-outline" size={30} color={C.accent} />
                      <Text style={[s.ftBtnText, { marginTop: 10 }]}>Scoring</Text>
                      <Text style={s.rmRoleHint}>Enter scores</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => setShowUrl((v) => !v)}
                    style={{ marginTop: 20 }}
                  >
                    <Text style={s.rmUrlToggle}>
                      {showUrl ? "▲ Hide server URL" : "▼ Change server URL"}
                    </Text>
                  </TouchableOpacity>
                  {showUrl && (
                    <>
                      <Text style={[s.sectionLabel, { marginTop: 12 }]}>SERVER URL</Text>
                      <TextInput
                        style={s.nameInput}
                        value={serverUrl}
                        onChangeText={setServerUrl}
                        placeholder="wss://your-server/api/ws"
                        placeholderTextColor={C.mutedText}
                        selectionColor={C.accent}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <Text style={s.hintText}>
                        Defaults to the current Replit domain. Update after deploying to production.
                      </Text>
                    </>
                  )}
                </>
              )}

              {/* ── Scoreboard: show code ── */}
              {step === "scoreboard" && (
                <>
                  {pairStatus === "idle" && (
                    <>
                      <Text style={s.sectionLabel}>SCOREBOARD MODE</Text>
                      <Text style={s.rmBodyText}>
                        Generate a pairing code and enter it on the scoring device to connect.
                      </Text>
                    </>
                  )}
                  {pairStatus === "connecting" && (
                    <Text style={s.rmBodyText}>Connecting to server…</Text>
                  )}
                  {pairStatus === "waiting" && pairingCode && (
                    <>
                      <Text style={s.sectionLabel}>YOUR PAIRING CODE</Text>
                      <View style={s.rmCodeBox}>
                        {pairingCode.split("").map((d, i) => (
                          <View key={i} style={s.rmCodeDigit}>
                            <Text style={s.rmCodeDigitText}>{d}</Text>
                          </View>
                        ))}
                      </View>
                      <Text style={[s.hintText, { textAlign: "center", marginTop: 12 }]}>
                        Enter this code on the scoring device
                      </Text>
                      <Text style={[s.rmBodyText, { color: C.accent, textAlign: "center", marginTop: 6 }]}>
                        ⏳ Waiting for scoring device…
                      </Text>
                    </>
                  )}
                  {pairStatus === "error" && (
                    <Text style={[s.rmBodyText, { color: "#FF5555" }]}>
                      {error ?? "Connection failed"}
                    </Text>
                  )}
                </>
              )}

              {/* ── Scorer: enter code ── */}
              {step === "scorer" && (
                <>
                  <Text style={s.sectionLabel}>SCORING MODE</Text>
                  <Text style={s.rmBodyText}>
                    Enter the 6-digit code shown on the scoreboard device.
                  </Text>
                  <Text style={[s.sectionLabel, { marginTop: 16 }]}>PAIRING CODE</Text>
                  <TextInput
                    style={s.rmCodeInput}
                    value={codeInput}
                    onChangeText={(t) => setCodeInput(t.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    placeholderTextColor={C.mutedText}
                    selectionColor={C.accent}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                  {pairStatus === "error" && (
                    <Text style={[s.rmBodyText, { color: "#FF5555", marginTop: 8 }]}>
                      {error ?? "Invalid pairing code — check and retry"}
                    </Text>
                  )}
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={s.modalFooter}>
              <TouchableOpacity
                style={s.footerBtnSecondary}
                onPress={() =>
                  step !== "choose" && pairStatus === "idle"
                    ? setStep("choose")
                    : onClose()
                }
              >
                <Text style={s.footerBtnSecondaryText}>
                  {step !== "choose" && pairStatus === "idle" ? "Back" : "Cancel"}
                </Text>
              </TouchableOpacity>

              {step === "scoreboard" && (pairStatus === "idle" || pairStatus === "error") && (
                <TouchableOpacity
                  style={s.footerBtnPrimary}
                  onPress={() => onChooseScoreboard(serverUrl)}
                >
                  <Text style={s.footerBtnPrimaryText}>
                    {pairStatus === "error" ? "Retry" : "Generate Code"}
                  </Text>
                </TouchableOpacity>
              )}

              {step === "scorer" && (
                <TouchableOpacity
                  style={[
                    s.footerBtnPrimary,
                    (codeInput.length !== 6 || pairStatus === "connecting") && { opacity: 0.45 },
                  ]}
                  onPress={() => {
                    if (codeInput.length === 6 && pairStatus !== "connecting") {
                      onChooseScorer(serverUrl, codeInput);
                    }
                  }}
                  disabled={codeInput.length !== 6 || pairStatus === "connecting"}
                >
                  <Text style={s.footerBtnPrimaryText}>
                    {pairStatus === "connecting" ? "Connecting…" : "Connect"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function DartScorer() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [options, setOptions] = useState<GameOptions>(DEFAULT_OPTIONS);
  const [players, setPlayers] = useState<[PlayerState, PlayerState]>([
    makePlayer(DEFAULT_OPTIONS.player1Name, DEFAULT_OPTIONS.startScore),
    makePlayer(DEFAULT_OPTIONS.player2Name, DEFAULT_OPTIONS.startScore),
  ]);
  const [currentIdx, setCurrentIdx] = useState<0 | 1>(0);
  const [input, setInput] = useState("");
  const [turnHistory, setTurnHistory] = useState<{ idx: 0 | 1; ts: number }[]>([]);
  const [bust, setBust] = useState(false);
  const [legResult, setLegResult] = useState<LegResult | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [pendingOptions, setPendingOptions] = useState<GameOptions | null>(null);

  // ── Remote / WebSocket state ──
  const wsRef = useRef<WebSocket | null>(null);
  const wsRoleRef = useRef<"scoreboard" | "scorer" | null>(null);
  const [wsRole, setWsRole] = useState<"scoreboard" | "scorer" | null>(null);
  const [wsPairStatus, setWsPairStatus] = useState<WsPairStatus>("idle");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [showRemote, setShowRemote] = useState(false);
  const [remoteGameState, setRemoteGameState] = useState<SyncState | null>(null);
  const [wsError, setWsError] = useState<string | null>(null);

  // ── Scorer auto-reconnect ──────────────────────────────────────────────────
  const lastScorerUrlRef = useRef<string | null>(null);
  const lastScorerCodeRef = useRef<string | null>(null);
  const manualDisconnectRef = useRef(false);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectBackoffRef = useRef(1000);

  // ── Rejoin last game ──────────────────────────────────────────────────────
  const [rejoinInfo, setRejoinInfo] = useState<{ code: string; url: string } | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("dartmate_last_session").then((raw) => {
      if (!raw) return;
      try {
        const { code, url, ts } = JSON.parse(raw) as { code: string; url: string; ts: number };
        if (Date.now() - ts < 10 * 60 * 1000) {
          setRejoinInfo({ code, url });
        } else {
          AsyncStorage.removeItem("dartmate_last_session");
        }
      } catch {
        AsyncStorage.removeItem("dartmate_last_session");
      }
    });
  }, []);

  const targetWins = getTargetWins(options);

  const hapticLight = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const hapticMed = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  const hapticError = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  const hapticSuccess = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  const hapticWarn = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

  // ── WebSocket helpers ──
  function wsSend(data: object) {
    const ws = wsRef.current;
    if (ws?.readyState === 1) ws.send(JSON.stringify(data));
  }

  function handleWsMsg(msg: Record<string, unknown>) {
    const t = msg.type as string;
    if (t === "code") {
      setPairingCode(msg.code as string);
      setWsPairStatus("waiting");
    } else if (t === "paired") {
      setWsPairStatus("paired");
      setShowRemote(false);
      setRejoinInfo(null);
      // If we're the scorer, save session info to AsyncStorage so the
      // "Rejoin last game" prompt can appear if the app restarts within 10 min
      if (wsRoleRef.current === "scorer" && lastScorerCodeRef.current && lastScorerUrlRef.current) {
        AsyncStorage.setItem(
          "dartmate_last_session",
          JSON.stringify({
            code: lastScorerCodeRef.current,
            url: lastScorerUrlRef.current,
            ts: Date.now(),
          }),
        );
      }
      // NOTE: Do NOT beam state here — the sync useEffect fires automatically
      // when wsPairStatus changes to "paired", and the server will send a
      // "resume" message if there is cached state from a previous connection.
    } else if (t === "resume") {
      // Server is replaying cached game state — this happens when the app
      // reconnects after a drop. Overwrite local game state so the app
      // resumes exactly where it left off.
      const gs = msg.payload as SyncState;
      setOptions(gs.options);
      setPlayers(gs.players);
      setCurrentIdx(gs.currentIdx);
      setLegResult(gs.legResult);
      // Don't touch input/bust — they're transient UI state
    } else if (t === "state") {
      setRemoteGameState(msg.payload as SyncState);
    } else if (t === "peer_disconnected") {
      setWsPairStatus("waiting");
    } else if (t === "peer_reconnected") {
      // Scoreboard came back online — we're still paired, no action needed
    } else if (t === "unpaired") {
      doUnpairLocal();
    } else if (t === "error") {
      setWsError((msg.message as string) ?? "Connection error");
      setWsPairStatus("error");
    }
  }

  function openAndInit(url: string, onOpen: (ws: WebSocket) => void) {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;
      setWsPairStatus("connecting");
      setWsError(null);
      ws.onopen = () => {
        reconnectBackoffRef.current = 1000;
        onOpen(ws);
      };
      ws.onmessage = (e: MessageEvent<string>) => {
        try { handleWsMsg(JSON.parse(e.data) as Record<string, unknown>); } catch {}
      };
      ws.onerror = () => {
        setWsPairStatus("error");
        setWsError("Could not connect to server");
      };
      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
        // Only the scorer auto-reconnects — it's the source of truth for
        // game state, so resuming the same session re-pushes current
        // scores/settings instead of leaving the scoreboard stale.
        if (
          wsRoleRef.current === "scorer" &&
          !manualDisconnectRef.current &&
          lastScorerUrlRef.current &&
          lastScorerCodeRef.current
        ) {
          setWsPairStatus("connecting");
          reconnectTimeoutRef.current = setTimeout(() => {
            if (manualDisconnectRef.current) return;
            reconnectBackoffRef.current = Math.min(reconnectBackoffRef.current * 1.5, 5000);
            initScorer(lastScorerUrlRef.current!, lastScorerCodeRef.current!);
          }, reconnectBackoffRef.current);
        }
      };
    } catch {
      setWsPairStatus("error");
      setWsError("Invalid server URL");
    }
  }

  function initScoreboard(url: string) {
    manualDisconnectRef.current = false;
    wsRoleRef.current = "scoreboard";
    setWsRole("scoreboard");
    openAndInit(url, (ws) => ws.send(JSON.stringify({ type: "generate_code" })));
  }

  function initScorer(url: string, code: string) {
    manualDisconnectRef.current = false;
    lastScorerUrlRef.current = url;
    lastScorerCodeRef.current = code;
    wsRoleRef.current = "scorer";
    setWsRole("scorer");
    openAndInit(url, (ws) => ws.send(JSON.stringify({ type: "join", code })));
  }

  function doUnpairLocal() {
    manualDisconnectRef.current = true;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    lastScorerUrlRef.current = null;
    lastScorerCodeRef.current = null;
    wsRoleRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    setWsRole(null);
    setWsPairStatus("idle");
    setPairingCode(null);
    setRemoteGameState(null);
    setWsError(null);
    setRejoinInfo(null);
    AsyncStorage.removeItem("dartmate_last_session");
  }

  function rejoinLastGame() {
    if (!rejoinInfo) return;
    setRejoinInfo(null);
    initScorer(rejoinInfo.url, rejoinInfo.code);
  }

  function handleUnpair() {
    wsSend({ type: "unpair" });
    doUnpairLocal();
  }

  const handleDigit = useCallback(
    (d: string) => {
      if (legResult) return;
      setInput((prev) => (prev.length >= 3 ? prev : prev + d));
      hapticLight();
    },
    [legResult],
  );

  const handleClear = useCallback(() => {
    if (legResult) return;
    if (input.length > 0) {
      setInput("");
      hapticMed();
      return;
    }
    if (turnHistory.length === 0) return;

    const { idx: playerIdx } = turnHistory[turnHistory.length - 1];

    setPlayers((prev) => {
      const next: [PlayerState, PlayerState] = [{ ...prev[0] }, { ...prev[1] }];
      const p = { ...next[playerIdx] };
      if (p.history.length === 0) return prev;
      const last = p.history[p.history.length - 1];
      p.score = last.prevScore;
      p.history = p.history.slice(0, -1);
      if (!last.bust) {
        p.legTotalScored = Math.max(0, p.legTotalScored - last.scored);
        p.overallTotalScored = Math.max(0, p.overallTotalScored - last.scored);
      }
      p.legThrows = Math.max(0, p.legThrows - 1);
      p.overallThrows = Math.max(0, p.overallThrows - 1);
      next[playerIdx] = p;
      return next;
    });

    setCurrentIdx(playerIdx);
    setTurnHistory((prev) => prev.slice(0, -1));
    hapticWarn();
  }, [input, turnHistory, legResult]);

  const handleOk = useCallback(() => {
    if (legResult || input.length === 0) return;
    const scored = parseInt(input, 10);
    const player = players[currentIdx];

    if (isNaN(scored) || scored < 0 || scored > 180) {
      setInput("");
      return;
    }

    // Bust: overshoot OR would leave exactly 1 (no double = 1 exists)
    const wouldLeave = player.score - scored;
    const isBust = scored > player.score || wouldLeave === 1;
    if (isBust) {
      setBust(true);
      setTimeout(() => setBust(false), 600);
      const bustRecord: ThrowRecord = {
        prevScore: player.score,
        scored,
        newScore: player.score,
        bust: true,
      };
      setPlayers((prev) => {
        const next: [PlayerState, PlayerState] = [{ ...prev[0] }, { ...prev[1] }];
        const p = next[currentIdx];
        next[currentIdx] = {
          ...p,
          history: [...p.history, bustRecord],
          legThrows: p.legThrows + 1,
          overallThrows: p.overallThrows + 1,
        };
        return next;
      });
      setTurnHistory((prev) => [...prev, { idx: currentIdx, ts: Date.now() }]);
      setInput("");
      setCurrentIdx((prev) => (prev === 0 ? 1 : 0));
      hapticError();
      return;
    }

    const newScore = player.score - scored;
    const record: ThrowRecord = { prevScore: player.score, scored, newScore };

    const updatedHistory = [...player.history, record];

    if (newScore === 0) {
      // Leg won
      const newLegsWon: [number, number] = [players[0].legsWon, players[1].legsWon];
      newLegsWon[currentIdx]++;

      const matchOver = newLegsWon[currentIdx] >= targetWins;

      setPlayers((prev) => {
        const next: [PlayerState, PlayerState] = [{ ...prev[0] }, { ...prev[1] }];
        const p = next[currentIdx];
        next[currentIdx] = {
          ...p,
          score: 0,
          history: updatedHistory,
          legsWon: newLegsWon[currentIdx],
          legTotalScored: p.legTotalScored + scored,
          legThrows: p.legThrows + 1,
          overallTotalScored: p.overallTotalScored + scored,
          overallThrows: p.overallThrows + 1,
        };
        return next;
      });

      setTurnHistory((prev) => [...prev, { idx: currentIdx, ts: Date.now() }]);
      setInput("");
      setLegResult({ legWinnerIdx: currentIdx, legsWon: newLegsWon, matchOver });
      hapticSuccess();
      return;
    }

    setPlayers((prev) => {
      const next: [PlayerState, PlayerState] = [{ ...prev[0] }, { ...prev[1] }];
      const p = next[currentIdx];
      next[currentIdx] = {
        ...p,
        score: newScore,
        history: updatedHistory,
        legTotalScored: p.legTotalScored + scored,
        legThrows: p.legThrows + 1,
        overallTotalScored: p.overallTotalScored + scored,
        overallThrows: p.overallThrows + 1,
      };
      return next;
    });
    setTurnHistory((prev) => [...prev, { idx: currentIdx, ts: Date.now() }]);
    setInput("");
    setCurrentIdx((prev) => (prev === 0 ? 1 : 0));
    hapticMed();
  }, [input, players, currentIdx, legResult, targetWins]);

  const handleNextLeg = useCallback(() => {
    if (!legResult) return;
    const nextPlayerIdx: 0 | 1 = legResult.legWinnerIdx === 0 ? 1 : 0;
    setPlayers((prev) => [
      { ...prev[0], score: options.startScore, history: [], legTotalScored: 0, legThrows: 0 },
      { ...prev[1], score: options.startScore, history: [], legTotalScored: 0, legThrows: 0 },
    ]);
    setCurrentIdx(nextPlayerIdx);
    setInput("");
    setTurnHistory([]);
    setLegResult(null);
  }, [legResult, options.startScore]);

  const handleNewGame = useCallback(
    (opts?: GameOptions, firstPlayerIdx: 0 | 1 = 0) => {
      const o = opts ?? options;
      setPlayers([
        makePlayer(o.player1Name, o.startScore),
        makePlayer(o.player2Name, o.startScore),
      ]);
      setCurrentIdx(firstPlayerIdx);
      setInput("");
      setTurnHistory([]);
      setLegResult(null);
      if (opts) setOptions(opts);
    },
    [options],
  );

  const handleApplyOptions = useCallback((opts: GameOptions) => {
    setShowOptions(false);
    setPendingOptions(opts);
  }, []);

  const handleFirstThrowChosen = useCallback((idx: 0 | 1) => {
    if (!pendingOptions) return;
    handleNewGame(pendingOptions, idx);
    setPendingOptions(null);
  }, [pendingOptions, handleNewGame]);

  // ── Sync game state to paired scoreboard ──
  useEffect(() => {
    if (wsRole === "scorer" && wsPairStatus === "paired") {
      wsSend({
        type: "state",
        payload: { options, players, currentIdx, legResult, targetWins },
      });
    }
  }, [players, currentIdx, legResult, options, targetWins, wsRole, wsPairStatus]);

  const clearLabel = input.length > 0 ? "C" : "UNDO";
  const activePlayer = players[currentIdx];

  const sharedInsets = {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  const keypadProps = {
    activePlayer,
    input,
    bust,
    clearLabel,
    onDigit: handleDigit,
    onClear: handleClear,
    onOk: handleOk,
    onOpenOptions: () => setShowOptions(true),
    onOpenRemote: () => setShowRemote(true),
    isPaired: wsPairStatus === "paired",
  };

  const rejoinBanner =
    rejoinInfo && wsPairStatus === "idle" ? (
      <Modal visible animationType="fade" transparent statusBarTranslucent>
        <View style={s.rejoinBackdrop}>
          <View style={s.rejoinCard}>
            <Ionicons name="reload-circle-outline" size={38} color={C.accent} style={{ marginBottom: 10 }} />
            <Text style={s.rejoinCardTitle}>Game in progress</Text>
            <Text style={s.rejoinCardSub}>
              A recent game is still running on the scoreboard.{"\n"}Would you like to rejoin?
            </Text>
            <TouchableOpacity style={s.rejoinBtn} onPress={rejoinLastGame} activeOpacity={0.75}>
              <Text style={s.rejoinBtnText}>Rejoin Game</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.rejoinDismissBtn}
              onPress={() => { setRejoinInfo(null); AsyncStorage.removeItem("dartmate_last_session"); }}
              activeOpacity={0.75}
            >
              <Text style={s.rejoinDismissText}>New Game</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    ) : null;

  const sharedModals = (
    <>
      {rejoinBanner}
      <OptionsModal
        visible={showOptions}
        current={options}
        onApply={handleApplyOptions}
        onClose={() => setShowOptions(false)}
        onUnpair={wsRole === "scorer" && wsPairStatus === "paired" ? handleUnpair : undefined}
      />
      <FirstThrowModal
        visible={pendingOptions !== null}
        opts={pendingOptions}
        onChoose={handleFirstThrowChosen}
      />
      <RemoteModal
        visible={showRemote}
        role={wsRole}
        pairStatus={wsPairStatus}
        pairingCode={pairingCode}
        error={wsError}
        onChooseScoreboard={initScoreboard}
        onChooseScorer={initScorer}
        onUnpair={handleUnpair}
        onClose={() => setShowRemote(false)}
      />
    </>
  );

  // ── Scoreboard mode: display-only panels, receives state via WS ──
  if (wsRole === "scoreboard" && wsPairStatus === "paired") {
    const gs = remoteGameState;
    const dispPlayers = gs?.players ?? players;
    const dispCurrentIdx = gs?.currentIdx ?? currentIdx;
    const dispLegResult = gs?.legResult ?? null;
    const dispTargetWins = gs?.targetWins ?? targetWins;

    const sbRemoteModal = (
      <RemoteModal
        visible={showRemote}
        role={wsRole}
        pairStatus={wsPairStatus}
        pairingCode={pairingCode}
        error={wsError}
        onChooseScoreboard={initScoreboard}
        onChooseScorer={initScorer}
        onUnpair={handleUnpair}
        onClose={() => setShowRemote(false)}
      />
    );
    const sbConnBtn = (
      <TouchableOpacity style={s.sbConnBtn} onPress={() => setShowRemote(true)}>
        <Ionicons name="wifi" size={14} color={C.accent} />
      </TouchableOpacity>
    );

    if (dispLegResult) {
      return (
        <View style={[s.root, sharedInsets]}>
          <StatusBar barStyle="light-content" backgroundColor={C.bg} />
          <LegResultScreen
            result={dispLegResult}
            players={dispPlayers}
            targetWins={dispTargetWins}
            onNextLeg={() => {}}
            onNewGame={() => {}}
          />
          {sbConnBtn}
          {sbRemoteModal}
        </View>
      );
    }

    if (isLandscape) {
      return (
        <View style={[s.root, sharedInsets]}>
          <StatusBar barStyle="light-content" backgroundColor={C.bg} />
          <View style={s.sbRow}>
            <PlayerPanel player={dispPlayers[0]} isActive={dispCurrentIdx === 0} targetWins={dispTargetWins} />
            <PlayerPanel player={dispPlayers[1]} isActive={dispCurrentIdx === 1} targetWins={dispTargetWins} />
          </View>
          {sbConnBtn}
          {sbRemoteModal}
        </View>
      );
    }

    return (
      <View style={[s.root, sharedInsets]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={s.sbStack}>
          <PlayerPanel player={dispPlayers[0]} isActive={dispCurrentIdx === 0} targetWins={dispTargetWins} />
          <View style={s.portraitPanelDivider} />
          <PlayerPanel player={dispPlayers[1]} isActive={dispCurrentIdx === 1} targetWins={dispTargetWins} />
        </View>
        {sbConnBtn}
        {sbRemoteModal}
      </View>
    );
  }

  // ── Scoring mode: full-screen keypad, sends state via WS ──
  if (wsRole === "scorer" && wsPairStatus === "paired") {
    if (legResult) {
      return (
        <View style={[s.root, sharedInsets]}>
          <StatusBar barStyle="light-content" backgroundColor={C.bg} />
          <LegResultScreen
            result={legResult}
            players={players}
            targetWins={targetWins}
            onNextLeg={handleNextLeg}
            onNewGame={() => setPendingOptions(options)}
          />
          {sharedModals}
        </View>
      );
    }
    return (
      <View style={[s.root, sharedInsets]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <Keypad {...keypadProps} fullScreen />
        {sharedModals}
      </View>
    );
  }

  // ── Leg / Match result overlay ──
  if (legResult) {
    return (
      <View style={[s.root, sharedInsets]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <LegResultScreen
          result={legResult}
          players={players}
          targetWins={targetWins}
          onNextLeg={handleNextLeg}
          onNewGame={() => setPendingOptions(options)}
        />
        {sharedModals}
      </View>
    );
  }

  // ── Landscape ──
  if (isLandscape) {
    return (
      <View style={[s.root, sharedInsets]}>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <View style={s.landscapeRow}>
          <PlayerPanel
            player={players[0]}
            isActive={currentIdx === 0}
            targetWins={targetWins}
          />
          <Keypad {...keypadProps} rowHeight={50} />
          <PlayerPanel
            player={players[1]}
            isActive={currentIdx === 1}
            targetWins={targetWins}
          />
        </View>
        {sharedModals}
      </View>
    );
  }

  // ── Portrait ──
  return (
    <View style={[s.root, sharedInsets]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />
      <View style={s.portraitTop}>
        <PlayerPanel
          player={players[0]}
          isActive={currentIdx === 0}
          compact
          targetWins={targetWins}
        />
        <View style={s.portraitPanelDivider} />
        <PlayerPanel
          player={players[1]}
          isActive={currentIdx === 1}
          compact
          targetWins={targetWins}
        />
      </View>
      <View style={s.horizontalDivider} />
      <View style={s.portraitBottom}>
        <Keypad {...keypadProps} rowHeight={50} />
      </View>
      {sharedModals}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const HIST_ROW_H = 26;
const HIST_GAP = 5;
const HIST_ROWS = 5;

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Landscape ──
  landscapeRow: { flex: 1, flexDirection: "row" },

  // ── Portrait ──
  portraitTop: { flex: 3, flexDirection: "row" },
  portraitPanelDivider: { width: 1, backgroundColor: C.divider },
  horizontalDivider: { height: 1, backgroundColor: C.divider },
  portraitBottom: { flex: 2 },

  // ── Player panel ──
  panel: {
    flex: 3,
    backgroundColor: C.panelBg,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: "center",
    borderRightWidth: 1,
    borderLeftWidth: 1,
    borderColor: C.divider,
  },
  panelCompact: {
    flex: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  panelActive: { backgroundColor: C.panelActive, borderColor: C.activeBorder },
  panelTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: C.accent,
  },
  panelName: {
    color: C.mutedText,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginTop: 6,
    textTransform: "uppercase",
  },
  panelNameActive: { color: C.accent },
  panelScore: {
    color: C.score,
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    lineHeight: 60,
    marginVertical: 2,
  },
  panelScoreActive: { color: C.accent },
  panelScoreCompact: { fontSize: 42, lineHeight: 50 },

  // Leg dots
  legRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 6,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  legDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.mutedText,
    backgroundColor: "transparent",
  },
  legDotWon: { backgroundColor: C.accent, borderColor: C.accent },

  avgText: {
    color: C.histText,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  panelHistLabel: {
    color: C.mutedText,
    fontSize: 9,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 6,
  },

  // Throw history list — fixed minimum height for 5 rows
  throwList: {
    width: "100%",
    gap: HIST_GAP,
    minHeight: HIST_ROWS * HIST_ROW_H + (HIST_ROWS - 1) * HIST_GAP,
  },
  throwRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: HIST_ROW_H,
  },
  throwPrev: {
    color: C.strikeText,
    fontSize: 20,
    fontFamily: "Inter_400Regular",
    textDecorationLine: "line-through",
    lineHeight: HIST_ROW_H,
  },
  throwArrow: {
    color: C.mutedText,
    fontSize: 17,
    fontFamily: "Inter_400Regular",
    lineHeight: HIST_ROW_H,
  },
  throwScored: {
    color: C.histText,
    fontSize: 20,
    fontFamily: "Inter_500Medium",
    lineHeight: HIST_ROW_H,
  },
  throwNew: {
    color: C.histText,
    fontSize: 20,
    fontFamily: "Inter_500Medium",
    lineHeight: HIST_ROW_H,
  },
  throwNewLatest: {
    color: C.accent,
    fontFamily: "Inter_700Bold",
    fontSize: 21,
  },
  throwBust: {
    color: "#CC4444",
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  throwBustLatest: {
    color: C.accent,
    fontSize: 19,
  },
  noThrows: {
    color: C.mutedText,
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },

  // ── Keypad ──
  keypadCol: {
    flex: 4,
    backgroundColor: C.keypadBg,
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  keypadColBust: { backgroundColor: C.bust },

  inputDisplay: {
    backgroundColor: "#0A120A",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 1,
    borderWidth: 1,
    borderColor: C.divider,
  },
  menuBtn: {
    position: "absolute",
    top: 6,
    right: 8,
    padding: 4,
    zIndex: 10,
  },
  menuIcon: { color: C.mutedText, fontSize: 18 },

  inputPlayerName: {
    color: C.accent,
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  inputRemaining: {
    color: C.score,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    lineHeight: 32,
  },
  inputBar: {
    borderBottomWidth: 2,
    borderBottomColor: C.accent,
    minWidth: 56,
    alignItems: "center",
    paddingBottom: 1,
  },
  inputValue: {
    color: C.accent,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    letterSpacing: 6,
    minHeight: 26,
  },
  bustLabel: {
    color: "#FF4444",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
    marginTop: 1,
  },

  keypadGrid: { flex: 1, gap: 5 },
  keyRow: { flexDirection: "row", gap: 5 },
  keyBtn: {
    flex: 1,
    backgroundColor: C.keypadBtn,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.keypadBtnBorder,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  keyBtnClear: { backgroundColor: C.clearBtn, borderColor: C.clearBtnBorder },
  keyBtnOk: { backgroundColor: C.okBtn, borderColor: C.okBtnBorder },
  keyBtnText: { color: C.text, fontSize: 22, fontFamily: "Inter_600SemiBold" },
  keyBtnTextSmall: { fontSize: 11, letterSpacing: 0 },
  keyBtnClearText: { color: C.clearText, fontFamily: "Inter_600SemiBold" },
  keyBtnOkText: { color: C.okText, fontSize: 18, fontFamily: "Inter_700Bold", letterSpacing: 1 },

  // ── Leg / Match result ──
  legScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  legBullseye: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  legRing3: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#1A3A1A",
    borderWidth: 3,
    borderColor: C.accent,
  },
  legRing2: {
    position: "absolute",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#CC3333",
    borderWidth: 2,
    borderColor: C.accent,
  },
  legBull: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#CC3333",
    borderWidth: 2,
    borderColor: "#FF6666",
  },
  legWinnerName: {
    color: C.accent,
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    textTransform: "uppercase",
    textAlign: "center",
  },
  legBigLabel: {
    color: C.score,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
    textAlign: "center",
  },
  legScoreRow: {
    color: C.mutedText,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 4,
  },
  legNextHint: {
    color: C.histText,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    fontStyle: "italic",
  },
  legBtn: {
    marginTop: 24,
    backgroundColor: C.accent,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 8,
  },
  legBtnText: {
    color: "#0D170D",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },

  // ── Options Modal ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  modalKAV: { width: "100%" },
  modalCard: {
    backgroundColor: C.modalCard,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderColor: C.divider,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.divider,
  },
  modalTitle: {
    flex: 1,
    color: C.text,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  modalClose: { padding: 4 },
  modalCloseText: { color: C.mutedText, fontSize: 18 },

  modalScroll: { flexShrink: 1 },
  modalScrollContent: { padding: 20 },

  sectionLabel: {
    color: C.mutedText,
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  optRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  optLabel: {
    color: C.histText,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    width: 70,
  },
  nameInput: {
    flex: 1,
    backgroundColor: C.inputBg,
    color: C.text,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.divider,
  },

  segRow: { flexDirection: "row", gap: 8 },
  segBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.divider,
    backgroundColor: C.inputBg,
    alignItems: "center",
  },
  segBtnActive: {
    backgroundColor: "#1A2A0A",
    borderColor: C.accent,
  },
  segBtnText: {
    color: C.segText,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  segBtnTextActive: { color: C.accent },

  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    backgroundColor: C.inputBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperBtnText: { color: C.text, fontSize: 24, fontFamily: "Inter_600SemiBold" },
  stepperValue: {
    flex: 1,
    alignItems: "center",
    backgroundColor: C.inputBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.divider,
    paddingVertical: 8,
  },
  stepperValueText: { color: C.accent, fontSize: 22, fontFamily: "Inter_700Bold" },
  hintText: {
    color: C.mutedText,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginTop: 8,
  },

  modalFooter: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: C.divider,
  },
  footerBtnSecondary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.divider,
    alignItems: "center",
  },
  footerBtnSecondaryText: {
    color: C.mutedText,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  footerBtnPrimary: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 6,
    backgroundColor: C.accent,
    alignItems: "center",
  },
  footerBtnPrimaryText: {
    color: "#0D170D",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },

  // ── First Throw Modal ──
  ftCard: {
    backgroundColor: C.modalCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.divider,
    marginHorizontal: 32,
    padding: 28,
    alignItems: "center",
    gap: 20,
  },
  ftTitle: {
    color: C.text,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  ftSub: {
    color: C.mutedText,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: -12,
  },
  ftBtnRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  ftBtn: {
    flex: 1,
    backgroundColor: C.panelActive,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.accent,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: "center",
  },
  ftBtnText: {
    color: C.accent,
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },

  // ── Remote & Scoreboard ──
  keypadColFull: { flex: 1 },
  keypadGridFull: { flex: 1 },

  remoteBtn: {
    position: "absolute",
    top: 6,
    left: 8,
    padding: 4,
    zIndex: 10,
  },

  sbStack: { flex: 1, flexDirection: "column" },
  sbRow: { flex: 1, flexDirection: "row" },

  sbConnBtn: {
    position: "absolute",
    bottom: 14,
    right: 14,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 18,
    padding: 9,
    borderWidth: 1,
    borderColor: C.accent,
    zIndex: 100,
  },

  rejoinBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  rejoinCard: {
    width: "100%",
    backgroundColor: C.modalCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.accent,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  rejoinCardTitle: {
    color: C.accent,
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
    textAlign: "center",
  },
  rejoinCardSub: {
    color: C.mutedText,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 28,
  },
  rejoinBtn: {
    width: "100%",
    backgroundColor: C.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  rejoinBtnText: {
    color: "#121E12",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  rejoinDismissBtn: {
    width: "100%",
    backgroundColor: "transparent",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.divider,
    paddingVertical: 13,
    alignItems: "center",
  },
  rejoinDismissText: {
    color: C.mutedText,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },

  rmConnectedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rmUnpairBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#FF5555",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: "100%",
  },
  rmUnpairBtnText: {
    color: "#FF5555",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  rmUnpairSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FF5555",
    backgroundColor: "rgba(255,85,85,0.08)",
  },
  rmUnpairSectionText: {
    color: "#FF5555",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  rmRoleHint: {
    color: C.mutedText,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    textAlign: "center",
  },
  rmUrlToggle: {
    color: C.mutedText,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
  },
  rmBodyText: {
    color: C.histText,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    marginBottom: 4,
  },
  rmCodeBox: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 8,
  },
  rmCodeDigit: {
    width: 42,
    height: 54,
    backgroundColor: C.inputBg,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  rmCodeDigitText: {
    color: C.accent,
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  rmCodeInput: {
    backgroundColor: C.inputBg,
    color: C.text,
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.divider,
    textAlign: "center",
    letterSpacing: 10,
  },
});
