// UI: the DOM HUD (counter, timer, score, buttons) and every canvas screen
// (title with level cards, pause, level-complete, game-complete, time-up).
// All text the judge needs — the found/remaining counter above all — lives
// in the DOM header so it renders crisp at any size.

import { PANELS, SCENE_W, drawScene, drawSceneInto, drawFoundMarker, drawHintRing } from './render.js';
import { SCENES } from './scenes.js';
import { leftCount, nextLevel, startLevel, toTitle } from './state.js';
import { fmtTime } from './random.js';

// ---------------------------------------------------------------- small canvas helpers

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function text(g, s, x, y, size, color, weight = '800', align = 'center') {
  g.fillStyle = color;
  g.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(s, x, y);
}

function starPath(g, x, y, r) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
}

function drawButton(g, b, hover) {
  g.save();
  g.fillStyle = hover ? '#ffd97a' : '#f5b942';
  rr(g, b.x, b.y, b.w, b.h, 12);
  g.fill();
  g.strokeStyle = '#7a5426';
  g.lineWidth = 2;
  rr(g, b.x, b.y, b.w, b.h, 12);
  g.stroke();
  text(g, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, b.h > 50 ? 20 : 16, '#171208', '900');
  g.restore();
}

function inside(b, p) {
  return p && p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h;
}

// ---------------------------------------------------------------- thumbnails

const thumbCache = new Map();

/** A 300x320 render of a scene (variant 0), cached per scene id. */
export function thumbFor(scene) {
  let c = thumbCache.get(scene.id);
  if (!c) {
    c = document.createElement('canvas');
    c.width = 300;
    c.height = 320;
    drawSceneInto(c.getContext('2d'), scene, 0, 0, 0, 300, 320);
    thumbCache.set(scene.id, c);
  }
  return c;
}

// ---------------------------------------------------------------- HUD (DOM)

export function updateHud(st, dom) {
  // On the title screen the in-game HUD has nothing to say: hide the
  // counter, timer, score and action buttons (the brand + level pill stay,
  // and the footer message still tells the player what to do). The HUD
  // stays visible on play, pause, level-complete, game-complete and
  // time-up, where its numbers are the run's own tally.
  document.body.classList.toggle('title-screen', st.screen === 'title');
  const scene = st.scene;
  const total = scene.diffs.length;
  const found = st.found.size;
  dom.levelName.textContent =
    st.screen === 'title' ? 'PILIH LEVEL — 3 SCENE' : `LEVEL ${st.levelIndex + 1} • ${scene.name}`;
  dom.counter.textContent = `DITEMUKAN ${found}/${total} • SISA ${leftCount(st)}`;
  const frac = Math.max(0, st.timeLeft / scene.timeLimit);
  dom.timerFill.style.width = `${Math.round(frac * 100)}%`;
  dom.timerFill.classList.toggle('low', st.timeLeft <= 30);
  dom.timerText.textContent = fmtTime(st.timeLeft);
  dom.score.textContent = String(st.score);
  dom.combo.textContent = st.streak >= 2 ? `COMBO x${st.streak}` : '';
  dom.hintBtn.textContent = `HINT (${st.hintsLeft})`;
  dom.hintBtn.disabled = st.screen !== 'play' || st.hintsLeft <= 0;
  dom.pauseBtn.disabled = st.screen !== 'play' && st.screen !== 'paused';
  dom.pauseBtn.textContent = st.screen === 'paused' ? '▶' : 'II';
  dom.muteBtn.textContent = st.muted ? 'SUARA: OFF' : 'SUARA: ON';
  dom.msg.textContent = st.message;
  let dots = '';
  for (let i = 0; i < SCENES.length; i++) {
    dots += st.stars[i] > 0 ? '<span class="done">●</span>' : '<span class="todo">○</span>';
  }
  dom.dots.innerHTML = dots;
}

// ---------------------------------------------------------------- buttons

