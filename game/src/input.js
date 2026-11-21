// Input: mouse clicks on the canvas and the HUD buttons, plus keyboard
// shortcuts. Clicks on a panel are converted to scene coordinates and
// hit-tested against the level's differences; clicks on overlay buttons
// (title cards, pause, level-complete) go to ui.pressButton.

import { PANELS, SCENE_W, SCENE_H } from './render.js';
import { hitTest } from './differences.js';
import { markFound, useHint, wrongClick } from './state.js';
import { pressButton, screenButtons, togglePause } from './ui.js';

function canvasPos(canvas, e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function panelAt(pos) {
  for (let i = 0; i < PANELS.length; i++) {
    const p = PANELS[i];
    if (pos.x >= p.x && pos.x <= p.x + p.w && pos.y >= p.y && pos.y <= p.y + p.h) return i;
  }
  return -1;
}

export function wireInput(canvas, st, sfx, dom) {
  canvas.addEventListener('mousemove', (e) => {
    st.hover = canvasPos(canvas, e);
  });
  canvas.addEventListener('mouseleave', () => {
    st.hover = null;
  });

  canvas.addEventListener('click', (e) => {
    const pos = canvasPos(canvas, e);
    // Overlay buttons first (title cards, pause, complete screens).
    for (const b of screenButtons(st)) {
      if (pos.x >= b.x && pos.x <= b.x + b.w && pos.y >= b.y && pos.y <= b.y + b.h) {
        pressButton(st, b.id, sfx);
        return;
      }
    }
    if (st.screen !== 'play') return;
    const panel = panelAt(pos);
    if (panel < 0) return;
    const p = PANELS[panel];
    const sx = ((pos.x - p.x) / p.w) * SCENE_W;
    const sy = ((pos.y - p.y) / p.h) * SCENE_H;
    const diff = hitTest(st.scene, st.found, sx, sy);
    if (diff) {
      const res = markFound(st, diff);
      if (res) {
        sfx.found(st.streak);
        if (res.completed) sfx.win();
      }
    } else {
      wrongClick(st, sx, sy);
      st.wrongFlash.panel = panel;
      sfx.wrong();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'h' || e.key === 'H') {
      const diff = useHint(st);
      if (diff) sfx.hint();
    } else if (e.key === 'm' || e.key === 'M') {
      st.muted = !st.muted;
      sfx.muted = st.muted;
    } else if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
      togglePause(st);
    } else if (e.key === 'Enter' && st.screen === 'title') {
      pressButton(st, 'main', sfx);
    }
  });

  dom.hintBtn.addEventListener('click', () => {
    const diff = useHint(st);
    if (diff) sfx.hint();
  });
  dom.muteBtn.addEventListener('click', () => {
    st.muted = !st.muted;
    sfx.muted = st.muted;
  });
  dom.pauseBtn.addEventListener('click', () => togglePause(st));
  dom.restartBtn.addEventListener('click', () => {
    if (st.screen === 'play' || st.screen === 'paused' || st.screen === 'timeUp') {
      pressButton(st, 'retry', sfx);
    }
  });
  dom.menuBtn.addEventListener('click', () => pressButton(st, 'menu', sfx));
}
