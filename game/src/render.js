// Canvas renderer: every scene is drawn twice from the same code — the left
// panel with no difference applied, the right panel with all of them — so the
// two pictures are near-identical by construction and every difference sits
// exactly where scenes.js says it is. All art is procedural vector drawing;
// no image file is ever loaded.

import { mulberry32, range } from './random.js';

export const SCENE_W = 600;
export const SCENE_H = 640;
// Panel geometry on the 1280x700 stage canvas.
export const PANELS = [
  { x: 16, y: 8, w: 608, h: 648 },
  { x: 656, y: 8, w: 608, h: 648 },
];
export const PANEL_CAPTIONS = ['PANEL A', 'PANEL B'];

const OUTLINE = '#3a2410';

// ---------------------------------------------------------------- helpers

function rr(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function circle(g, x, y, r) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
}

function ell(g, x, y, rx, ry) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
}

function poly(g, pts) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
}

function star5(g, x, y, r, color) {
  g.fillStyle = color;
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
  g.fill();
}

function text(g, s, x, y, size, color, weight = '800', align = 'center') {
  g.fillStyle = color;
  g.font = `${weight} ${size}px "Segoe UI", Arial, sans-serif`;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(s, x, y);
}

function cloud(g, x, y, s, color = '#ffffff') {
  g.fillStyle = color;
  circle(g, x, y, 18 * s);
  g.fill();
  circle(g, x + 20 * s, y - 8 * s, 22 * s);
  g.fill();
  circle(g, x + 44 * s, y, 18 * s);
  g.fill();
  g.fillRect(x - 18 * s, y, 80 * s, 16 * s);
}

function birdMark(g, x, y, s, color) {
  g.strokeStyle = color;
  g.lineWidth = 3;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x - 12 * s, y);
  g.quadraticCurveTo(x - 5 * s, y - 9 * s, x, y);
  g.quadraticCurveTo(x + 5 * s, y - 9 * s, x + 12 * s, y);
  g.stroke();
}

function catSitting(g, x, y, s, color) {
  // A simple sitting cat silhouette, facing left.
  g.fillStyle = color;
  g.strokeStyle = OUTLINE;
  g.lineWidth = 2.5;
  ell(g, x, y, 20 * s, 26 * s);
  g.fill();
  g.stroke();
  circle(g, x - 2 * s, y - 30 * s, 15 * s);
  g.fill();
  g.stroke();
  poly(g, [[x - 14 * s, y - 40 * s], [x - 10 * s, y - 56 * s], [x - 2 * s, y - 42 * s]]);
  g.fill();
  g.stroke();
  poly(g, [[x + 6 * s, y - 42 * s], [x + 12 * s, y - 56 * s], [x + 16 * s, y - 40 * s]]);
  g.fill();
  g.stroke();
  // Tail curling around the base.
  g.strokeStyle = color;
  g.lineWidth = 7 * s;
  g.beginPath();
  g.arc(x + 8 * s, y + 16 * s, 16 * s, 0.3, 2.4);
  g.stroke();
  // Closed happy eye.
  g.strokeStyle = OUTLINE;
  g.lineWidth = 2;
  g.beginPath();
  g.arc(x - 8 * s, y - 32 * s, 3.5 * s, Math.PI, 0);
  g.stroke();
}

// ---------------------------------------------------------------- scene entry

/** Draw a scene into any rect (used for thumbnails and the title backdrop). */
export function drawSceneInto(ctx, scene, variant, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.translate(x, y);
  const s = w / SCENE_W;
  ctx.scale(s, s);
  const d = (id) => variant === 1 && scene.diffs.some((x) => x.id === id);
  if (scene.id === 'warung') drawWarung(ctx, d);
  else if (scene.id === 'pasar') drawPasar(ctx, d);
  else drawMercusuar(ctx, d);
  ctx.restore();
}

/** Draw one scene into panel `panel` (0 left, 1 right) on the stage canvas. */
export function drawScene(ctx, scene, variant, panel) {
  const p = PANELS[panel];
  drawSceneInto(ctx, scene, variant, p.x, p.y, p.w, p.h);
  // Frame + caption.
  ctx.save();
  ctx.strokeStyle = '#f5b942';
  ctx.lineWidth = 4;
  rr(ctx, p.x, p.y, p.w, p.h, 12);
  ctx.stroke();
  ctx.fillStyle = 'rgba(23,18,8,0.85)';
  rr(ctx, p.x + p.w / 2 - 52, p.y + p.h - 30, 104, 22, 11);
  ctx.fill();
  text(ctx, PANEL_CAPTIONS[panel], p.x + p.w / 2, p.y + p.h - 19, 13, '#ffd97a', '800');
  ctx.restore();
}

