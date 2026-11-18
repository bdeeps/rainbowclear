// Chapter 2: the 42 degree angle. A bundle of parallel rays through one drop, with the live graph of exit angle
// against impact parameter. Real indices: red 1.331, violet 1.344 (optics.js). Rays leave almost parallel where the
// curve turns over, so light piles up there: about 42.3° for red and 40.5° for violet (primary), 50.4° and 53.7° (secondary).
import { THREE, RayLines, makeDrop, plane, canvasTexture, RED, VIOLET, BANDS, nWater, N_RED, N_VIOLET, trace, epsilon, epsExtreme, bExtreme, hexRGB, dim, DEG, FONT } from '../optics.js';

const RD = 1.9, DX = -2.7, GW = 6.8, GH = 5.1;
const CRED = hexRGB(RED.hex), CVIO = hexRGB(VIOLET.hex);

function drawGraph(g, w, h, o) {
  const k = o.k, y0 = k === 1 ? 0 : 40, y1 = k === 1 ? 50 : 180, L = 96, R = w - 30, T = 40, B = h - 90;
  const X = (b) => L + b * (R - L), Y = (e) => B - ((e - y0) / (y1 - y0)) * (B - T);
  g.fillStyle = '#0d0f16'; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,255,.09)'; g.lineWidth = 1; g.fillStyle = '#8a91a6'; g.font = '20px Geist, system-ui, sans-serif'; g.textAlign = 'right';
  const stepY = k === 1 ? 10 : 20;
  for (let e = y0; e <= y1; e += stepY) { g.beginPath(); g.moveTo(L, Y(e)); g.lineTo(R, Y(e)); g.stroke(); g.fillText(e + '°', L - 10, Y(e) + 7); }
  g.textAlign = 'center';
  for (let b = 0; b <= 1.001; b += 0.25) { g.beginPath(); g.moveTo(X(b), T); g.lineTo(X(b), B); g.stroke(); g.fillText(b.toFixed(2), X(b), B + 28); }
  g.fillStyle = '#c4c9d8'; g.font = FONT; g.fillText('Impact parameter b: how far from the centre the ray arrives', (L + R) / 2, h - 18);
  g.save(); g.translate(26, (T + B) / 2); g.rotate(-Math.PI / 2); g.fillText('Angle from straight back (ε)', 0, 0); g.restore();
  const eR = epsExtreme(N_RED, k) * DEG, eV = epsExtreme(N_VIOLET, k) * DEG, bR = bExtreme(N_RED, k), bV = bExtreme(N_VIOLET, k);
  g.fillStyle = 'rgba(255,255,255,.07)';
  let lo = 1, hi = 0; for (let i = 0; i <= 400; i++) { const b = i / 400 * 0.999; if (Math.abs(epsilon(b, N_RED, k) * DEG - eR) < 1) { lo = Math.min(lo, b); hi = Math.max(hi, b); } }
  g.fillRect(X(lo), T, X(hi) - X(lo), B - T);
  g.fillStyle = '#c4c9d8'; g.font = '19px Geist, system-ui, sans-serif'; g.textAlign = 'center';
  g.fillText('rays here leave', (X(lo) + X(hi)) / 2, T + 20); g.fillText('within 1° of each other', (X(lo) + X(hi)) / 2, T + 42);
  const cols = o.both ? [RED, ...BANDS.slice(1, 6), VIOLET] : [o.red ? RED : VIOLET];
  cols.forEach((Bd) => {
    const n = nWater(Bd.nm), c = '#' + Bd.hex.toString(16).padStart(6, '0'), thick = Bd === RED || Bd === VIOLET;
    g.strokeStyle = c; g.lineWidth = thick ? 4 : 2; g.globalAlpha = thick ? 1 : 0.55; g.beginPath();
    for (let i = 0; i <= 300; i++) { const b = (i / 300) * 0.9995, e = epsilon(b, n, k) * DEG; i ? g.lineTo(X(b), Y(e)) : g.moveTo(X(b), Y(e)); }
    g.stroke(); g.globalAlpha = 1;
  });
  const mark = (e, b, c, txt, dy) => { g.strokeStyle = c; g.setLineDash([6, 6]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(L, Y(e)); g.lineTo(X(b), Y(e)); g.stroke(); g.setLineDash([]); g.fillStyle = c; g.beginPath(); g.arc(X(b), Y(e), 6, 0, 7); g.fill(); g.textAlign = 'left'; g.font = '500 21px Geist, system-ui, sans-serif'; g.fillText(txt, X(b) + 12, Y(e) + dy); };
  if (o.both || o.red) mark(eR, bR, '#ff5c4d', `red ${eR.toFixed(1)}°`, k === 1 ? -10 : 28);
  if (o.both || !o.red) mark(eV, bV, '#c04cff', `violet ${eV.toFixed(1)}°`, k === 1 ? 24 : -10);
  const bb = o.aim; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(bb), T); g.lineTo(X(bb), B); g.stroke();
  g.fillStyle = '#fff'; (o.both ? [N_RED, N_VIOLET] : [o.red ? N_RED : N_VIOLET]).forEach((n) => { g.beginPath(); g.arc(X(bb), Y(epsilon(bb, n, k) * DEG), 7, 0, 7); g.fill(); });
}

