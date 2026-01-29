import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    PanResponder,
    Dimensions,
    TextInput,
    Modal,
    Alert,
    Platform,
    KeyboardAvoidingView,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from "react-native";
import Svg, { Path, G, Line, Text as SvgText } from "react-native-svg";
import { db } from "../../db/sqlite";
import { getAssignedPlayersForSession } from "../../services/sessionPlayer.service";

const HANDLE_GAP = 0.01;
const EXERCISE_TYPES = ["Warmup", "10vs10", "11vs11", "1vs1", "20m sprint", "30m sprint", "3vs3", "50m sprint"];
const DEFAULT_COLORS = ["#10B981", "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#EF4444"];

const PLAYER_ROW_H = 72;
const LANE_INNER_H = 48;
const BASE_GRAPH_HEIGHT = 420;
const DEBUG_SQL = false;

function formatTimeMs(ms: number) {
    if (!ms || isNaN(ms)) return "--:--:--";
    const d = new Date(ms);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
}
function parseTimeFlexible(input: string, baseDateMs: number) {
    const s = (input || "").trim();
    if (!s) return { ok: false } as const;
    const base = new Date(baseDateMs);
    try {
        const cand = new Date(`${base.toDateString()} ${s}`);
        if (!isNaN(cand.getTime())) return { ok: true, type: "absolute", ms: cand.getTime() } as const;
    } catch {}
    const parts = s.split(":").map((p) => Number(p));
    if (parts.some((p) => isNaN(p))) return { ok: false } as const;
    if (parts.length === 3) {
        const [hh, mm, ss] = parts;
        const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hh, mm, ss);
        if (!isNaN(d.getTime())) return { ok: true, type: "absolute", ms: d.getTime() } as const;
    }
    if (parts.length === 2) return { ok: true, type: "duration", seconds: parts[0] * 60 + parts[1] } as const;
    return { ok: true, type: "duration", seconds: parts[0] } as const;
}
function hexToRgba(hex: string | undefined | null, alpha = 0.22) {
    const safeHex = typeof hex === "string" && hex ? hex : "#999999";
    const h = safeHex.replace("#", "");
    const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    const bigint = parseInt(full, 16) || 0x999999;
    const r = (bigint >> 16) & 255,
        g = (bigint >> 8) & 255,
        b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
}
function generateId(prefix = "ex") {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}
function prng(seed: number) {
    let state = (Math.abs(seed) % 2147483647) || 1;
    return () => {
        state = (state * 16807) % 2147483647;
        return (state - 1) / 2147483646;
    };
}
function generateSmoothWave(seed: number, segments = 96) {
    const rnd = prng(seed + 13);
    const freqA = 1 + Math.floor(rnd() * 3);
    const freqB = 2 + Math.floor(rnd() * 4);
    const phase = rnd() * Math.PI * 2;
    const out: number[] = [];
    for (let i = 0; i < segments; i++) {
        const t = i / (segments - 1);
        const a = Math.sin(2 * Math.PI * freqA * t + phase);
        const b = 0.5 * Math.sin(2 * Math.PI * freqB * t + phase * 0.6);
        const noise = (rnd() - 0.5) * 0.12;
        const val = Math.max(-1, Math.min(1, 0.05 + 0.9 * (a * 0.6 + b * 0.4) + noise));
        out.push((val + 1) / 2);
    }
    return out;
}
function catmullRom2bezier(points: { x: number; y: number }[], tension = 0.5) {
    if (!points.length) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    const d: string[] = [];
    d.push(`M ${points[0].x} ${points[0].y}`);
    for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i - 1] ?? points[i];
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = points[i + 2] ?? p2;
        const t = tension;
        const cp1x = p1.x + ((p2.x - p0.x) / 6) * t;
        const cp1y = p1.y + ((p2.y - p0.y) / 6) * t;
        const cp2x = p2.x - ((p3.x - p1.x) / 6) * t;
        const cp2y = p2.y - ((p3.y - p1.y) / 6) * t;
        d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
    }
    return d.join(" ");
}
function WaveSvg({
    width,
    height,
    samples,
    stroke = "#062F2A",
    strokeWidth = 1.6,
    fill = null,
    tension = 0.5,
    amp = 1,
    vOffset = 0,
}: any) {
    if (!samples || samples.length === 0) return <View style={{ width, height }} />;
    const pts = samples.map((v: number, i: number) => {
        const x = (i / (samples.length - 1)) * width;
        const scaled = Math.max(0, Math.min(1, (v - 0.5) * amp + 0.5 + vOffset));
        const y = (1 - scaled) * (height - 6) + 3;
        return { x, y };
    });
    const d = catmullRom2bezier(pts, tension);
    return (
        <Svg width={width} height={height}>
            {fill ? <Path d={`${d} L ${width} ${height} L 0 ${height} Z`} fill={fill} /> : null}
            <Path d={d} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
        </Svg>
    );
}

async function sqlAll(query: string, params: any[] = []) {
    const res: any = await db.execute(query, params);
    if (DEBUG_SQL) console.log("[sqlAll] raw:", query, params, res);
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.rows)) return res.rows;
    if (res && res.rows && Array.isArray(res.rows._array)) return res.rows._array;
    if (res && typeof res.rows === "object") {
        if (Array.isArray(res.rows._array)) return res.rows._array;
        try {
            const arr = [];
            for (let i = 0; i < (res.rows.length || 0); i++) {
                if (typeof res.rows.item === "function") arr.push(res.rows.item(i));
                else if (res.rows[i]) arr.push(res.rows[i]);
            }
            if (arr.length) return arr;
        } catch (e) {}
    }
    return [];
}