/** Draw a found-difference marker (ring + tick) on one panel, scene coords. */
export function drawFoundMarker(ctx, panel, diff, pulse) {
  const p = PANELS[panel];
  const s = p.w / SCENE_W;
  const cx = p.x + diff.x * s;
  const cy = p.y + diff.y * s;
  const r = diff.r * s + (pulse ? Math.sin(pulse * 4) * 2 : 0);
  ctx.save();
  ctx.strokeStyle = '#ff3b30';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
  ctx.stroke();
  // Tick.
  ctx.strokeStyle = '#ff3b30';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.45, cy);
  ctx.lineTo(cx - r * 0.1, cy + r * 0.35);
  ctx.lineTo(cx + r * 0.5, cy - r * 0.4);
  ctx.stroke();
  ctx.restore();
}

/** Draw the pulsing hint ring on one panel, scene coords. */
export function drawHintRing(ctx, panel, diff, t) {
  const p = PANELS[panel];
  const s = p.w / SCENE_W;
  const cx = p.x + diff.x * s;
  const cy = p.y + diff.y * s;
  const r = diff.r * s + 6 + Math.sin(t * 5) * 5;
  ctx.save();
  ctx.strokeStyle = '#ffd94a';
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 8]);
  ctx.lineDashOffset = -t * 30;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

// ---------------------------------------------------------------- scene 1: warung kopi pagi

