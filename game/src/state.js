// Game state: screens, levels, timer, score, combo, hints, stars.
// Pure logic — no DOM, no audio, no canvas — so the rules are testable and
// the shot states can drive the exact same code paths as real play.

import { SCENES } from './scenes.js';
import { firstUnfound, remaining } from './differences.js';
import { mulberry32, range } from './random.js';

export const CONFETTI_COLORS = ['#f5b942', '#e05252', '#57c465', '#5ca8ff', '#ff8a5c', '#ffd94a'];

export function createGame() {
  return {
    screen: 'title', // title | play | paused | levelDone | gameDone | timeUp
    levelIndex: 0,
    scene: SCENES[0],
    found: new Set(),
    hintsLeft: 3,
    timeLeft: SCENES[0].timeLimit,
    score: 0,
    levelScore: 0,
    totalScore: 0,
    streak: 0,
    bestStreak: 0,
    stars: [0, 0, 0],
    hint: null, // { diff, until }
    wrongFlash: null, // { x, y, until } in scene coords
    floaters: [], // { x, y, text, until, color } in scene coords
    confetti: [], // { x, y, vx, vy, size, color, rot, vr }
    lastFound: null, // { diff, at, pts }
    levelStartAt: 0,
    frozen: false, // shot mode: timer and particles do not advance
    muted: false,
    hover: null, // { x, y } canvas coords, for button hover
    best: 0,
    message: 'Klik perbedaan di salah satu panel — kiri atau kanan, sama saja!',
  };
}

/** Begin a level fresh. */
export function startLevel(st, index) {
  const scene = SCENES[index];
  st.levelIndex = index;
  st.scene = scene;
  st.found = new Set();
  st.hintsLeft = scene.hints;
  st.timeLeft = scene.timeLimit;
  st.levelScore = 0;
  st.streak = 0;
  st.hint = null;
  st.wrongFlash = null;
  st.floaters = [];
  st.confetti = [];
  st.lastFound = null;
  st.screen = 'play';
  st.levelStartAt = performance.now();
  st.message = `Level ${index + 1}: ${scene.name} — cari ${scene.diffs.length} perbedaan!`;
}

/** Mark a difference found. Returns { pts, completed } or null when already found. */
export function markFound(st, diff, silent = false) {
  if (st.found.has(diff.id)) return null;
  st.found.add(diff.id);
  st.streak += 1;
  st.bestStreak = Math.max(st.bestStreak, st.streak);
  const pts = 100 + (st.streak - 1) * 25;
  st.score += pts;
  st.levelScore += pts;
  const now = performance.now();
  st.lastFound = { diff, at: now, pts };
  st.floaters.push({ x: diff.x, y: diff.y - diff.r - 6, text: `+${pts}`, until: now + 1000, color: '#ffd94a' });
  if (!silent) {
    st.message =
      st.streak >= 3
        ? `Ketemu! "${diff.label}" — COMBO x${st.streak}!`
        : `Ketemu! "${diff.label}" (+${pts})`;
  }
  if (st.found.size === st.scene.diffs.length) {
    completeLevel(st);
    return { pts, completed: true };
  }
  return { pts, completed: false };
}

/** A wrong click: streak resets, time and score dip, red flash at the spot. */
export function wrongClick(st, sx, sy) {
  st.streak = 0;
  st.timeLeft = Math.max(0, st.timeLeft - 5);
  st.score = Math.max(0, st.score - 25);
  st.levelScore = Math.max(0, st.levelScore - 25);
  st.wrongFlash = { x: sx, y: sy, until: performance.now() + 450 };
  st.message = 'Bukan itu — minus 5 detik! Perhatikan baik-baik.';
}

/** Spend a hint: highlight the first unfound difference for a few seconds. */
export function useHint(st) {
  if (st.screen !== 'play' || st.hintsLeft <= 0) return null;
  const diff = firstUnfound(st.scene, st.found);
  if (!diff) return null;
  st.hintsLeft -= 1;
  st.score = Math.max(0, st.score - 50);
  st.levelScore = Math.max(0, st.levelScore - 50);
  st.hint = { diff, until: performance.now() + 2600 };
  st.message = `Hint: ada perbedaan di dekat "${diff.label}"… (-50 poin)`;
  return diff;
}

/** Stars for a finished level: 3 when 40%+ of the time is left. */
export function starsFor(st) {
  const frac = st.timeLeft / st.scene.timeLimit;
  if (frac >= 0.4) return 3;
  if (frac >= 0.2) return 2;
  return 1;
}

/** Finish the level: time bonus, stars, confetti, total tally. */
export function completeLevel(st) {
  const stars = starsFor(st);
  const bonus = Math.round(st.timeLeft) * 10;
  st.score += bonus;
  st.levelScore += bonus;
  st.stars[st.levelIndex] = Math.max(st.stars[st.levelIndex], stars);
  st.totalScore += st.levelScore;
  st.screen = 'levelDone';
  st.message = `Level ${st.levelIndex + 1} selesai! Bonus waktu +${bonus}.`;
  // Seeded confetti so the end screenshot is stable frame to frame.
  const rng = mulberry32(4242 + st.levelIndex);
  st.confetti = [];
  for (let i = 0; i < 110; i++) {
    st.confetti.push({
      x: range(rng, 0, 1280),
      y: range(rng, -40, 420),
      vx: range(rng, -24, 24),
      vy: range(rng, 40, 130),
      size: range(rng, 6, 13),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rot: range(rng, 0, Math.PI * 2),
      vr: range(rng, -3, 3),
    });
  }
}

/** Advance the timer; returns 'timeout' when time runs out. */
export function tick(st, dt) {
  if (st.screen !== 'play' || st.frozen) return null;
  st.timeLeft -= dt;
  if (st.timeLeft <= 0) {
    st.timeLeft = 0;
    st.screen = 'timeUp';
    st.streak = 0;
    st.message = `Waktu habis! Kamu menemukan ${st.found.size} dari ${st.scene.diffs.length}. Coba lagi!`;
    return 'timeout';
  }
  return null;
}

/** Advance particles and transient effects by dt seconds. */
export function updateFx(st, dt) {
  if (st.frozen) return;
  const now = performance.now();
  st.floaters = st.floaters.filter((f) => f.until > now);
  if (st.wrongFlash && st.wrongFlash.until <= now) st.wrongFlash = null;
  if (st.hint && st.hint.until <= now) st.hint = null;
  if (st.screen === 'levelDone' || st.screen === 'gameDone') {
    for (const c of st.confetti) {
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += c.vr * dt;
      if (c.y > 720) {
        c.y = -20;
        c.x = (c.x + 97) % 1280;
      }
    }
  }
}

/** Go to the next level, or the game-complete screen after the last one. */
export function nextLevel(st) {
  if (st.levelIndex + 1 < SCENES.length) {
    startLevel(st, st.levelIndex + 1);
  } else {
    st.screen = 'gameDone';
    st.message = 'Semua level selesai — hebat!';
  }
}

/** Back to the title screen, keeping the total score for the run. */
export function toTitle(st) {
  st.screen = 'title';
  st.message = 'Klik perbedaan di salah satu panel — kiri atau kanan, sama saja!';
}

/** How many differences are left in the current level. */
export function leftCount(st) {
  return remaining(st.scene, st.found);
}