async function ensureExerciseTables() {
    try {
        await db.execute(
            `CREATE TABLE IF NOT EXISTS exercises (
               exercise_id TEXT PRIMARY KEY,
               session_id TEXT,
               type TEXT,
               start_ts INTEGER,
               end_ts INTEGER,
               color TEXT
             )`
        );
        await db.execute(
            `CREATE TABLE IF NOT EXISTS exercise_players (
               id INTEGER PRIMARY KEY AUTOINCREMENT,
               exercise_id TEXT,
               player_id TEXT
             )`
        );
        try {
            await db.execute(`ALTER TABLE exercises ADD COLUMN color TEXT`);
        } catch (e) {}
    } catch (err) {
        console.warn("ensureExerciseTables error", err);
        throw err;
    }
}

async function loadExercisesFromDb(sessionId: string) {
    try {
        await ensureExerciseTables();
        const exercises = await sqlAll(
            `SELECT exercise_id AS id, type, start_ts AS start, end_ts AS end, color FROM exercises WHERE session_id = ? ORDER BY start_ts DESC`,
            [sessionId]
        );
        const out: any[] = [];
        for (const ex of exercises) {
            const eps = await sqlAll(`SELECT player_id FROM exercise_players WHERE exercise_id = ?`, [ex.id]);
            const playersList = (eps || []).map((r: any) => r.player_id).filter(Boolean);
            const color = (ex && ex.color) || DEFAULT_COLORS[EXERCISE_TYPES.indexOf(ex.type) % DEFAULT_COLORS.length] || DEFAULT_COLORS[0];
            out.push({ id: ex.id, start: Number(ex.start), end: Number(ex.end), players: playersList, type: ex.type, color });
        }
        return out;
    } catch (err) {
        console.warn("loadExercisesFromDb error", err);
        return [];
    }
}

function getExerciseColor(type: string) {
    if (!type) return DEFAULT_COLORS[0];
    if (type.toLowerCase().includes("50m")) return "#EF4444";
    if (type.toLowerCase().includes("warm")) return "#10B981";
    const idx = EXERCISE_TYPES.indexOf(type);
    return idx >= 0 ? DEFAULT_COLORS[idx] : DEFAULT_COLORS[0];
}

function XAxis({ width, height, startTs, endTs, ticks = 5 }: any) {
    const tickPositions = [];
    const labels: string[] = [];
    for (let i = 0; i < ticks; i++) {
        const pct = i / (ticks - 1);
        tickPositions.push(pct * width);
        const t = Math.round(startTs + (endTs - startTs) * pct);
        labels.push(formatTimeMs(t));
    }
    return (
        <Svg width={width} height={height}>
            <G>
                <Line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="rgba(0,0,0,0.12)" strokeWidth={1} />
                {tickPositions.map((x, i) => (
                    <G key={i}>
                        <Line x1={x} y1={height - 6} x2={x} y2={height} stroke="rgba(0,0,0,0.12)" strokeWidth={1} />
                        <SvgText fontSize="10" fill="#64748B" x={x} y={height - 8} textAnchor="middle">
                            {labels[i]}
                        </SvgText>
                    </G>
                ))}
            </G>
        </Svg>
    );
}