export default {
  id: 'angle',
  short: 'The 42° angle',
  title: 'Why light piles up at 42°',
  subtitle: 'Most rays leave a drop in all directions. Near one angle they bunch up, and that is the bow.',
  view: { pos: [0.3, 0.2, 13], target: [0.3, 0, 0] },
  learn: `<p>Sunlight hits a drop at every height at once. Each ray bends in, reflects off the back, bends out and leaves at its own angle. The graph shows that <b>exit angle against impact parameter</b>. It rises, <b>turns over at a maximum</b>, then falls again.</p>
    <p>Near the top of that hump, many different rays leave at almost the <b>same angle</b>. They bunch together and arrive at your eye as one bright band: that is the rainbow. Descartes found it by tracing ray after ray in 1637. The turning point comes where <span class="formula">cos² i = (n² − 1) / 3</span>, which for red light gives a ray turned by about 137.6°, or <b>42.3° from straight back</b>.</p>
    <p>Violet has a slightly larger n, so its hump peaks lower, at about <b>40.5°</b>. That is why the bow has <b>red on the outside</b> and violet on the inside. Switch to <b>Two bounces</b> and the curve has a <i>minimum</i> near 50.4° (red) and 53.7° (violet): the secondary bow, with the order of colours reversed.</p>
    <p class="tip"><b>Try it:</b> press <b>Aim at the pile-up</b>. Then sweep the aim slider and watch the dot on the graph barely move near the peak.</p>`,
  terms: [
    { t: 'Rainbow angle', d: 'The angle between the line toward the antisolar point and the light reaching you. For the main bow it is about 42° for red.' },
    { t: 'Minimum deviation', d: 'The smallest turning angle for rays that bounce once. Light bunches there, so it looks bright.' },
    { t: 'Descartes ray', d: 'The single ray at the turning point of the curve, the one that leaves at the rainbow angle.' },
    { t: 'Antisolar point', d: 'The point in the sky directly opposite the Sun, below the horizon. The bow is a circle around it.' },
  ],
  defaults: { k: 1, colour: 'both', rays: 54, aim: 0.7 },
  controls: [
    { key: 'k', type: 'seg', label: 'Bounces inside the drop', options: [{ v: 1, label: 'One (main bow)' }, { v: 2, label: 'Two (secondary)' }] },
    { key: 'colour', type: 'seg', label: 'Colours', options: [{ v: 'red', label: 'Red' }, { v: 'violet', label: 'Violet' }, { v: 'both', label: 'Both' }] },
    { key: 'rays', type: 'range', label: 'Number of rays', min: 12, max: 140, step: 1, fmt: (v) => Math.round(v) + ' rays' },
    { key: 'aim', type: 'range', label: 'Aim one ray', min: 0.02, max: 0.995, step: 0.002, fmt: (v) => 'b = ' + v.toFixed(3) },
    { key: 'act', type: 'buttons', label: 'Shortcut', items: [{ label: 'Aim at the pile-up', act: (s) => { s.aim = bExtreme(s.colour === 'violet' ? N_VIOLET : N_RED, s.k); } }] },
  ],
  quiz: [
    { q: 'Why is the rainbow bright at about 42° from the antisolar point?', options: ['The drop is brightest there', 'Many rays leave at nearly the same angle', 'Red light travels fastest there', 'The Sun is 42° high'], answer: 1, why: 'The exit angle peaks at the Descartes ray, so a wide range of rays leave almost parallel and add up.' },
    { q: 'Which colour is on the outside of the main bow?', options: ['Violet', 'Green', 'Red', 'It depends on the sky'], answer: 2, why: 'Red’s peak angle is about 42.3°, higher than violet’s 40.5°, so red sits on the outer edge.' },
    { q: 'What changes for rays that bounce twice?', options: ['Nothing', 'The curve has a minimum, near 51°', 'They leave at 42°', 'They stay inside'], answer: 1, why: 'Two bounces give a minimum of the exit angle near 50.4° for red, which makes the fainter secondary bow.' },
  ],
  reel: [
    { ms: 5400, caption: 'Rays hit a drop at every height. Most scatter, but near one angle they bunch up.', set: { k: 1, colour: 'red', rays: 60 }, anim: { aim: [0.15, 0.862] }, spin: 0 },
    { ms: 5600, caption: 'Red piles up near 42°, violet near 40.5°. That small gap is the whole band of colour.', set: { k: 1, colour: 'both', rays: 80, aim: 0.862 }, spin: 0 },
  ],
  build({ stage }) {
    stage.floor.visible = false;
    const g = new THREE.Group(); stage.root.add(g);
    const drop = makeDrop(RD); drop.position.x = DX; g.add(drop);
    const sunL = new RayLines(stage, 40, { width: 1.2, opacity: 0.35 });
    const bundle = new RayLines(stage, 1800, { width: 1.6, opacity: 0.8 });
    const hot = new RayLines(stage, 1000, { width: 3.2, opacity: 1 });
    const aimL = new RayLines(stage, 60, { width: 5, opacity: 1 });
    g.add(sunL.obj, bundle.obj, hot.obj, aimL.obj);
    stage.label('Sunlight →', [DX - 3.4, 2.8, 0]);
    const gr = canvasTexture(1024, 768, (c, w, h, o) => o && drawGraph(c, w, h, o));
    const gp = plane(GW, GH, gr.tex); gp.position.set(4.9, 0.1, 0); g.add(gp);
    stage.label('Live graph', [4.9, GH / 2 + 0.35, 0]);
    let sig = '', dirty = true;
    document.fonts?.ready.then(() => { dirty = true; });
    const P = (t) => t.pts.map(([x, y]) => [x * RD + DX, y * RD, 0]);
    return {
      update(dt, st) {
        const sg = [st.k, st.colour, Math.round(st.rays), st.aim.toFixed(4)].join();
        if (sg === sig && !dirty) return; sig = sg; dirty = false;
        const cs = st.colour === 'both' ? [[N_RED, CRED], [N_VIOLET, CVIO]] : st.colour === 'red' ? [[N_RED, CRED]] : [[N_VIOLET, CVIO]];
        sunL.begin(); for (let j = -5; j <= 5; j++) { const y = j * 0.38; sunL.seg([DX - 5, y, 0], [DX - Math.sqrt(RD * RD - y * y), y, 0], [1, 0.95, 0.8]); } sunL.end();
        bundle.begin(); hot.begin(); aimL.begin();
        const N = Math.round(st.rays);
        cs.forEach(([n, c]) => {
          const e0 = epsExtreme(n, st.k);
          for (let j = 0; j < N; j++) {
            const b = (j + 0.5) / N, pts = P(trace(b, n, st.k, 1.6)), pile = Math.abs(epsilon(b, n, st.k) - e0) < Math.PI / 180;
            (pile ? hot : bundle).poly(pts, pile ? c : dim(c, 0.55));
          }
          aimL.poly(P(trace(st.aim, n, st.k, 2.1)), c.map((v) => 0.55 + 0.45 * v));
        });
        bundle.end(); hot.end(); aimL.end();
        gr.redraw({ k: st.k, both: st.colour === 'both', red: st.colour !== 'violet', aim: st.aim });
      },
      readout(st) {
        const n = st.colour === 'violet' ? N_VIOLET : N_RED, e = epsilon(st.aim, n, st.k) * DEG, e0 = epsExtreme(n, st.k) * DEG;
        const N = Math.round(st.rays); let near = 0;
        for (let j = 0; j < N; j++) if (Math.abs(epsilon((j + 0.5) / N, n, st.k) * DEG - e0) < 1) near++;
        const pct = Math.round((near / N) * 100);
        return `<div class="big">${st.k === 1 ? 'Main bow' : 'Secondary bow'}: ${(epsExtreme(N_RED, st.k) * DEG).toFixed(1)}° red, ${(epsExtreme(N_VIOLET, st.k) * DEG).toFixed(1)}° violet</div>
          <p class="r-say">${near} of ${N} rays (${pct}%) leave within 1° of the ${st.colour === 'violet' ? 'violet' : 'red'} peak. A narrow strip of the drop sends light to one spot in the sky.</p>
          <div class="row"><span>Your ray leaves at</span><b>${e.toFixed(1)}° from straight back</b></div>
          <div class="row"><span>The peak ray arrives at b =</span><b>${bExtreme(n, st.k).toFixed(3)}</b></div>`;
      },
    };
  },
};
