// Chapter 5: what drop size changes. Rain makes bright coloured bows with faint extra bands; smaller drops spread
// each colour's band wider (Airy: width grows as radius^(-2/3)) until colours overlap into a broad white fogbow.
// A moonbow is the same bow made by moonlight: too dim for colour vision, so it looks nearly white to the eye.
// Caveat: the Airy model is an approximation that gets less accurate for drops under about 0.05 mm, where the
// full wave (Mie) calculation also shifts the bow inward a few degrees. This chapter uses the Airy picture throughout.
import { THREE, plane, canvasTexture, paintSky, skyToPlane, RED, VIOLET, nWater, bowI, bowWeight, airyWidth, epsExtreme, N_RED, N_VIOLET, DEG, FONT } from '../optics.js';

const PW = 9.6, PH = 5.4, SPAN = 114, GW = 9.6, GH = 3.4;
const COLS = [{ nm: 656, c: '#ff5c4d' }, { nm: 530, c: '#3ddc6a' }, { nm: 400, c: '#c04cff' }];

function drawProfile(g, w, h, o) {
  g.fillStyle = '#0d0f16'; g.fillRect(0, 0, w, h);
  const L = 70, R = w - 24, T = 30, B = h - 62, e0 = 34, e1 = 58, X = (e) => L + ((e - e0) / (e1 - e0)) * (R - L), Y = (v) => B - Math.min(1.15, v) / 1.15 * (B - T);
  g.strokeStyle = 'rgba(255,255,255,.09)'; g.fillStyle = '#8a91a6'; g.font = '19px Geist, system-ui, sans-serif'; g.textAlign = 'center';
  for (let e = 36; e <= 58; e += 4) { g.beginPath(); g.moveTo(X(e), T); g.lineTo(X(e), B); g.stroke(); g.fillText(e + '°', X(e), B + 24); }
  g.fillStyle = '#c4c9d8'; g.font = FONT; g.fillText('Angle from the antisolar point', (L + R) / 2, h - 12);
  g.save(); g.translate(22, (T + B) / 2); g.rotate(-Math.PI / 2); g.fillText('Brightness of each colour', 0, 0); g.restore();
  const w2 = bowWeight(2) / bowWeight(1);
  COLS.forEach(({ nm, c }) => {
    g.strokeStyle = c; g.lineWidth = 3; g.beginPath();
    for (let i = 0; i <= 480; i++) { const e = e0 + (i / 480) * (e1 - e0), v = bowI(nm, o.a, 1, e) + w2 * bowI(nm, o.a, 2, e); i ? g.lineTo(X(e), Y(v)) : g.moveTo(X(e), Y(v)); }
    g.stroke();
  });
  g.fillStyle = '#c4c9d8'; g.font = '500 20px Geist, system-ui, sans-serif'; g.textAlign = 'left';
  g.fillText('red · green · violet', L + 8, T + 22);
}

