// Screenshot states: `?shot=<name>&seed=<n>` drives the game into a fixed,
// staged state through the exact same code paths as real play — startLevel,
// markFound, completeLevel — so every screenshot is a real render of the
// game's own code, never a mock-up. The timer and particles freeze, so the
// frame is stable for the camera.
//
//   ?shot=start  title screen with the three level cards
//   ?shot=cover  level 1 mid-play: 3 found (ringed on both panels), 4 left
//   ?shot=play   level 2 mid-play: 2 found, timer running down
//   ?shot=end    level 1 complete: 3 stars, stats, frozen confetti

import { completeLevel, markFound, startLevel } from './state.js';

export function applyShot(st, search) {
  const params = new URLSearchParams(search);
  const shot = params.get('shot');
  if (!shot) return null;
  st.frozen = true;
  if (shot === 'start') {
    st.screen = 'title';
    st.message = 'Pilih level — atau tekan MAIN untuk mulai dari Level 1.';
    return shot;
  }
  if (shot === 'cover') {
    startLevel(st, 0);
    for (const d of st.scene.diffs.slice(0, 3)) markFound(st, d, true);
    st.timeLeft = 98;
    st.streak = 3;
    st.message = '3 perbedaan ketemu — 4 lagi! Perhatikan awning dan atap…';
    return shot;
  }
  if (shot === 'play') {
    startLevel(st, 1);
    for (const d of st.scene.diffs.slice(0, 2)) markFound(st, d, true);
    st.timeLeft = 132;
    st.streak = 2;
    st.message = '2 ketemu di Pasar Malam — 8 lagi bersembunyi di keramaian.';
    return shot;
  }
  if (shot === 'end') {
    startLevel(st, 0);
    // Mark all but the last, set the clock, then finish for real: the
    // bonus and the stars are computed from the 62 seconds that remain.
    for (const d of st.scene.diffs.slice(0, -1)) markFound(st, d, true);
    st.timeLeft = 62;
    markFound(st, st.scene.diffs[st.scene.diffs.length - 1], true);
    void completeLevel;
    return shot;
  }
  return null;
}