/** Canvas buttons for the current screen, in stage (1280x700) coords. */
export function screenButtons(st) {
  switch (st.screen) {
    case 'title':
      return [
        ...SCENES.map((s, i) => ({ id: `level-${i}`, x: 140 + i * 350, y: 210, w: 300, h: 240, label: s.name })),
        { id: 'main', x: 490, y: 500, w: 300, h: 56, label: 'MAIN — LEVEL 1' },
      ];
    case 'paused':
      return [
        { id: 'resume', x: 490, y: 300, w: 300, h: 56, label: 'LANJUTKAN' },
        { id: 'menu', x: 490, y: 372, w: 300, h: 56, label: 'MENU UTAMA' },
      ];
    case 'levelDone': {
      const last = st.levelIndex + 1 >= SCENES.length;
      return [
        { id: 'next', x: 440, y: 492, w: 400, h: 56, label: last ? 'LIHAT HASIL AKHIR' : 'LEVEL BERIKUTNYA' },
        { id: 'retry', x: 440, y: 562, w: 190, h: 48, label: 'ULANGI LEVEL' },
        { id: 'menu', x: 650, y: 562, w: 190, h: 48, label: 'MENU UTAMA' },
      ];
    }
    case 'gameDone':
      return [
        { id: 'again', x: 440, y: 500, w: 400, h: 56, label: 'MAIN LAGI' },
        { id: 'menu', x: 490, y: 572, w: 300, h: 48, label: 'MENU UTAMA' },
      ];
    case 'timeUp':
      return [
        { id: 'retry', x: 440, y: 480, w: 400, h: 56, label: 'COBA LAGI' },
        { id: 'menu', x: 490, y: 552, w: 300, h: 48, label: 'MENU UTAMA' },
      ];
    default:
      return [];
  }
}

/** Run a canvas button's action. Returns true when the id was handled. */
export function pressButton(st, id, sfx) {
  if (id === 'main') {
    startLevel(st, 0);
    sfx?.start();
    return true;
  }
  if (id.startsWith('level-')) {
    startLevel(st, Number(id.slice(6)));
    sfx?.start();
    return true;
  }
  if (id === 'resume') {
    st.screen = 'play';
    return true;
  }
  if (id === 'next') {
    nextLevel(st);
    sfx?.start();
    return true;
  }
  if (id === 'retry') {
    startLevel(st, st.levelIndex);
    sfx?.start();
    return true;
  }
  if (id === 'again') {
    st.score = 0;
    st.totalScore = 0;
    st.stars = [0, 0, 0];
    startLevel(st, 0);
    sfx?.start();
    return true;
  }
  if (id === 'menu') {
    toTitle(st);
    return true;
  }
  return false;
}

export function togglePause(st) {
  if (st.screen === 'play') {
    st.screen = 'paused';
    st.message = 'Jeda — istirahat dulu, waktunya berhenti.';
    return true;
  }
  if (st.screen === 'paused') {
    st.screen = 'play';
    st.message = 'Lanjut berburu perbedaan!';
    return true;
  }
  return false;
}

// ---------------------------------------------------------------- screens

