// Boot: wire the HUD, the input and the game loop, then run. The loop
// advances the timer and the effects and redraws the current screen every
// frame; the DOM header is refreshed from the same state.

import { createGame, tick, updateFx } from './state.js';
import { drawScreen, updateHud } from './ui.js';
import { Sfx } from './audio.js';
import { wireInput } from './input.js';
import { applyShot } from './shots.js';
import { SCENES } from './scenes.js';
import { PANELS } from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const dom = {
  levelName: document.getElementById('levelName'),
  counter: document.getElementById('counter'),
  timerFill: document.getElementById('timerFill'),
  timerText: document.getElementById('timerText'),
  score: document.getElementById('score'),
  combo: document.getElementById('combo'),
  hintBtn: document.getElementById('hintBtn'),
  muteBtn: document.getElementById('muteBtn'),
  pauseBtn: document.getElementById('pauseBtn'),
  restartBtn: document.getElementById('restartBtn'),
  menuBtn: document.getElementById('menuBtn'),
  msg: document.getElementById('msg'),
  dots: document.getElementById('dots'),
};

const st = createGame();
const sfx = new Sfx();
try {
  st.best = Number(window.localStorage.getItem('pasar-malam-best') ?? 0) || 0;
} catch {
  st.best = 0;
}

wireInput(canvas, st, sfx, dom);
const shot = applyShot(st, window.location.search);
void shot;

let last = performance.now();
let lastTickSec = -1;
let bestSaved = false;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const ev = tick(st, dt);
  if (ev === 'timeout') sfx.lose();
  if (st.screen === 'play' && st.timeLeft <= 10.5 && st.timeLeft > 0 && !st.frozen) {
    const sec = Math.ceil(st.timeLeft);
    if (sec !== lastTickSec) {
      lastTickSec = sec;
      sfx.tick();
    }
  }
  if (st.screen === 'gameDone' && !bestSaved) {
    bestSaved = true;
    if (st.totalScore > st.best) {
      st.best = st.totalScore;
      try {
        window.localStorage.setItem('pasar-malam-best', String(st.best));
      } catch {
        /* best score is a nicety, never a failure */
      }
    }
  }
  updateFx(st, dt);
  drawScreen(ctx, st, now / 1000);
  updateHud(st, dom);
  if (!window.__gameReady) window.__gameReady = true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Test hook for the automated play-test: panel geometry, the current
// level's differences and the live state — read-only, no cheats.
window.__spot = { state: st, scenes: SCENES, panels: PANELS, version: 1 };