function drawWarung(g, d) {
  // Sky.
  const sky = g.createLinearGradient(0, 0, 0, 640);
  sky.addColorStop(0, '#8ec9ee');
  sky.addColorStop(0.55, '#cfeef7');
  sky.addColorStop(1, '#fff3c4');
  g.fillStyle = sky;
  g.fillRect(0, 0, 600, 640);
  // Sun with rays.
  g.fillStyle = '#ffd94a';
  g.strokeStyle = '#e8a91c';
  g.lineWidth = 3;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    g.beginPath();
    g.moveTo(92 + Math.cos(a) * 54, 82 + Math.sin(a) * 54);
    g.lineTo(92 + Math.cos(a) * 68, 82 + Math.sin(a) * 68);
    g.stroke();
  }
  circle(g, 92, 82, 44);
  g.fill();
  g.stroke();
  // Sun face.
  g.fillStyle = OUTLINE;
  circle(g, 78, 76, 4);
  g.fill();
  circle(g, 106, 76, 4);
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 3;
  g.beginPath();
  g.arc(92, 88, 14, 0.2, Math.PI - 0.2);
  g.stroke();
  if (d('sun-glasses')) {
    // Sunglasses over the sunny face.
    g.fillStyle = '#171208';
    ell(g, 76, 78, 13, 9);
    g.fill();
    ell(g, 108, 78, 13, 9);
    g.fill();
    g.strokeStyle = '#171208';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(89, 78);
    g.lineTo(95, 78);
    g.stroke();
  }
  // Clouds + wire + bird.
  cloud(g, 280, 58, 1);
  cloud(g, 430, 44, 0.8);
  g.strokeStyle = '#5a4632';
  g.lineWidth = 2.5;
  g.beginPath();
  g.moveTo(430, 40);
  g.lineTo(580, 60);
  g.stroke();
  if (!d('wire-bird')) birdMark(g, 522, 88, 1, OUTLINE);
  birdMark(g, 350, 90, 0.8, OUTLINE);
  birdMark(g, 200, 70, 0.7, OUTLINE);
  // Hills + road.
  g.fillStyle = '#8fbf6a';
  g.beginPath();
  g.moveTo(0, 470);
  g.quadraticCurveTo(150, 420, 300, 465);
  g.quadraticCurveTo(450, 505, 600, 455);
  g.lineTo(600, 640);
  g.lineTo(0, 640);
  g.closePath();
  g.fill();
  g.fillStyle = '#e8c890';
  g.fillRect(0, 560, 600, 80);
  g.fillStyle = '#c9a86a';
  for (let x = 20; x < 600; x += 60) {
    ell(g, x, 600, 16, 5);
    g.fill();
  }
  // The stall: posts, awning, counter.
  g.fillStyle = '#7a4a21';
  g.fillRect(118, 150, 14, 260);
  g.fillRect(468, 150, 14, 260);
  // Awning stripes.
  const stripeColors = ['#e05252', '#fff3e0', '#e05252', '#fff3e0', '#e05252', '#fff3e0', '#e05252'];
  for (let i = 0; i < 7; i++) {
    let c = stripeColors[i];
    if (i === 3 && d('awning-stripe')) c = '#57c465';
    g.fillStyle = c;
    g.fillRect(110 + i * 54, 108, 54, 52);
    // Scalloped edge.
    circle(g, 110 + i * 54 + 27, 160, 27);
    g.fill();
  }
  g.strokeStyle = OUTLINE;
  g.lineWidth = 3;
  g.strokeRect(110, 108, 378, 52);
  // Cat asleep on the awning roof.
  if (!d('roof-cat')) {
    g.fillStyle = '#f2a541';
    g.strokeStyle = OUTLINE;
    g.lineWidth = 2.5;
    ell(g, 472, 106, 26, 12);
    g.fill();
    g.stroke();
    circle(g, 448, 100, 11);
    g.fill();
    g.stroke();
    poly(g, [[440, 92], [438, 78], [448, 88]]);
    g.fill();
    g.stroke();
    poly(g, [[456, 90], [460, 76], [464, 90]]);
    g.fill();
    g.stroke();
  }
  // Signboard.
  g.fillStyle = '#3a2410';
  rr(g, 190, 178, 220, 52, 10);
  g.fill();
  g.strokeStyle = '#f5b942';
  g.lineWidth = 2;
  rr(g, 190, 178, 220, 52, 10);
  g.stroke();
  text(g, 'KOPI PAGI', 300, 205, 26, '#ffd97a', '900');
  // Menu board.
  g.fillStyle = '#fff8e6';
  g.strokeStyle = OUTLINE;
  g.lineWidth = 3;
  rr(g, 392, 250, 130, 110, 8);
  g.fill();
  g.stroke();
  text(g, 'MENU', 457, 272, 16, OUTLINE, '900');
  text(g, 'Kopi Tubruk', 457, 296, 13, OUTLINE, '700', 'center');
  text(g, 'Rp 5K', 457, 322, 18, '#c0392b', '900');
  text(g, 'Pisang Goreng', 457, 344, 12, OUTLINE, '700');
  // Counter + cups + kettle.
  g.fillStyle = '#a86f3c';
  g.fillRect(130, 372, 340, 26);
  g.fillStyle = '#8a5a2e';
  g.fillRect(130, 398, 340, 60);
  g.fillStyle = '#7a4a21';
  for (let x = 150; x < 460; x += 34) g.fillRect(x, 398, 6, 60);
  const cups = d('cups') ? 2 : 3;
  for (let i = 0; i < cups; i++) {
    const cx = 160 + i * 44;
    g.fillStyle = '#fff3e0';
    g.strokeStyle = OUTLINE;
    g.lineWidth = 2.5;
    rr(g, cx, 344, 30, 28, 4);
    g.fill();
    g.stroke();
    g.fillStyle = '#6b4226';
    g.fillRect(cx + 4, 348, 22, 8);
    g.strokeStyle = OUTLINE;
    g.beginPath();
    g.arc(cx + 32, 358, 8, -1.2, 1.2);
    g.stroke();
  }
  // Kettle with steam, clear of the menu board: grey in panel A, copper in
  // panel B (this level's kettle-colour difference).
  g.fillStyle = d('kettle-color') ? '#d97b2f' : '#c0c8d0';
  g.strokeStyle = OUTLINE;
  g.lineWidth = 2.5;
  ell(g, 330, 352, 30, 20);
  g.fill();
  g.stroke();
  poly(g, [[322, 336], [338, 336], [332, 318], [328, 318]]);
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.85)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(330, 310);
  g.quadraticCurveTo(322, 292, 332, 278);
  g.quadraticCurveTo(340, 266, 332, 254);
  g.stroke();
  // Stools: chunky wooden benches — a thick rounded seat, four short legs
  // (the back pair a shade darker) and a stretcher bar, so they read as
  // benches instead of a flat bar on two sticks.
  for (const sx of [180, 300]) {
    g.fillStyle = '#5d3a1a';
    g.fillRect(sx + 10, 480, 8, 48);
    g.fillRect(sx + 46, 480, 8, 48);
    g.fillStyle = '#7a4a21';
    g.fillRect(sx + 4, 482, 10, 46);
    g.fillRect(sx + 50, 482, 10, 46);
    g.fillRect(sx + 4, 506, 56, 8);
    g.fillStyle = '#a86f3c';
    rr(g, sx - 2, 464, 68, 18, 7);
    g.fill();
    g.strokeStyle = OUTLINE;
    g.lineWidth = 2.5;
    rr(g, sx - 2, 464, 68, 18, 7);
    g.stroke();
    g.strokeStyle = '#8a5a2e';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(sx + 6, 473);
    g.lineTo(sx + 62, 473);
    g.stroke();
  }
  // Bicycle leaning on the right post.
  g.strokeStyle = OUTLINE;
  g.lineWidth = 3.5;
  circle(g, 505, 500, 26);
  g.stroke();
  circle(g, 560, 500, 26);
  g.stroke();
  g.beginPath();
  g.moveTo(505, 500);
  g.lineTo(535, 462);
  g.lineTo(560, 500);
  g.lineTo(530, 500);
  g.lineTo(505, 500);
  g.moveTo(535, 462);
  g.lineTo(548, 448);
  g.stroke();
  // Potted plant, bottom left.
  g.fillStyle = '#c96f4a';
  poly(g, [[68, 540], [116, 540], [108, 580], [76, 580]]);
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 2.5;
  poly(g, [[68, 540], [116, 540], [108, 580], [76, 580]]);
  g.stroke();
  g.strokeStyle = '#3f7a34';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(92, 540);
  g.quadraticCurveTo(70, 505, 60, 495);
  g.moveTo(92, 540);
  g.quadraticCurveTo(92, 498, 92, 488);
  g.moveTo(92, 540);
  g.quadraticCurveTo(114, 505, 124, 495);
  g.stroke();
  g.fillStyle = d('pot-flower') ? '#ffd94a' : '#e05252';
  circle(g, 60, 492, 9);
  g.fill();
  circle(g, 92, 484, 9);
  g.fill();
  circle(g, 124, 492, 9);
  g.fill();
  // Grass tufts.
  g.strokeStyle = '#3f7a34';
  g.lineWidth = 3;
  for (const gx of [220, 480, 550]) {
    g.beginPath();
    g.moveTo(gx, 640);
    g.lineTo(gx - 6, 622);
    g.moveTo(gx, 640);
    g.lineTo(gx, 620);
    g.moveTo(gx, 640);
    g.lineTo(gx + 6, 622);
    g.stroke();
  }
  // A stone path from the counter down to the road, plus wildflowers and
  // pebbles to fill the empty hill — background only, identical in both
  // panels, and clear of the stools, the bicycle and the panel captions.
  g.fillStyle = '#d9c9a8';
  g.strokeStyle = '#b39d72';
  g.lineWidth = 2;
  for (const [px, py] of [[415, 488], [445, 516], [412, 544], [442, 574], [414, 604], [444, 630]]) {
    ell(g, px, py, 22, 9);
    g.fill();
    g.stroke();
  }
  // Wildflower clusters: one stem, three bright petals, a yellow centre.
  for (const [fx, fy, col] of [[140, 500, '#ff8a5c'], [258, 542, '#ffd94a'], [560, 545, '#ff8a5c']]) {
    g.strokeStyle = '#3f7a34';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(fx, fy + 16);
    g.lineTo(fx, fy);
    g.stroke();
    g.fillStyle = col;
    circle(g, fx - 7, fy - 2, 5);
    g.fill();
    circle(g, fx + 7, fy - 2, 5);
    g.fill();
    circle(g, fx, fy - 8, 5);
    g.fill();
    g.fillStyle = '#ffd94a';
    circle(g, fx, fy - 2, 3);
    g.fill();
  }
  // Extra grass tufts and pebbles along the road's edge.
  g.strokeStyle = '#3f7a34';
  g.lineWidth = 3;
  for (const gx of [160, 400]) {
    g.beginPath();
    g.moveTo(gx, 640);
    g.lineTo(gx - 6, 622);
    g.moveTo(gx, 640);
    g.lineTo(gx, 620);
    g.moveTo(gx, 640);
    g.lineTo(gx + 6, 622);
    g.stroke();
  }
  g.fillStyle = '#b39d72';
  ell(g, 60, 622, 12, 5);
  g.fill();
  ell(g, 520, 616, 12, 5);
  g.fill();
}