export default {
  id: 'fog',
  short: 'Fog, moon, drop size',
  title: 'Small drops, strange bows',
  subtitle: 'Shrink the drops and the bow turns pale and wide. Swap the Sun for the Moon and it loses its colour.',
  view: { pos: [0.2, 0.2, 13.5], target: [0.2, -0.4, 0] },
  learn: `<p>Light is a wave, and a drop’s bow is where waves from nearby rays add up. The width of that bright band depends on the drop: the <b>smaller the drop, the wider each colour’s band</b>. For raindrops about a millimetre across, the bands are narrow and the colours stay <b>separate and vivid</b>. Just inside the main bow, the waves interfere into faint repeating bands called <b>supernumerary bows</b>, first explained by Thomas Young in 1804.</p>
    <p>Make the drops smaller and each colour’s band widens until they all overlap. The bow turns pale and broad. That is the <b>fogbow</b>, made of cloud and fog droplets only tens of micrometres across. It is nearly white, with a faint red edge outside and blue inside.</p>
    <p>A <b>moonbow</b> is an ordinary bow made by moonlight. Moonlight is hundreds of thousands of times fainter than sunlight, too dim for the colour-sensing cones in your eye, so it looks <b>nearly white</b>. A long camera exposure brings the colours back.</p>
    <p class="tip"><b>Try it:</b> press <b>Fog</b>, then <b>Rain</b>, and watch the graph. Then switch the light to the Moon.</p>
    <p class="note">The wave maths here is Airy’s approximation. For drops below about 0.05 mm, a full calculation (Mie scattering) is needed, and it also moves the bow a few degrees inward. This model does not.</p>`,
  terms: [
    { t: 'Fogbow', d: 'A wide, pale, nearly white bow made by tiny fog or cloud droplets.' },
    { t: 'Moonbow', d: 'A rainbow made by moonlight. It looks white because dim light does not trigger colour vision.' },
    { t: 'Supernumerary bow', d: 'A faint extra band just inside the main bow, caused by interference between rays.' },
    { t: 'Diffraction', d: 'Light spreading as a wave. It sets how narrow a bow’s bright band can be.' },
  ],
  defaults: { a: 0.5, moon: 'sun' },
  controls: [
    { key: 'a', type: 'log', label: 'Drop radius', min: 0.004, max: 1.5, fmt: (v) => (v < 0.1 ? (v * 1000).toFixed(0) + ' µm' : v.toFixed(2) + ' mm') },
    { key: 'sizes', type: 'buttons', label: 'Presets', items: [{ label: 'Fog', act: (s) => { s.a = 0.01; } }, { label: 'Drizzle', act: (s) => { s.a = 0.1; } }, { label: 'Rain', act: (s) => { s.a = 0.5; } }] },
    { key: 'moon', type: 'seg', label: 'Light source', options: [{ v: 'sun', label: 'Sun' }, { v: 'moon', label: 'Full moon' }] },
  ],
  quiz: [
    { q: 'What happens to the bow as the drops get much smaller?', options: ['It gets brighter and sharper', 'Colour bands widen and overlap into a pale fogbow', 'It disappears at once', 'It moves to 90°'], answer: 1, why: 'Smaller drops spread each colour’s band wider, so they overlap and mix to white.' },
    { q: 'Why does a moonbow usually look white?', options: ['Moonlight has no colours', 'Dim light does not trigger our colour vision', 'The drops are smaller', 'The Moon is behind the drops'], answer: 1, why: 'The colours are there, but in dim light our cone cells give no colour signal. A long exposure photo shows them.' },
    { q: 'What causes supernumerary bows?', options: ['A second Sun', 'Interference between light waves', 'Wind', 'Reflection off the ground'], answer: 1, why: 'Rays that leave at the same angle from different parts of the drop interfere, giving faint repeating bands.' },
  ],
  reel: [
    { ms: 5800, caption: 'Raindrops make a sharp, coloured bow. Fog droplets are far smaller.', set: { moon: 'sun' }, anim: { a: [0.5, 0.01, true] }, spin: 0 },
  ],
  build({ stage }) {
    stage.floor.visible = false;
    const g = new THREE.Group(); stage.root.add(g);
    const sky = canvasTexture(768, 432, (c, w, h, o) => o && paintSky(c, w, h, o));
    const sp = plane(PW, PH, sky.tex); sp.position.set(0, 1.9, 0); g.add(sp);
    const gr = canvasTexture(1024, 363, (c, w, h, o) => o && drawProfile(c, w, h, o));
    const gp = plane(GW, GH, gr.tex); gp.position.set(0, -2.7, 0); g.add(gp);
    stage.label('The sky, seen from the ground', [0, 1.9 + PH / 2 + 0.35, 0]);
    const lbl = stage.label('', [0, 0, 0], g, 'hot');
    const [lx, ly] = skyToPlane(PW, PH, SPAN, 0, 42, 90); lbl.position.set(lx, 1.9 + ly + 0.35, 0.05);
    let sig = '', dirty = true;
    document.fonts?.ready.then(() => { dirty = true; });
    return {
      update(dt, s) {
        const sg = [s.a.toFixed(4), s.moon].join();
        if (sg === sig && !dirty) return; sig = sg; dirty = false;
        sky.redraw({ aMm: s.a, sun: 4, moon: s.moon === 'moon', pol: null, span: SPAN });
        gr.redraw({ a: s.a });
        lbl.element.textContent = s.a < 0.04 ? 'Fogbow' : s.moon === 'moon' ? 'Moonbow' : 'Rainbow';
      },
      readout(s) {
        const wd = airyWidth(530, s.a, 1), spread = (epsExtreme(N_RED, 1) - epsExtreme(N_VIOLET, 1)) * DEG;
        const verdict = wd * 2.2 < spread * 0.6 ? 'Colours stay separate and vivid.' : wd * 2.2 < spread * 1.5 ? 'Colour bands are starting to blur.' : 'Colours overlap into a broad, pale bow.';
        return `<div class="big">${s.a < 0.1 ? (s.a * 2000).toFixed(0) + ' µm' : (s.a * 2).toFixed(2) + ' mm'} across</div>
          <p class="r-say">${verdict}${s.moon === 'moon' ? ' In moonlight your eye sees it nearly white.' : ''}</p>
          <div class="row"><span>Width of one colour’s band</span><b>${wd.toFixed(2)}°</b></div>
          <div class="row"><span>Red to violet spread</span><b>${spread.toFixed(1)}°</b></div>`;
      },
    };
  },
};