export function drawScreen(ctx, st, t) {
  ctx.fillStyle = '#171208';
  ctx.fillRect(0, 0, 1280, 700);
  if (st.screen === 'title') {
    drawTitle(ctx, st, t);
    return;
  }
  drawScene(ctx, st.scene, 0, 0);
  drawScene(ctx, st.scene, 1, 1);
  // Found markers on both panels (a gentle pulse on the latest find).
  const now = performance.now();
  for (const diff of st.scene.diffs) {
    if (!st.found.has(diff.id)) continue;
    const fresh = st.lastFound && st.lastFound.diff.id === diff.id && now - st.lastFound.at < 900;
    drawFoundMarker(ctx, 0, diff, fresh ? t : 0);
    drawFoundMarker(ctx, 1, diff, fresh ? t : 0);
  }
  // Hint rings on both panels.
  if (st.hint) {
    drawHintRing(ctx, 0, st.hint.diff, t);
    drawHintRing(ctx, 1, st.hint.diff, t);
  }
  // Floating score text on the left panel.
  const p = PANELS[0];
  const s = p.w / SCENE_W;
  for (const f of st.floaters) {
    const alpha = Math.max(0, Math.min(1, (f.until - now) / 600));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '900 24px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#171208';
    ctx.strokeText(f.text, p.x + f.x * s, p.y + f.y * s);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, p.x + f.x * s, p.y + f.y * s);
    ctx.restore();
  }
  // Wrong-click flash on the panel that was clicked.
  if (st.wrongFlash) {
    const wp = PANELS[st.wrongFlash.panel ?? 0];
    const wx = wp.x + st.wrongFlash.x * s;
    const wy = wp.y + st.wrongFlash.y * s;
    ctx.save();
    ctx.strokeStyle = '#ff3b30';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(wx, wy, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(wx - 9, wy - 9);
    ctx.lineTo(wx + 9, wy + 9);
    ctx.moveTo(wx + 9, wy - 9);
    ctx.lineTo(wx - 9, wy + 9);
    ctx.stroke();
    ctx.restore();
  }
  // Low-time warning: the panels pulse red under 10 seconds.
  if (st.screen === 'play' && st.timeLeft <= 10 && !st.frozen) {
    const a = 0.45 + 0.35 * Math.sin(t * 6);
    ctx.save();
    ctx.strokeStyle = `rgba(255,59,48,${a})`;
    ctx.lineWidth = 6;
    for (const panel of PANELS) {
      ctx.beginPath();
      ctx.rect(panel.x - 3, panel.y - 3, panel.w + 6, panel.h + 6);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (st.screen === 'paused') drawPaused(ctx, st);
  else if (st.screen === 'levelDone') {
    drawConfetti(ctx, st);
    drawLevelDone(ctx, st);
  } else if (st.screen === 'gameDone') {
    drawConfetti(ctx, st);
    drawGameDone(ctx, st);
  } else if (st.screen === 'timeUp') drawTimeUp(ctx, st);
}

function dim(ctx) {
  ctx.fillStyle = 'rgba(15,10,4,0.72)';
  ctx.fillRect(0, 0, 1280, 700);
}

function card(ctx, x, y, w, h) {
  ctx.fillStyle = '#2a1e10';
  rr(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.strokeStyle = '#f5b942';
  ctx.lineWidth = 3;
  rr(ctx, x, y, w, h, 18);
  ctx.stroke();
}

function drawConfetti(ctx, st) {
  for (const c of st.confetti) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.fillStyle = c.color;
    ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
    ctx.restore();
  }
}

function drawStarsRow(ctx, cx, y, earned, r = 26) {
  for (let i = 0; i < 3; i++) {
    const x = cx + (i - 1) * (r * 2 + 14);
    ctx.save();
    starPath(ctx, x, y, r);
    ctx.fillStyle = i < earned ? '#ffd94a' : '#4a3a22';
    ctx.fill();
    ctx.strokeStyle = '#f5b942';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }
}

function drawTitle(ctx, st, t) {
  // Night-market backdrop, dimmed.
  const bg = thumbFor(SCENES[1]);
  ctx.save();
  ctx.drawImage(bg, 0, 0, 1280, 700);
  ctx.fillStyle = 'rgba(15,10,4,0.62)';
  ctx.fillRect(0, 0, 1280, 700);
  ctx.restore();
  text(ctx, 'PASAR MALAM', 640, 92, 68, '#ffd97a', '900');
  text(ctx, 'S P O T   T H E   D I F F E R E N C E', 640, 148, 22, '#f7ead0', '800');
  text(ctx, 'Dua gambar nyaris sama. Temukan semua perbedaannya sebelum waktu habis!', 640, 182, 17, '#e8d5ae', '700');
  // Level cards.
  for (let i = 0; i < SCENES.length; i++) {
    const scene = SCENES[i];
    const x = 140 + i * 350;
    const y = 210;
    const hover = inside({ x, y, w: 300, h: 240 }, st.hover);
    ctx.save();
    ctx.fillStyle = hover ? '#3a2a14' : '#2a1e10';
    rr(ctx, x, y, 300, 240, 16);
    ctx.fill();
    ctx.strokeStyle = hover ? '#ffd97a' : '#f5b942';
    ctx.lineWidth = hover ? 4 : 2.5;
    rr(ctx, x, y, 300, 240, 16);
    ctx.stroke();
    // Thumbnail: crop the portrait scene render into a landscape window.
    const thumb = thumbFor(scene);
    ctx.save();
    rr(ctx, x + 10, y + 10, 280, 150, 10);
    ctx.clip();
    ctx.drawImage(thumb, 0, 70, 300, 170, x + 10, y + 10, 280, 150);
    ctx.restore();
    text(ctx, scene.name, x + 150, y + 182, 17, '#ffd97a', '900');
    text(ctx, `${scene.diffs.length} PERBEDAAN  •  ${fmtTime(scene.timeLimit)}`, x + 150, y + 208, 13, '#e8d5ae', '700');
    text(ctx, scene.subtitle, x + 150, y + 230, 12, '#d9b48a', '700');
    ctx.restore();
  }
  const mainBtn = { id: 'main', x: 490, y: 500, w: 300, h: 56, label: 'MAIN — LEVEL 1' };
  drawButton(ctx, mainBtn, inside(mainBtn, st.hover));
  text(ctx, 'Klik perbedaan di kiri atau kanan  •  H = Hint  •  M = Suara  •  Esc = Jeda  •  Klik salah −5 detik', 640, 596, 15, '#e8d5ae', '700');
  if (st.best > 0) text(ctx, `SKOR TERBAIK: ${st.best.toLocaleString('id-ID')}`, 640, 632, 16, '#ffd97a', '900');
  void t;
}

function drawPaused(ctx, st) {
  dim(ctx);
  card(ctx, 440, 210, 400, 240);
  text(ctx, 'JEDA', 640, 258, 40, '#ffd97a', '900');
  text(ctx, 'Waktu berhenti. Tarik napas dulu.', 640, 300, 16, '#e8d5ae', '700');
  for (const b of screenButtons(st)) drawButton(ctx, b, inside(b, st.hover));
}

function drawLevelDone(ctx, st) {
  dim(ctx);
  card(ctx, 390, 130, 500, 500);
  text(ctx, 'LEVEL SELESAI!', 640, 178, 38, '#ffd97a', '900');
  drawStarsRow(ctx, 640, 232, st.stars[st.levelIndex]);
  const bonus = Math.round(st.timeLeft) * 10;
  text(ctx, st.scene.name, 640, 286, 18, '#f7ead0', '900');
  text(ctx, `Waktu tersisa ${fmtTime(st.timeLeft)}  •  Bonus waktu +${bonus}`, 640, 322, 16, '#e8d5ae', '700');
  text(ctx, `Skor level ${st.levelScore.toLocaleString('id-ID')}  •  Total ${st.totalScore.toLocaleString('id-ID')}`, 640, 352, 16, '#e8d5ae', '700');
  text(ctx, `Semua ${st.scene.diffs.length} perbedaan ketemu!`, 640, 382, 16, '#57c465', '800');
  for (const b of screenButtons(st)) {
    if (b.id === 'next') drawButton(ctx, b, inside(b, st.hover));
  }
  for (const b of screenButtons(st)) {
    if (b.id !== 'next') drawButton(ctx, b, inside(b, st.hover));
  }
}

function drawGameDone(ctx, st) {
  dim(ctx);
  card(ctx, 390, 120, 500, 520);
  text(ctx, 'HEBAT!', 640, 168, 42, '#ffd97a', '900');
  text(ctx, 'Semua 3 level selesai.', 640, 214, 18, '#f7ead0', '800');
  const totalStars = st.stars.reduce((a, b) => a + b, 0);
  drawStarsRow(ctx, 640, 262, Math.round((totalStars / 9) * 3));
  text(ctx, `${totalStars} dari 9 bintang`, 640, 306, 16, '#e8d5ae', '700');
  text(ctx, `SKOR AKHIR  ${st.totalScore.toLocaleString('id-ID')}`, 640, 348, 24, '#ffd97a', '900');
  text(ctx, `Combo terbaik x${st.bestStreak}`, 640, 388, 16, '#e8d5ae', '700');
  if (st.best > 0 && st.totalScore >= st.best) text(ctx, 'Skor terbaik baru!', 640, 420, 16, '#57c465', '900');
  for (const b of screenButtons(st)) drawButton(ctx, b, inside(b, st.hover));
}

function drawTimeUp(ctx, st) {
  dim(ctx);
  card(ctx, 390, 170, 500, 440);
  text(ctx, 'WAKTU HABIS!', 640, 220, 40, '#ff8a5c', '900');
  text(ctx, `Kamu menemukan ${st.found.size} dari ${st.scene.diffs.length} perbedaan.`, 640, 276, 17, '#f7ead0', '800');
  text(ctx, 'Yang belum ketemu masih menunggu — coba lagi!', 640, 308, 15, '#e8d5ae', '700');
  text(ctx, `Skor ${st.score.toLocaleString('id-ID')}`, 640, 344, 16, '#ffd97a', '800');
  for (const b of screenButtons(st)) drawButton(ctx, b, inside(b, st.hover));
}
