// Chapter 1: one raindrop. Refraction (Snell's law), one reflection, and dispersion: violet bends more than red.
// Real indices for water from optics.js (about 1.331 for red, 1.344 for violet). The "stretch" control multiplies
// the difference between each colour's index and red's so the spreading is easy to see; it is labelled when on.
import { THREE, M, RayLines, makeDrop, BANDS, RED, VIOLET, nWater, N_RED, trace, deviation, epsilon, hexRGB, dim, DEG } from '../optics.js';

const RD = 2;
const nEff = (nm, stretch) => N_RED + (nWater(nm) - N_RED) * stretch;
const f1 = (v) => v.toFixed(1) + '°';

export default {
  id: 'drop',
  short: 'One raindrop',
  title: 'One drop bends the light',
  subtitle: 'Sunlight goes in white, bends, bounces off the back and comes out sorted by colour.',
  view: { pos: [-2, -1.3, 14], target: [-2, -1.3, 0] },
  learn: `<p>A rainbow starts with <b>one raindrop</b>. Light slows down in water, so when a ray crosses the surface at a slant it <b>bends</b> toward the surface’s normal (the line at right angles to it). <b>Snell’s law</b> says by how much: <span class="formula">sin i = n · sin r</span>, where <b>n</b> is the water’s refractive index, about 1.33.</p>
    <p>But <b>n is slightly bigger for blue light than for red</b>: about 1.331 for red and 1.344 for violet. So violet bends a little more. That spreading is <b>dispersion</b>. Inside the drop the ray hits the far side, and part of it <b>reflects</b> back. On the way out it bends again, which spreads the colours further.</p>
    <p>The tiny difference is hard to see at true scale. Switch <b>Stretch the colours</b> on to exaggerate it, then drag the <b>aim</b> slider to send the ray in at different heights. Orbit the view: the drop is a sphere, so the same thing happens in every plane through its centre.</p>
    <p class="tip"><b>Try it:</b> set <b>One bounce</b>, aim at about 0.86, and watch the colours leave nearly together. That is the seed of the next chapter.</p>
    <p class="note">The colours are the model’s seven bands from 656 to 400 nm. The refractive index uses a simple two-term fit to measured values for water.</p>`,
  terms: [
    { t: 'Refraction', d: 'The bending of light as it passes from one material into another, because its speed changes.' },
    { t: 'Snell’s law', d: 'sin i = n sin r. It links the angle of the ray in air (i) to the angle in water (r) through the index n.' },
    { t: 'Dispersion', d: 'Different colours bending by different amounts, because the index depends on wavelength.' },
    { t: 'Impact parameter', d: 'How far from the drop’s centre a ray arrives, as a fraction of its radius. 0 is head-on, 1 just grazes the edge.' },
  ],
  defaults: { b: 0.78, k: 1, light: 'all', stretch: 5 },
  controls: [
    { key: 'b', type: 'range', label: 'Aim (height of the ray)', min: 0, max: 0.98, step: 0.005, fmt: (v) => 'i = ' + f1(Math.asin(v) * DEG), hint: '0 is straight at the centre; near 1 skims the edge.' },
    { key: 'k', type: 'seg', label: 'Inside the drop', options: [{ v: 0, label: 'Straight through' }, { v: 1, label: 'One bounce' }, { v: 2, label: 'Two bounces' }] },
    { key: 'light', type: 'seg', label: 'Light', options: [{ v: 'all', label: 'Sunlight' }, { v: 'red', label: 'Red only' }, { v: 'violet', label: 'Violet only' }] },
    { key: 'stretch', type: 'seg', label: 'Stretch the colours', options: [{ v: 1, label: 'True scale' }, { v: 5, label: '×5' }, { v: 10, label: '×10' }] },
  ],
  quiz: [
    { q: 'Which colour bends the most as it enters a raindrop?', options: ['Red', 'Green', 'Violet', 'They all bend the same'], answer: 2, why: 'Water’s index is a little higher for violet (about 1.344) than red (about 1.331), so violet bends more.' },
    { q: 'What does Snell’s law relate?', options: ['The angles on each side of a surface and the index', 'The drop’s size and its speed', 'Wavelength and colour only', 'Brightness and distance'], answer: 0, why: 'sin i = n sin r ties the angle in air to the angle in water through n.' },
    { q: 'Why does white sunlight split into colours in a drop?', options: ['The drop is coloured', 'The index of water depends on colour', 'Red light is absorbed', 'The Sun makes different colours at different angles'], answer: 1, why: 'Dispersion: each colour has its own index, so each takes a slightly different path.' },
  ],
  reel: [
    { ms: 5200, caption: 'A rainbow starts with one raindrop. Sunlight enters, and it bends.', set: { k: 0, light: 'all', stretch: 5 }, anim: { b: [0.2, 0.75] }, view: { pos: [-2, -1.3, 14], target: [-2, -1.3, 0] }, spin: 0 },
    { ms: 5600, caption: 'Violet bends more than red. Inside, it bounces off the back and comes out sorted by colour.', set: { k: 1, light: 'all', stretch: 10 }, anim: { b: [0.7, 0.86] }, spin: 0 },
  ],
  build({ stage }) {
    stage.floor.visible = false;
    const g = new THREE.Group(); stage.root.add(g);
    const drop = makeDrop(RD); g.add(drop);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 16), M.glow(0xffe9a8)); sun.position.set(-10.5, 0, 0); g.add(sun);
    stage.label('Sunlight', [-10.5, 0.95, 0]);
    const ctx = new RayLines(stage, 400, { width: 2.4, opacity: 0.9 });
    const key = new RayLines(stage, 80, { width: 4, opacity: 1 });
    g.add(ctx.obj, key.obj);
    const lblIn = stage.label('', [0, 0, 0], g, 'hot'), lblR = stage.label('Red', [0, 0, 0], g), lblV = stage.label('Violet', [0, 0, 0], g);
    const nrm = new RayLines(stage, 4, { width: 1.6, opacity: 0.7 }); g.add(nrm.obj);
    let sig = '', info = null;
    const redraw = (s) => {
      const bands = s.light === 'all' ? BANDS : s.light === 'red' ? [RED] : [VIOLET];
      const white = [1, 0.97, 0.9];
      ctx.begin();
      for (let j = -4; j <= 4; j++) { const y = j * 0.42; if (Math.abs(y - s.b * RD) < 0.25) continue; const x = -Math.sqrt(RD * RD - y * y); ctx.seg([-9.5, y, 0], [x, y, 0], dim(white, 0.22)); }
      ctx.end();
      key.begin();
      const res = bands.map((B) => ({ B, t: trace(s.b, nEff(B.nm, s.stretch), s.k, 3) }));
      const p0 = res[0].t.pts[1];
      key.seg([-9.5, s.b * RD, 0], [p0[0] * RD, p0[1] * RD, 0], s.light === 'all' ? white : hexRGB(bands[0].hex));
      res.forEach(({ B, t }) => {
        const c = hexRGB(B.hex), P = t.pts.slice(1).map(([x, y]) => [x * RD, y * RD]);
        const last = P.length - 1; P[last] = [t.pts[last][0] * (last === t.pts.length - 1 ? 1 : 1) * RD, t.pts[last][1] * RD];
        key.poly(P, c);
      });
      key.end();
      // normal at the entry point
      nrm.begin(); nrm.seg([p0[0] * RD * 1.0 + p0[0] * 1.1, p0[1] * RD + p0[1] * 1.1, 0], [p0[0] * RD - p0[0] * 1.1, p0[1] * RD - p0[1] * 1.1, 0], [0.7, 0.75, 0.85]); nrm.end();
      lblIn.position.set(p0[0] * RD * 1.0 + p0[0] * 1.5 - 0.3, p0[1] * RD + p0[1] * 1.5 + 0.2, 0);
      const rr = res[0], rv = res[res.length - 1];
      const tipR = rr.t.pts[rr.t.pts.length - 1], tipV = rv.t.pts[rv.t.pts.length - 1];
      lblR.position.set(tipR[0] * RD, tipR[1] * RD, 0); lblV.position.set(tipV[0] * RD, tipV[1] * RD, 0);
      lblR.visible = lblV.visible = s.light === 'all' && s.k > 0 && s.stretch > 1;
      const nR = nEff(RED.nm, s.stretch), nV = nEff(VIOLET.nm, s.stretch);
      info = { i: Math.asin(s.b), rR: Math.asin(s.b / nR), rV: Math.asin(s.b / nV), nR, nV, DR: deviation(s.b, nR, s.k), DV: deviation(s.b, nV, s.k), eR: epsilon(s.b, nR, s.k), eV: epsilon(s.b, nV, s.k) };
      lblIn.element.textContent = `i = ${f1(info.i * DEG)}   r = ${f1(info.rR * DEG)}`;
    };
    return {
      update(dt, s) {
        const sg = [s.b.toFixed(4), s.k, s.light, s.stretch].join();
        if (sg !== sig) { sig = sg; redraw(s); }
      },
      readout(s) {
        if (!info) return '';
        const turn = (r) => { let d = (r * DEG) % 360; return d.toFixed(0) + '°'; };
        const stretched = s.stretch > 1 ? `<p class="r-say">Colours stretched ×${s.stretch}: the real gap between red and violet is ${s.stretch} times smaller.</p>` : '<p class="r-say">True scale: red and violet differ by only a hundredth in index.</p>';
        return `<div class="big">sin i = n · sin r</div>${stretched}
          <div class="row"><span>Red: n ${info.nR.toFixed(3)}</span><b>r = ${f1(info.rR * DEG)}</b></div>
          <div class="row"><span>Violet: n ${info.nV.toFixed(3)}</span><b>r = ${f1(info.rV * DEG)}</b></div>
          <div class="row"><span>Violet bends more by</span><b>${((info.rR - info.rV) * DEG).toFixed(2)}°</b></div>
          <div class="row"><span>${s.k === 0 ? 'Turned by (red)' : 'Angle from straight back (red)'}</span><b>${s.k === 0 ? f1(Math.abs(info.DR * DEG)) : f1(info.eR * DEG)}</b></div>`;
      },
    };
  },
};