// ---------------------------------------------------------------- scene 2: pasar malam

function drawPasar(g, d) {
  const sky = g.createLinearGradient(0, 0, 0, 640);
  sky.addColorStop(0, '#141a38');
  sky.addColorStop(0.55, '#2c2350');
  sky.addColorStop(1, '#4a2a5e');
  g.fillStyle = sky;
  g.fillRect(0, 0, 600, 640);
  // Stars (seeded, identical in both panels).
  const rng = mulberry32(20261121);
  for (let i = 0; i < 42; i++) {
    const sx = range(rng, 10, 590);
    const sy = range(rng, 8, 200);
    const sr = range(rng, 1, 2.6);
    g.fillStyle = `rgba(255,255,255,${range(rng, 0.35, 0.95)})`;
    circle(g, sx, sy, sr);
    g.fill();
  }
  if (d('bright-star')) star5(g, 302, 62, 11, '#ffe9a8');
  else star5(g, 302, 62, 6, 'rgba(255,255,255,0.8)');
  // Moon: full vs crescent.
  g.fillStyle = '#f7ead0';
  circle(g, 498, 72, 34);
  g.fill();
  g.fillStyle = '#e8d5ae';
  circle(g, 486, 64, 6);
  g.fill();
  circle(g, 508, 82, 4);
  g.fill();
  if (d('moon')) {
    g.fillStyle = '#232a4e';
    circle(g, 512, 62, 30);
    g.fill();
  }
  // String lights, two swags.
  const bulbColors = ['#ff5c5c', '#ffd94a', '#57c465', '#5ca8ff'];
  for (const [y0, y1, x0, x1] of [[70, 130, 20, 300], [70, 130, 300, 580]]) {
    g.strokeStyle = '#0e1226';
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(x0, y0);
    g.quadraticCurveTo((x0 + x1) / 2, y1 + 26, x1, y0);
    g.stroke();
    for (let i = 0; i <= 7; i++) {
      const t = i / 7;
      const bx = x0 + (x1 - x0) * t;
      const by = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 26;
      let bc = bulbColors[i % 4];
      if (x0 === 20 && i === 3 && d('string-bulb')) bc = '#57c465';
      g.fillStyle = bc;
      circle(g, bx, by + 8, 7);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.55)';
      circle(g, bx, by + 8, 10);
      g.globalAlpha = 0.25;
      g.fill();
      g.globalAlpha = 1;
    }
  }
  // Bunting flags under the lights.
  const flagColors = ['#e05252', '#ffd94a', '#57c465', '#5ca8ff', '#ff8a5c'];
  for (let i = 0; i < 12; i++) {
    const fx = 30 + i * 48;
    let fc = flagColors[i % 5];
    if (i === 9 && d('bunting-flag')) fc = '#9b59d0';
    g.fillStyle = fc;
    poly(g, [[fx, 150], [fx + 40, 150], [fx + 20, 178]]);
    g.fill();
  }
  // Ground: night street.
  g.fillStyle = '#241a33';
  g.fillRect(0, 470, 600, 170);
  g.fillStyle = 'rgba(245,185,66,0.14)';
  ell(g, 150, 540, 130, 26);
  g.fill();
  ell(g, 450, 540, 130, 26);
  g.fill();
  // Left stall: SATE.
  g.fillStyle = '#7a4a21';
  g.fillRect(60, 300, 180, 170);
  g.fillStyle = d('sate-awning') ? '#2f8f6f' : '#e05252';
  poly(g, [[48, 300], [252, 300], [240, 262], [60, 262]]);
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 3;
  poly(g, [[48, 300], [252, 300], [240, 262], [60, 262]]);
  g.stroke();
  text(g, 'SATE AYAM', 150, 282, 17, '#fff3e0', '900');
  // Skewers on the grill.
  g.fillStyle = '#3a2410';
  g.fillRect(80, 380, 140, 44);
  for (let i = 0; i < 3; i++) {
    g.fillStyle = '#f2a541';
    for (let j = 0; j < 4; j++) circle(g, 96 + j * 14 + i * 4, 392 + i * 10, 6), g.fill();
    g.strokeStyle = '#d9c9a8';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(84, 392 + i * 10);
    g.lineTo(216, 392 + i * 10);
    g.stroke();
  }
  // Middle stall: ES CAMPUR.
  g.fillStyle = '#2f6f8f';
  g.fillRect(250, 320, 140, 150);
  g.fillStyle = '#ffd94a';
  poly(g, [[240, 320], [400, 320], [388, 286], [252, 286]]);
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 3;
  poly(g, [[240, 320], [400, 320], [388, 286], [252, 286]]);
  g.stroke();
  text(g, 'ES CAMPUR', 320, 304, 15, OUTLINE, '900');
  for (let i = 0; i < 3; i++) {
    g.fillStyle = ['#ff8a5c', '#57c465', '#ff5c8a'][i];
    rr(g, 268 + i * 38, 360, 28, 40, 6);
    g.fill();
    g.fillStyle = '#fff3e0';
    g.fillRect(268 + i * 38, 352, 28, 8);
  }
  // Right stall: MAINAN with paper lantern.
  g.fillStyle = '#6b4a8f';
  g.fillRect(420, 310, 150, 160);
  g.fillStyle = '#57c465';
  poly(g, [[410, 310], [580, 310], [568, 276], [422, 276]]);
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 3;
  poly(g, [[410, 310], [580, 310], [568, 276], [422, 276]]);
  g.stroke();
  text(g, 'MAINAN', 495, 294, 15, '#fff3e0', '900');
  if (!d('paper-lantern')) {
    g.fillStyle = '#e05252';
    ell(g, 522, 330, 20, 26);
    g.fill();
    g.strokeStyle = OUTLINE;
    g.lineWidth = 2.5;
    ell(g, 522, 330, 20, 26);
    g.stroke();
    g.strokeStyle = '#ffd94a';
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(506, 322);
    g.lineTo(538, 322);
    g.moveTo(504, 332);
    g.lineTo(540, 332);
    g.stroke();
    g.fillStyle = '#ffd94a';
    g.fillRect(518, 302, 8, 6);
  }
  // Balloons, left edge.
  const balloons = d('balloon') ? 2 : 3;
  for (let i = 0; i < balloons; i++) {
    const bx = 70 + i * 36;
    const by = 210 + i * 14;
    g.fillStyle = ['#ff5c5c', '#5ca8ff', '#ffd94a'][i];
    ell(g, bx, by, 18, 23);
    g.fill();
    g.strokeStyle = OUTLINE;
    g.lineWidth = 2;
    ell(g, bx, by, 18, 23);
    g.stroke();
    g.beginPath();
    g.moveTo(bx, by + 23);
    g.quadraticCurveTo(bx + 8, by + 60, bx + 2, by + 92);
    g.stroke();
  }
  // Food cart with umbrella, centre bottom.
  g.fillStyle = '#8a5a2e';
  g.fillRect(280, 430, 120, 70);
  g.fillStyle = '#c9a86a';
  g.fillRect(280, 430, 120, 10);
  circle(g, 300, 510, 14);
  g.fillStyle = '#3a2410';
  circle(g, 300, 510, 14);
  g.fill();
  circle(g, 380, 510, 14);
  g.fill();
  // Umbrella over the cart.
  g.fillStyle = d('umbrella') ? '#5ca8ff' : '#e05252';
  g.beginPath();
  g.arc(340, 420, 74, Math.PI, 0);
  g.closePath();
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 3;
  g.beginPath();
  g.arc(340, 420, 74, Math.PI, 0);
  g.stroke();
  g.beginPath();
  g.moveTo(340, 346);
  g.lineTo(340, 430);
  g.stroke();
  // Fish on ice, left bottom.
  g.fillStyle = '#cfeef7';
  ell(g, 172, 486, 66, 18);
  g.fill();
  const fishes = d('ice-fish') ? 2 : 3;
  for (let i = 0; i < fishes; i++) {
    const fx = 140 + i * 34;
    g.fillStyle = '#9fc4d8';
    ell(g, fx, 478, 16, 8);
    g.fill();
    poly(g, [[fx + 14, 478], [fx + 24, 470], [fx + 24, 486]]);
    g.fill();
    g.fillStyle = OUTLINE;
    circle(g, fx - 8, 476, 2);
    g.fill();
  }
  // Crate with a cat, right bottom.
  g.fillStyle = '#a86f3c';
  g.fillRect(392, 520, 84, 56);
  g.strokeStyle = OUTLINE;
  g.lineWidth = 3;
  g.strokeRect(392, 520, 84, 56);
  g.beginPath();
  g.moveTo(392, 548);
  g.lineTo(476, 548);
  g.stroke();
  if (!d('crate-cat')) catSitting(g, 434, 500, 0.9, '#2b2b2b');
  // Two shoppers, simple silhouettes.
  for (const [sx, col] of [[240, '#e8b4d0'], [540, '#a8d8e8']]) {
    g.fillStyle = col;
    circle(g, sx, 560, 14);
    g.fill();
    rr(g, sx - 14, 574, 28, 46, 10);
    g.fill();
  }
}

