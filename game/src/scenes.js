// Scene data: three original Indonesian scenes of rising difficulty.
// Coordinates live in the scene's own 600 x 640 space; render.js draws the
// scene twice (left panel = base, right panel = every difference applied)
// and differences.js hit-tests clicks against these same coordinates.

export const SCENES = [
  {
    id: 'warung',
    name: 'WARUNG KOPI PAGI',
    subtitle: 'Level 1 — Santai',
    blurb: 'Pagi di warung kopi: matahari naik, kukusan mengepul, kucing tidur di atap.',
    timeLimit: 120,
    hints: 3,
    diffs: [
      { id: 'sun-glasses', x: 92, y: 82, r: 36, label: 'Kacamata matahari' },
      { id: 'awning-stripe', x: 300, y: 148, r: 30, label: 'Warna garis awning' },
      { id: 'roof-cat', x: 472, y: 118, r: 30, label: 'Kucing di atap' },
      { id: 'cups', x: 178, y: 382, r: 30, label: 'Jumlah cangkir' },
      { id: 'kettle-color', x: 330, y: 352, r: 28, label: 'Warna ketel' },
      { id: 'wire-bird', x: 522, y: 92, r: 24, label: 'Burung di kabel' },
      { id: 'pot-flower', x: 92, y: 522, r: 26, label: 'Warna bunga pot' },
    ],
  },
  {
    id: 'pasar',
    name: 'PASAR MALAM',
    subtitle: 'Level 2 — Ramai',
    blurb: 'Lampu gantung, lapak sate, balon, dan kucing pasar yang mengintip dari peti.',
    timeLimit: 150,
    hints: 3,
    diffs: [
      { id: 'moon', x: 498, y: 72, r: 36, label: 'Bentuk bulan' },
      { id: 'string-bulb', x: 152, y: 112, r: 22, label: 'Warna satu lampu gantung' },
      { id: 'balloon', x: 92, y: 222, r: 30, label: 'Balon yang hilang' },
      { id: 'sate-awning', x: 150, y: 282, r: 30, label: 'Warna atap lapak sate' },
      { id: 'paper-lantern', x: 522, y: 302, r: 28, label: 'Lampion kertas' },
      { id: 'crate-cat', x: 432, y: 522, r: 28, label: 'Kucing di atas peti' },
      { id: 'ice-fish', x: 172, y: 472, r: 28, label: 'Jumlah ikan di atas es' },
      { id: 'umbrella', x: 332, y: 422, r: 30, label: 'Warna payung' },
      { id: 'bright-star', x: 302, y: 62, r: 20, label: 'Bintang paling terang' },
      { id: 'bunting-flag', x: 452, y: 142, r: 22, label: 'Warna bendera umbul-umbul' },
    ],
  },
  {
    id: 'mercusuar',
    name: 'PULAU MERCUSUAR SENJA',
    subtitle: 'Level 3 — Senja',
    blurb: 'Senja di pulau kecil: mercusuar menyala, perahu pulang, kepiting jalan-jalan.',
    timeLimit: 180,
    hints: 3,
    diffs: [
      { id: 'beam', x: 300, y: 122, r: 34, label: 'Sinar mercusuar' },
      { id: 'sail', x: 432, y: 422, r: 30, label: 'Warna layar perahu' },
      { id: 'gull', x: 152, y: 92, r: 24, label: 'Burung camar' },
      { id: 'coconuts', x: 112, y: 302, r: 26, label: 'Jumlah kelapa' },
      { id: 'crab', x: 482, y: 562, r: 26, label: 'Kepiting di pasir' },
      { id: 'starfish', x: 252, y: 572, r: 24, label: 'Warna bintang laut' },
      { id: 'bucket', x: 352, y: 562, r: 26, label: 'Ember dan sekop' },
      { id: 'top-flag', x: 300, y: 62, r: 22, label: 'Bendera puncak menara' },
      { id: 'tower-window', x: 300, y: 222, r: 22, label: 'Jendela menara menyala' },
      { id: 'dusk-cloud', x: 482, y: 102, r: 30, label: 'Awan senja' },
      { id: 'wave', x: 152, y: 482, r: 28, label: 'Ombak di dekat perahu' },
      { id: 'shell', x: 92, y: 582, r: 22, label: 'Kerang di pasir' },
    ],
  },
];

export function sceneById(id) {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}