export default function AddExerciseScreen(props: any) {
    const { sessionId, trimStartTs = Date.now(), trimEndTs = Date.now(), goBack } = props;
    const navigation = props.navigation;
    const screenWidth = Dimensions.get("window").width;
    const graphWidth = Math.max(420, screenWidth * 0.78);

    const [players, setPlayers] = useState<any[]>([]);
    useEffect(() => {
        const list = getAssignedPlayersForSession(sessionId).filter((p) => p.assigned);
        setPlayers(list);
        setModalPlayers(list);
    }, [sessionId]);

    const [recentExercises, setRecentExercises] = useState<
        { id: string; start: number; end: number; players: string[]; type: string; color: string }[]
    >([]);

    const [lastModalTrim, setLastModalTrim] = useState<{ start: number; end: number; players?: string[]; color?: string } | null>(null);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalPlayers, setModalPlayers] = useState<any[]>([]);
    const [modalSearch, setModalSearch] = useState("");
    const [modalAsc, setModalAsc] = useState(true);
    const [modalSelected, setModalSelected] = useState<string[]>([]);
    const [showExerciseList, setShowExerciseList] = useState(true);
    const [exerciseType, setExerciseType] = useState(EXERCISE_TYPES[0]);

    // listing search + select all
    const [listingSearch, setListingSearch] = useState("");
    const [listingSelected, setListingSelected] = useState<string[]>([]);

    // Use full-day axis: compute midnight start/end for current day (UTC local)
    const baseTs = Date.now();
    const dayStart = new Date(baseTs);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600 * 1000 - 1);

    const duration = Math.max(1, dayEnd.getTime() - dayStart.getTime());

    // modal trimming ratios & manual inputs
    const [mStartRatio, setMStartRatio] = useState(0);
    const [mEndRatio, setMEndRatio] = useState(1);
    const mStartRef = useRef(0);
    const mEndRef = useRef(1);
    const [mManualStart, setMManualStart] = useState(formatTimeMs(dayStart.getTime()));
    const [mManualEnd, setMManualEnd] = useState(formatTimeMs(dayEnd.getTime()));
    const [preview, setPreview] = useState<{ start: number; end: number; color: string } | null>(null);
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

    const mStartMs = Math.round(dayStart.getTime() + duration * mStartRatio);
    const mEndMs = Math.round(dayStart.getTime() + duration * mEndRatio);

    useEffect(() => {
        setMManualStart(formatTimeMs(mStartMs));
        setMManualEnd(formatTimeMs(mEndMs));
        setPreview({ start: mStartMs, end: mEndMs, color: getExerciseColor(exerciseType) });
    }, [mStartRatio, mEndRatio, exerciseType]);

    const modalGraphInset = 32;
    const modalGraphWidth = Math.max(320, graphWidth - modalGraphInset);
    const modalGraphHeight = Math.min(BASE_GRAPH_HEIGHT, Math.max(220, modalPlayers.length * PLAYER_ROW_H + 80));

    const mStartPanRef = useRef<any | null>(null);
    const mEndPanRef = useRef<any | null>(null);

    // Create PanResponders once and use overlay to capture gestures
    const panOverlayRef = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (_, g) => {
                // nothing - logic handled in individual knob handlers below
            },
            onPanResponderMove: () => {},
            onPanResponderRelease: () => {},
        })
    ).current;

    // Start handle responder
    const startResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                mStartRef.current = mStartRatio;
            },
            onPanResponderMove: (_, g) => {
                const px = mStartRef.current * modalGraphWidth + g.dx;
                const next = Math.max(0, Math.min(px / modalGraphWidth, mEndRef.current - HANDLE_GAP));
                setMStartRatio(next);
            },
            onPanResponderRelease: () => {
                mStartRef.current = mStartRatio;
            },
        })
    ).current;

    // End handle responder
    const endResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                mEndRef.current = mEndRatio;
            },
            onPanResponderMove: (_, g) => {
                const px = mEndRef.current * modalGraphWidth + g.dx;
                const next = Math.min(1, Math.max(px / modalGraphWidth, mStartRef.current + HANDLE_GAP));
                setMEndRatio(next);
            },
            onPanResponderRelease: () => {
                mEndRef.current = mEndRatio;
            },
        })
    ).current;

    async function loadExercises() {
        const arr = await loadExercisesFromDb(sessionId);
        setRecentExercises(arr);
        return arr;
    }

    useEffect(() => {
        loadExercises();
        if (navigation && navigation.addListener) {
            const unsub = navigation.addListener("focus", () => loadExercises());
            return unsub;
        }
    }, [sessionId]);

    const openModal = async (preselectPlayerId?: string) => {
        await loadExercises();
        setModalPlayers(players);
        setModalSearch("");
        setModalAsc(true);
        setModalSelected(preselectPlayerId ? [preselectPlayerId] : []);
        setMStartRatio(0);
        setMEndRatio(1);
        mStartRef.current = 0;
        mEndRef.current = 1;
        setMManualStart(formatTimeMs(dayStart.getTime()));
        setMManualEnd(formatTimeMs(dayEnd.getTime()));
        setShowExerciseList(true);
        setExerciseType(EXERCISE_TYPES[0]);
        setModalVisible(true);
        setSelectedExerciseId(null);
    };

    const modalFiltered = useMemo(() => {
        return modalPlayers
            .filter((p) => p.player_name.toLowerCase().includes(modalSearch.toLowerCase()))
            .sort((a, b) => (modalAsc ? a.player_name.localeCompare(b.player_name) : b.player_name.localeCompare(a.player_name)));
    }, [modalPlayers, modalSearch, modalAsc]);

    const listingFiltered = useMemo(() => {
        return players.filter((p) => p.player_name.toLowerCase().includes(listingSearch.toLowerCase()));
    }, [players, listingSearch]);

    const isAllListingSelected = listingSelected.length === players.length && players.length > 0;
    const toggleListingSelectAll = () => {
        if (isAllListingSelected) setListingSelected([]);
        else setListingSelected(players.map((p) => p.player_id));
    };

    const isAllVisibleSelected = useMemo(() => {
        if (!modalFiltered.length) return false;
        return modalFiltered.every((p) => modalSelected.includes(p.player_id));
    }, [modalFiltered, modalSelected]);

    const toggleSelectAllVisible = () => {
        if (isAllVisibleSelected) setModalSelected((prev) => prev.filter((id) => !modalFiltered.some((p) => p.player_id === id)));
        else setModalSelected((prev) => Array.from(new Set([...prev, ...modalFiltered.map((p) => p.player_id)])));
    };

    const applyManualTrim = () => {
        const s = parseTimeFlexible(mManualStart, dayStart.getTime());
        const e = parseTimeFlexible(mManualEnd, dayStart.getTime());
        if (!s.ok || !e.ok) {
            Alert.alert("Invalid times", "Use HH:MM:SS / MM:SS / seconds.");
            return;
        }
        let sMs = s.type === "absolute" ? s.ms! : dayStart.getTime() + (s.seconds || 0) * 1000;
        let eMs: number | null = null;
        if (e.type === "absolute") {
            if (e.ms! > sMs) eMs = e.ms!;
            else {
                const parts = mManualEnd.split(":").map((p) => Number(p));
                if (parts.length === 3) {
                    const secs = parts[0] * 3600 + parts[1] * 60 + parts[2];
                    eMs = sMs + secs * 1000;
                }
            }
        } else {
            eMs = (s.type === "absolute" ? sMs : dayStart.getTime()) + (e.seconds || 0) * 1000;
        }
        if (eMs === null || isNaN(eMs)) {
            Alert.alert("Invalid end", "Cannot interpret end time.");
            return;
        }
        if (eMs <= sMs) {
            Alert.alert("Invalid range", "End must be after start.");
            return;
        }
        const clampedS = Math.max(dayStart.getTime(), Math.min(dayEnd.getTime(), sMs));
        const clampedE = Math.max(dayStart.getTime(), Math.min(dayEnd.getTime(), eMs));
        const ns = (clampedS - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime());
        const ne = (clampedE - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime());
        setMStartRatio(ns);
        setMEndRatio(ne);
        mStartRef.current = ns;
        mEndRef.current = ne;
        setPreview({ start: clampedS, end: clampedE, color: getExerciseColor(exerciseType) });
    };

    const addExerciseToDb = async (type: string, startMs: number, endMs: number, playersToAdd: string[]) => {
        if (!playersToAdd?.length) {
            Alert.alert("No players", "Select at least one player.");
            return;
        }
        if (!startMs || !endMs || endMs <= startMs) {
            Alert.alert("Invalid range", "Start and end times are required and end must be after start.");
            return;
        }
        try {
            await ensureExerciseTables();
            const id = generateId();
            const color = getExerciseColor(type);
            await db.execute(
                `INSERT INTO exercises (exercise_id, session_id, type, start_ts, end_ts, color) VALUES (?, ?, ?, ?, ?, ?)`,
                [id, sessionId, type, Math.round(startMs), Math.round(endMs), color]
            );
            for (const pid of playersToAdd) {
                await db.execute(`INSERT INTO exercise_players (exercise_id, player_id) VALUES (?, ?)`, [id, pid]);
            }
            await loadExercises();
            setLastModalTrim({ start: startMs, end: endMs, players: playersToAdd, color });
            setModalVisible(false);
            setModalSelected([]);
            setPreview(null);
            Alert.alert("Saved", "Exercise saved and graph updated.");
        } catch (err) {
            console.warn("DB insert error", err);
            Alert.alert("Error", "Could not add exercise.");
        }
    };

    const exercisesForPlayer = (playerId: string) => recentExercises.filter((r) => r.players?.includes(playerId));

    function renderLaneWave(playerId: string, fullWidth: number) {
        const seg = Math.max(56, Math.floor(fullWidth / 6));
        const seed = playerId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        const samplesA = generateSmoothWave(seed, seg);
        const samplesB = generateSmoothWave(seed + 47, seg).map((v) => Math.max(0, Math.min(1, v * 0.94 + 0.03)));
        return (
            <View style={{ width: fullWidth - 16, height: LANE_INNER_H }}>
                <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}>
                    <WaveSvg width={fullWidth - 16} height={LANE_INNER_H} samples={samplesA} stroke={"#1E90FF"} strokeWidth={1.6} amp={1.02} vOffset={0} />
                </View>
                <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}>
                    <WaveSvg width={fullWidth - 16} height={LANE_INNER_H} samples={samplesB} stroke={"#F59E0B"} strokeWidth={1.8} amp={0.98} vOffset={-0.01} />
                </View>
            </View>
        );
    }

    // render listing row (no trim button; clicking row opens modal preselect)
    function renderPlayerRow({ item }: any) {
        const exList = exercisesForPlayer(item.player_id).sort((a, b) => b.players.length - a.players.length);
        const focus = lastModalTrim;
        const showFocusForThisPlayer = !!focus && (!focus.players || focus.players.length === 0 || focus.players.includes(item.player_id));
        return (
            <TouchableOpacity style={styles.rowBox} onPress={() => openModal(item.player_id)}>
                <View style={styles.rowInner}>
                    <View style={styles.nameBox}>
                        <Text style={styles.playerNameRow}>{item.player_name}</Text>
                    </View>

                    <View style={styles.graphBox}>
                        {/* top full-day X axis */}
                        <View style={{ height: 20 }}>
                            <XAxis width={modalGraphWidth - 140} height={20} startTs={dayStart.getTime()} endTs={dayEnd.getTime()} ticks={5} />
                        </View>

                        <View style={{ height: LANE_INNER_H, marginTop: 4, borderRadius: 8, overflow: "hidden", backgroundColor: "#fff", position: "relative" }}>
                            <View style={{ position: "absolute", left: 8, right: 8, top: 0, bottom: 0 }}>{renderLaneWave(item.player_id, modalGraphWidth - 140)}</View>

                            {showFocusForThisPlayer && focus ? (
                                <View
                                    style={{
                                        position: "absolute",
                                        left: `${((focus.start - dayStart.getTime()) / duration) * 100}%`,
                                        width: `${((focus.end - focus.start) / duration) * 100}%`,
                                        top: 6,
                                        bottom: 6,
                                        borderRadius: 6,
                                        overflow: "hidden",
                                        backgroundColor: hexToRgba(focus.color || "#10B981", 0.14),
                                        zIndex: 5,
                                        pointerEvents: "none",
                                    }}
                                />
                            ) : (
                                !lastModalTrim &&
                                exList.map((r) => {
                                    const leftPct = ((r.start - dayStart.getTime()) / duration) * 100;
                                    const widthPct = ((r.end - r.start) / duration) * 100;
                                    const leftCl = Math.max(0, Math.min(100, leftPct));
                                    const widthCl = Math.max(0.5, Math.min(100 - leftCl, widthPct));
                                    return (
                                        <View
                                            key={`${item.player_id}-${r.id}`}
                                            style={{
                                                position: "absolute",
                                                left: `${leftCl}%`,
                                                width: `${widthCl}%`,
                                                top: 6,
                                                bottom: 6,
                                                borderRadius: 6,
                                                overflow: "hidden",
                                                zIndex: 5,
                                                pointerEvents: "none",
                                            }}
                                        >
                                            <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: hexToRgba(r.color, 0.14) }} />
                                        </View>
                                    );
                                })
                            )}
                        </View>

                        {/* bottom full-day X axis */}
                        <View style={{ height: 20, marginTop: 6 }}>
                            <XAxis width={modalGraphWidth - 140} height={20} startTs={dayStart.getTime()} endTs={dayEnd.getTime()} ticks={5} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // Modal scrolling sync refs & handlers
    const modalLeftRef = useRef<FlatList | null>(null);
    const modalRightRef = useRef<ScrollView | null>(null);
    const modalIsSyncing = useRef(false);

    const onModalLeftScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (modalIsSyncing.current) return;
        modalIsSyncing.current = true;
        const y = e.nativeEvent.contentOffset.y;
        modalRightRef.current?.scrollTo({ y, animated: false });
        setTimeout(() => (modalIsSyncing.current = false), 10);
    };
    const onModalRightScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (modalIsSyncing.current) return;
        modalIsSyncing.current = true;
        const y = e.nativeEvent.contentOffset.y;
        const idx = Math.round(y / PLAYER_ROW_H);
        if (modalLeftRef.current && idx >= 0 && idx < Math.max(1, modalFiltered.length)) {
            modalLeftRef.current.scrollToIndex({ index: Math.max(0, Math.min(idx, modalFiltered.length - 1)), animated: false });
        } else {
            modalLeftRef.current?.scrollToOffset({ offset: y, animated: false });
        }
        setTimeout(() => (modalIsSyncing.current = false), 10);
    };

    // show modal
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Add Exercise</Text>
                <View style={{ width: 10 }} />
            </View>

            <View style={styles.body}>
                <View style={styles.listHeader}>
                    <TextInput value={listingSearch} onChangeText={setListingSearch} placeholder="Search players" style={styles.searchListing} />
                    <TouchableOpacity onPress={toggleListingSelectAll} style={styles.selectAllBtn}>
                        <Text style={{ color: "#fff", fontWeight: "700" }}>{isAllListingSelected ? "Unselect All" : "Select All"}</Text>
                    </TouchableOpacity>
                </View>

                <FlatList data={listingFiltered} keyExtractor={(p) => p.player_id} renderItem={renderPlayerRow} contentContainerStyle={{ paddingBottom: 120 }} style={{ width: "100%" }} />
            </View>

            <View style={styles.footer}>
                <TouchableOpacity onPress={goBack} style={{ padding: 8 }}>
                    <Text style={styles.cancel}>BACK</Text>
                </TouchableOpacity>

                <View style={styles.footerRight}>
                    <TouchableOpacity onPress={() => openModal()} style={[styles.primaryBtn]}>
                        <Text style={styles.primaryBtnText}>ADD EXERCISE</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => Alert.alert("Next", "Next pressed")} style={[styles.secondaryBtn, { marginLeft: 12 }]}>
                        <Text style={styles.secondaryText}>NEXT</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView style={styles.modalWrapper} behavior={Platform.OS === "ios" ? "padding" : "height"}>
                    <View style={styles.modalLarge}>
                        <Text style={styles.modalTitle}>Create Exercise</Text>
                        <View style={styles.modalContentRow}>
                            <View style={styles.modalLeft}>
                                <View style={styles.modalRowTop}>
                                    <TouchableOpacity onPress={toggleSelectAllVisible} style={styles.checkbox}>
                                        <Text style={styles.checkboxText}>{isAllVisibleSelected ? "☑" : "☐"}</Text>
                                    </TouchableOpacity>

                                    <TextInput value={modalSearch} onChangeText={setModalSearch} placeholder="Search players" style={[styles.search, { flex: 1 }]} />

                                    <TouchableOpacity onPress={() => setModalAsc((v) => !v)} style={{ marginLeft: 8 }}>
                                        <Text style={styles.sort}>{modalAsc ? "A–Z" : "Z–A"}</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={{ flex: 1, marginTop: 8 }}>
                                    <FlatList
                                        ref={modalLeftRef}
                                        data={modalFiltered}
                                        keyExtractor={(p) => p.player_id}
                                        renderItem={({ item }) => {
                                            const sel = modalSelected.includes(item.player_id);
                                            const exFor = exercisesForPlayer(item.player_id);
                                            return (
                                                <TouchableOpacity
                                                    onPress={() =>
                                                        setModalSelected((prev) => (prev.includes(item.player_id) ? prev.filter((id) => id !== item.player_id) : [...prev, item.player_id]))
                                                    }
                                                    style={[styles.playerRow, sel && styles.playerSelected]}
                                                >
                                                    <View style={{ width: "100%", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                                        <Text style={styles.playerName}>{item.player_name}</Text>
                                                        <Text style={{ fontSize: 14, color: "#6B7280" }}>{exFor.length}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            );
                                        }}
                                        nestedScrollEnabled
                                        onScroll={onModalLeftScroll}
                                        scrollEventThrottle={16}
                                        getItemLayout={(_, index) => ({ length: PLAYER_ROW_H, offset: PLAYER_ROW_H * index, index })}
                                    />
                                </View>
                            </View>

                            <View style={styles.modalRight}>
                                <View style={[styles.graph, { width: modalGraphWidth, height: modalGraphHeight }]}>
                                    <View style={{ height: 36, paddingHorizontal: 8 }}>
                                        <XAxis width={modalGraphWidth - 16} height={20} startTs={dayStart.getTime()} endTs={dayEnd.getTime()} ticks={7} />
                                        {/* recent exercises (buttons) */}
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                                            {recentExercises.map((ex) => (
                                                <TouchableOpacity
                                                    key={ex.id}
                                                    onPress={() => {
                                                        const ns = (ex.start - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime());
                                                        const ne = (ex.end - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime());
                                                        setMStartRatio(Math.max(0, Math.min(1, ns)));
                                                        setMEndRatio(Math.max(0, Math.min(1, ne)));
                                                        mStartRef.current = Math.max(0, Math.min(1, ns));
                                                        mEndRef.current = Math.max(0, Math.min(1, ne));
                                                        setPreview({ start: ex.start, end: ex.end, color: ex.color });
                                                        setSelectedExerciseId(ex.id);
                                                    }}
                                                    style={{
                                                        backgroundColor: selectedExerciseId === ex.id ? hexToRgba(ex.color, 0.95) : "#EEF2FF",
                                                        marginRight: 8,
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 6,
                                                        borderRadius: 8,
                                                    }}
                                                >
                                                    <Text style={{ color: selectedExerciseId === ex.id ? "#fff" : "#0B3C2E", fontWeight: "700" }}>{ex.type}</Text>
                                                    <Text style={{ fontSize: 11, color: selectedExerciseId === ex.id ? "#fff" : "#64748B" }}>
                                                        {formatTimeMs(ex.start)} - {formatTimeMs(ex.end)}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>

                                    <ScrollView
                                        ref={modalRightRef}
                                        style={{ flex: 1 }}
                                        onScroll={onModalRightScroll}
                                        scrollEventThrottle={16}
                                        contentContainerStyle={{ paddingBottom: 40 }}
                                        pointerEvents="box-none"
                                    >
                                        {modalFiltered.map((pl) => {
                                            let exList = exercisesForPlayer(pl.player_id);
                                            exList = [...exList].sort((a, b) => b.players.length - a.players.length);
                                            const showPreviewForThisPlayer = modalSelected.length === 0 ? true : modalSelected.includes(pl.player_id);
                                            return (
                                                <View key={`modal-lane-${pl.player_id}`} style={{ height: PLAYER_ROW_H, borderBottomWidth: 1, borderColor: "#F1F5F9", paddingVertical: 6 }}>
                                                    <View style={{ height: LANE_INNER_H, marginHorizontal: 6, borderRadius: 12, overflow: "hidden", backgroundColor: "#fff", position: "relative" }}>
                                                        <View style={{ position: "absolute", left: 8, right: 8, top: 0, bottom: 0 }}>
                                                            {renderLaneWave(pl.player_id, modalGraphWidth - 16)}
                                                        </View>

                                                        {!modalSelected.length &&
                                                            exList.map((r) => {
                                                                const leftPct = ((r.start - dayStart.getTime()) / duration) * 100;
                                                                const widthPct = ((r.end - r.start) / duration) * 100;
                                                                const leftCl = Math.max(0, Math.min(100, leftPct));
                                                                const widthCl = Math.max(0.5, Math.min(100 - leftCl, widthPct));
                                                                return (
                                                                    <View
                                                                        key={`modal-${pl.player_id}-${r.id}`}
                                                                        style={{
                                                                            position: "absolute",
                                                                            left: `${leftCl}%`,
                                                                            width: `${widthCl}%`,
                                                                            top: 6,
                                                                            bottom: 6,
                                                                            borderRadius: 6,
                                                                            overflow: "hidden",
                                                                            zIndex: 5,
                                                                            pointerEvents: "none",
                                                                        }}
                                                                    >
                                                                        <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: hexToRgba(r.color, 0.12) }} />
                                                                    </View>
                                                                );
                                                            })}

                                                        {preview && showPreviewForThisPlayer ? (
                                                            <View
                                                                style={{
                                                                    position: "absolute",
                                                                    left: `${((preview.start - dayStart.getTime()) / duration) * 100}%`,
                                                                    width: `${((preview.end - preview.start) / duration) * 100}%`,
                                                                    top: 6,
                                                                    bottom: 6,
                                                                    borderRadius: 6,
                                                                    overflow: "hidden",
                                                                    backgroundColor: hexToRgba(preview.color, 0.12),
                                                                    zIndex: 10,
                                                                    pointerEvents: "none",
                                                                }}
                                                            />
                                                        ) : null}
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </ScrollView>

                                    {/* draggable overlay (above ScrollView) to capture gestures reliably */}
                                    <View style={[styles.overlay, { width: modalGraphWidth, height: modalGraphHeight }]} pointerEvents="box-none">
                                        <View style={{ position: "absolute", left: 8, right: 8, top: 36, height: LANE_INNER_H + 8 }} pointerEvents="box-none" />

                                        {/* selection band overlay */}
                                        <View
                                            pointerEvents="none"
                                            style={{
                                                position: "absolute",
                                                left: `${mStartRatio * 100}%`,
                                                width: `${(mEndRatio - mStartRatio) * 100}%`,
                                                top: 36,
                                                height: LANE_INNER_H + 8,
                                                borderRadius: 8,
                                                backgroundColor: hexToRgba(getExerciseColor(exerciseType), 0.12),
                                                zIndex: 22,
                                            }}
                                        />

                                        {/* start handle */}
                                        <View
                                            {...startResponder.panHandlers}
                                            style={[
                                                styles.handleBar,
                                                {
                                                    left: Math.round(mStartRatio * modalGraphWidth - 16),
                                                    width: 32,
                                                    top: 36,
                                                },
                                            ]}
                                            pointerEvents="box-only"
                                        >
                                            <View style={styles.handleKnob} />
                                            <View style={styles.handleLabel}>
                                                <Text style={styles.handleLabelText}>{formatTimeMs(mStartMs)}</Text>
                                            </View>
                                        </View>

                                        {/* end handle */}
                                        <View
                                            {...endResponder.panHandlers}
                                            style={[
                                                styles.handleBar,
                                                {
                                                    left: Math.round(mEndRatio * modalGraphWidth - 16),
                                                    width: 32,
                                                    top: 36,
                                                },
                                            ]}
                                            pointerEvents="box-only"
                                        >
                                            <View style={styles.handleKnob} />
                                            <View style={styles.handleLabel}>
                                                <Text style={styles.handleLabelText}>{formatTimeMs(mEndMs)}</Text>
                                            </View>
                                        </View>

                                        {/* center trim icon */}
                                        <View
                                            style={{
                                                position: "absolute",
                                                left: `${(mStartRatio + (mEndRatio - mStartRatio) / 2) * 100}%`,
                                                top: 36 + (LANE_INNER_H / 2) - 12,
                                                marginLeft: -12,
                                                width: 24,
                                                height: 24,
                                                borderRadius: 12,
                                                backgroundColor: getExerciseColor(exerciseType),
                                                zIndex: 30,
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                            pointerEvents="none"
                                        >
                                            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>✂</Text>
                                        </View>
                                    </View>
                                </View>

                                <Text style={styles.time}>
                                    {formatTimeMs(mStartMs)} – {formatTimeMs(mEndMs)}
                                </Text>

                                <View style={{ width: "100%", marginTop: 12 }}>
                                    <Text style={{ marginBottom: 6 }}>Manual trim — absolute or duration (HH:MM:SS / MM:SS / seconds)</Text>

                                    <View style={{ marginBottom: 6 }}>
                                        <Text style={{ fontSize: 12, color: "#444", marginBottom: 4 }}>Start</Text>
                                        <TextInput style={styles.manualInput} value={mManualStart} onChangeText={setMManualStart} placeholder="HH:MM:SS or MM:SS or seconds" />
                                    </View>

                                    <View style={{ marginBottom: 8 }}>
                                        <Text style={{ fontSize: 12, color: "#444", marginBottom: 4 }}>End (duration if relative)</Text>
                                        <TextInput style={styles.manualInput} value={mManualEnd} onChangeText={setMManualEnd} placeholder="HH:MM:SS or MM:SS or seconds" />
                                    </View>

                                    <TouchableOpacity onPress={applyManualTrim} style={styles.applyBtn}>
                                        <Text style={styles.applyBtnText}>Apply</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={{ width: "100%", marginTop: 12 }}>
                                    <TouchableOpacity onPress={() => setShowExerciseList((s) => !s)} style={styles.selectExerciseBtn}>
                                        <Text style={styles.selectExerciseBtnText}>Select Exercise ▾</Text>
                                    </TouchableOpacity>

                                    {showExerciseList && (
                                        <ScrollView style={styles.typeListBox}>
                                            {EXERCISE_TYPES.map((t) => (
                                                <TouchableOpacity
                                                    key={t}
                                                    onPress={() => {
                                                        setExerciseType(t);
                                                        setShowExerciseList(false);
                                                    }}
                                                    style={[styles.typeBubble, t === exerciseType && styles.typeBubbleActive]}
                                                >
                                                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                                        <Text style={t === exerciseType ? styles.typeBubbleTextActive : styles.typeBubbleText}>{t}</Text>
                                                    </View>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    )}

                                    <View style={{ flexDirection: "row", marginTop: 8, alignItems: "center", justifyContent: "space-between" }}>
                                        <Text>Selected: {exerciseType}</Text>
                                        <Text style={{ fontSize: 12, color: "#6B7280" }}>Manual / Trim</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={styles.modalButtonsFooter}>
                            <TouchableOpacity
                                onPress={() => {
                                    setLastModalTrim({ start: mStartMs, end: mEndMs, players: modalSelected.length ? modalSelected : undefined, color: getExerciseColor(exerciseType) });
                                    setModalVisible(false);
                                    setModalSelected([]);
                                }}
                            >
                                <Text style={styles.cancel}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity onPress={() => addExerciseToDb(exerciseType, mStartMs, mEndMs, modalSelected.length ? modalSelected : modalPlayers.map((p) => p.player_id))}>
                                <Text style={styles.add}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#F8FAFC" },
    header: { flexDirection: "row", justifyContent: "space-between", padding: 12, alignItems: "center", borderBottomWidth: 1, borderColor: "#E5E7EB" },
    title: { fontSize: 18, fontWeight: "700" },
    body: { flex: 1, paddingHorizontal: 8 },

    listHeader: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 8 },
    searchListing: { flex: 1, padding: 8, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 6, backgroundColor: "#FFF" },
    selectAllBtn: { marginLeft: 8, backgroundColor: "#2563EB", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },

    rowBox: { paddingVertical: 6, paddingHorizontal: 6 },
    rowInner: { flexDirection: "row", alignItems: "center" },
    nameBox: { width: 120, height: PLAYER_ROW_H - 6, justifyContent: "center", alignItems: "flex-start", paddingLeft: 8 },
    playerNameRow: { fontWeight: "700" },

    graphBox: { flex: 1, marginLeft: 8 },

    left: { width: "32%", borderRightWidth: 1, borderColor: "#E5E7EB", paddingBottom: 8 },
    searchRow: { flexDirection: "row", alignItems: "center", padding: 8 },
    search: { flex: 1, padding: 8, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 6, backgroundColor: "#FFFFFF" },
    playerList: { flex: 1 },
    playerRow: { height: PLAYER_ROW_H, paddingHorizontal: 12, borderBottomWidth: 1, borderColor: "#F1F5F9", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    playerSelected: { backgroundColor: "#FEF3C7" },
    playerName: { fontWeight: "600" },

    right: { width: "68%", padding: 12, alignItems: "center" },
    graphContainer: { alignItems: "center" },
    graph: { backgroundColor: "#FBFEFF", borderRadius: 12, overflow: "hidden", position: "relative" },

    overlay: { position: "absolute", left: 0, top: 0, zIndex: 60 },

    previewRange: { position: "absolute", zIndex: 3, borderRadius: 6 },
    savedRange: { position: "absolute", zIndex: 2, borderRadius: 6 },

    handleBar: { position: "absolute", zIndex: 70, backgroundColor: "transparent", alignItems: "center" },
    handleKnob: { width: 18, height: 36, backgroundColor: "#111827", borderRadius: 6, opacity: 0.95 },
    handleLabel: { position: "absolute", top: -36, backgroundColor: "#111827", paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
    handleLabelText: { color: "#fff", fontSize: 11, fontWeight: "700" },

    time: { textAlign: "center", marginTop: 8, fontWeight: "600" },
    hintText: { marginTop: 8, color: "#6B7280", width: "92%", textAlign: "center" },

    footer: { flexDirection: "row", justifyContent: "space-between", padding: 12, borderTopWidth: 1, borderColor: "#E5E7EB", alignItems: "center" },
    footerRight: { flexDirection: "row", alignItems: "center" },
    primaryBtn: { backgroundColor: "#16A34A", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
    primaryBtnText: { color: "#fff", fontWeight: "700" },
    secondaryBtn: { backgroundColor: "#111827", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6 },
    secondaryText: { color: "#fff", fontWeight: "700" },
    cancel: { color: "#2563EB", fontWeight: "700" },

    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
    badgeText: { color: "#fff", fontSize: 12 },

    modalWrapper: { flex: 1, justifyContent: "center", backgroundColor: "rgba(0,0,0,0.4)" },
    modalLarge: { margin: 12, backgroundColor: "#fff", borderRadius: 12, padding: 12, maxHeight: "92%", flex: 1 },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
    modalContentRow: { flexDirection: "row", gap: 12, flex: 1 },

    modalLeft: { width: "36%", height: "100%" },
    modalRight: { width: "64%", alignItems: "center", flex: 1 },
    modalRowTop: { flexDirection: "row", alignItems: "center" },
    checkbox: { marginRight: 8, width: 28, alignItems: "center", justifyContent: "center" },
    checkboxText: { fontSize: 18 },
    sort: { color: "#2563EB", fontWeight: "700" },

    manualInput: { width: 240, padding: 8, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 6, backgroundColor: "#FFF" },
    applyBtn: { marginTop: 6, backgroundColor: "#16A34A", padding: 8, borderRadius: 6, alignSelf: "flex-start" },
    applyBtnText: { color: "#FFF", fontWeight: "700" },

    selectExerciseBtn: { backgroundColor: "#EEF2FF", padding: 8, borderRadius: 6 },
    selectExerciseBtnText: { color: "#3730A3", fontWeight: "700" },
    typeListBox: { maxHeight: 160, marginTop: 8, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 6, padding: 8 },

    typeBubble: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: "#E5E7EB", marginRight: 8, marginBottom: 8 },
    typeBubbleActive: { backgroundColor: "#ECFDF5", borderColor: "#86EFAC" },
    typeBubbleText: { fontSize: 12 },
    typeBubbleTextActive: { fontSize: 12, color: "#16A34A", fontWeight: "700" },

    modalButtonsFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
    add: { color: "#16A34A", fontWeight: "700", fontSize: 16 },
});