// ---------------------------------------------------------------- scene 3: pulau mercusuar senja

function drawMercusuar(g, d) {
  const sky = g.createLinearGradient(0, 0, 0, 640);
  sky.addColorStop(0, '#5e3f7d');
  sky.addColorStop(0.45, '#c96f4a');
  sky.addColorStop(0.72, '#ff9d5c');
  sky.addColorStop(1, '#ffd97a');
  g.fillStyle = sky;
  g.fillRect(0, 0, 600, 640);
  // Low sun over the sea.
  g.fillStyle = '#ff7a3c';
  circle(g, 110, 372, 40);
  g.fill();
  g.fillStyle = 'rgba(255,217,122,0.5)';
  circle(g, 110, 372, 54);
  g.fill();
  // Clouds.
  cloud(g, 60, 90, 0.9, '#f7c9a8');
  if (!d('dusk-cloud')) cloud(g, 440, 100, 1.1, '#f7c9a8');
  // Gulls.
  if (!d('gull')) birdMark(g, 152, 92, 1, '#3a2410');
  birdMark(g, 420, 70, 0.8, '#3a2410');
  birdMark(g, 240, 60, 0.7, '#3a2410');
  // Sea.
  g.fillStyle = '#2f6f8f';
  g.fillRect(0, 400, 600, 240);
  g.fillStyle = '#3a8ab0';
  for (let y = 420; y < 620; y += 34) {
    for (let x = 0; x < 600; x += 90) {
      g.beginPath();
      g.arc(x + ((y / 34) % 2) * 45, y, 26, Math.PI, 0);
      g.strokeStyle = 'rgba(255,255,255,0.35)';
      g.lineWidth = 3;
      g.stroke();
    }
  }
  // Extra wave near the boat.
  if (d('wave')) {
    g.strokeStyle = '#ffffff';
    g.lineWidth = 4;
    g.beginPath();
    g.arc(152, 492, 30, Math.PI, 0);
    g.stroke();
    g.beginPath();
    g.arc(178, 500, 20, Math.PI, 0);
    g.stroke();
  }
  // Island sand.
  g.fillStyle = '#ecd9a8';
  ell(g, 300, 560, 280, 78);
  g.fill();
  g.strokeStyle = '#c9a86a';
  g.lineWidth = 3;
  ell(g, 300, 560, 280, 78);
  g.stroke();
  // Lighthouse.
  g.fillStyle = '#fff3e0';
  poly(g, [[272, 420], [328, 420], [318, 180], [282, 180]]);
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 3;
  poly(g, [[272, 420], [328, 420], [318, 180], [282, 180]]);
  g.stroke();
  // Red bands.
  g.fillStyle = '#e05252';
  poly(g, [[278, 330], [322, 330], [319, 296], [281, 296]]);
  g.fill();
  poly(g, [[284, 240], [316, 240], [313, 206], [287, 206]]);
  g.fill();
  // Window: lit vs dark.
  g.fillStyle = d('tower-window') ? '#3a2410' : '#ffd94a';
  rr(g, 290, 360, 20, 28, 6);
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 2.5;
  rr(g, 290, 360, 20, 28, 6);
  g.stroke();
  // Lamp room + dome.
  g.fillStyle = '#3a2410';
  g.fillRect(276, 150, 48, 32);
  g.fillStyle = '#ffd94a';
  circle(g, 300, 166, 12);
  g.fill();
  g.fillStyle = '#e05252';
  poly(g, [[272, 150], [328, 150], [300, 122]]);
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 3;
  poly(g, [[272, 150], [328, 150], [300, 122]]);
  g.stroke();
  // Flag on top: red vs blue.
  g.strokeStyle = OUTLINE;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(300, 122);
  g.lineTo(300, 92);
  g.stroke();
  g.fillStyle = d('top-flag') ? '#5ca8ff' : '#e05252';
  poly(g, [[300, 92], [336, 100], [300, 110]]);
  g.fill();
  // Beam: bright to the right vs off.
  if (d('beam')) {
    g.fillStyle = 'rgba(255,217,122,0.16)';
    poly(g, [[312, 158], [560, 110], [560, 210], [312, 176]]);
    g.fill();
  } else {
    g.fillStyle = 'rgba(255,217,122,0.55)';
    poly(g, [[312, 158], [560, 110], [560, 210], [312, 176]]);
    g.fill();
    g.fillStyle = '#fff3e0';
    poly(g, [[312, 162], [560, 128], [560, 192], [312, 172]]);
    g.fill();
  }
  // Palm tree, left.
  g.strokeStyle = '#7a4a21';
  g.lineWidth = 10;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(112, 480);
  g.quadraticCurveTo(104, 380, 118, 306);
  g.stroke();
  g.strokeStyle = '#3f7a34';
  g.lineWidth = 7;
  for (const [dx, dy, ex, ey] of [[-40, -16, -78, -44], [40, -16, 78, -44], [-30, 6, -66, 6], [30, 6, 66, 6], [-12, -22, -26, -66], [12, -22, 26, -66]]) {
    g.beginPath();
    g.moveTo(118 + dx * 0.4, 306 + dy * 0.4);
    g.quadraticCurveTo(118 + dx * 0.8, 306 + dy, 118 + ex * 0.55, 306 + ey * 0.55);
    g.stroke();
  }
  const nuts = d('coconuts') ? 2 : 3;
  g.fillStyle = '#7a4a21';
  for (let i = 0; i < nuts; i++) {
    circle(g, 106 + i * 14, 316 + (i % 2) * 8, 8);
    g.fill();
  }
  // Boat, right.
  g.fillStyle = '#7a4a21';
  poly(g, [[392, 440], [472, 440], [458, 462], [406, 462]]);
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 3;
  poly(g, [[392, 440], [472, 440], [458, 462], [406, 462]]);
  g.stroke();
  g.beginPath();
  g.moveTo(432, 440);
  g.lineTo(432, 372);
  g.stroke();
  g.fillStyle = d('sail') ? '#fff3e0' : '#e05252';
  poly(g, [[432, 376], [432, 436], [470, 436]]);
  g.fill();
  g.strokeStyle = OUTLINE;
  g.lineWidth = 2.5;
  poly(g, [[432, 376], [432, 436], [470, 436]]);
  g.stroke();
  // Beach finds.
  if (!d('crab')) {
    g.fillStyle = '#e05252';
    ell(g, 482, 566, 16, 11);
    g.fill();
    g.strokeStyle = OUTLINE;
    g.lineWidth = 2.5;
    ell(g, 482, 566, 16, 11);
    g.stroke();
    g.beginPath();
    g.moveTo(470, 556);
    g.lineTo(458, 546);
    g.moveTo(494, 556);
    g.lineTo(506, 546);
    g.stroke();
    g.fillStyle = OUTLINE;
    circle(g, 476, 560, 2);
    g.fill();
    circle(g, 488, 560, 2);
    g.fill();
  }
  star5(g, 252, 574, 16, d('starfish') ? '#9b59d0' : '#ff8a5c');
  if (!d('bucket')) {
    g.fillStyle = '#5ca8ff';
    poly(g, [[336, 552], [368, 552], [362, 580], [342, 580]]);
    g.fill();
    g.strokeStyle = OUTLINE;
    g.lineWidth = 2.5;
    poly(g, [[336, 552], [368, 552], [362, 580], [342, 580]]);
    g.stroke();
    g.strokeStyle = '#ffd94a';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(366, 556);
    g.lineTo(380, 540);
    g.stroke();
    circle(g, 382, 538, 5);
    g.fillStyle = '#ffd94a';
    circle(g, 382, 538, 5);
    g.fill();
  }
  if (!d('shell')) {
    g.fillStyle = '#ffb3c8';
    g.beginPath();
    g.arc(92, 584, 14, Math.PI, 0);
    g.closePath();
    g.fill();
    g.strokeStyle = OUTLINE;
    g.lineWidth = 2.5;
    g.beginPath();
    g.arc(92, 584, 14, Math.PI, 0);
    g.closePath();
    g.stroke();
    g.beginPath();
    g.moveTo(92, 584);
    g.lineTo(92, 570);
    g.stroke();
  }
  // Pebbles + sea foam on the sand edge.
  const rng2 = mulberry32(777);
  for (let i = 0; i < 14; i++) {
    g.fillStyle = '#c9b088';
    circle(g, range(rng2, 40, 560), range(rng2, 500, 620), range(rng2, 3, 6));
    g.fill();
  }
}
