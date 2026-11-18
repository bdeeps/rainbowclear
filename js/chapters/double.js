// Chapter 4: the second bow. Two bounces make a fainter bow near 51° with the colours reversed, and between the
// bows is Alexander's dark band. Light of both bows is strongly polarised along the arc, because the internal
// reflection happens close to Brewster's angle (Fresnel numbers are computed live in optics.js).
// The sky picture uses Airy's 1838 wave theory, so a little inside the main bow you can also see faint extra
// "supernumerary" bands whose spacing depends on drop size.
import { THREE, RayLines, makeDrop, plane, canvasTexture, paintSky, skyToPlane, RED, VIOLET, nWater, N_RED, N_VIOLET, trace, bExtreme, epsExtreme, arcPolarisation, hexRGB, dim, DEG, RAD, FONT } from '../optics.js';

const RD = 1.5, DX = -5.2, PW = 8.4, PH = 4.725, SPAN = 114;
const f1 = (v) => v.toFixed(1);

export default {
  id: 'double',
  short: 'Double rainbow',
  title: 'The second bow and the dark band',
  subtitle: 'Two bounces make a fainter bow outside the first, with the colours upside down.',
  view: { pos: [-0.8, 0.6, 12.5], target: [-0.8, 0.2, 0] },
  learn: `<p>Some rays bounce <b>twice</b> inside a drop before they leave. Those rays pile up at about <b>51°</b> (red 50.4°, violet 53.7°) from the antisolar point. That makes the <b>secondary bow</b>, outside the main one. Because the second reflection flips the ray over, the colours come out <b>reversed</b>: violet on the outside, red on the inside. It is fainter too, because each reflection loses light.</p>
    <p>Between the two bows the sky is darker. Ancient writers noticed this. It is called <b>Alexander’s dark band</b>, after Alexander of Aphrodisias, who described it around 200 CE. Neither bow sends light into that gap: the main bow’s light ends at 42° and the secondary’s starts at 51°.</p>
    <p>The light is also <b>polarised</b>. Inside the drop the ray meets the back surface close to <b>Brewster’s angle</b>, where one polarisation barely reflects. What is left vibrates <b>along the arc</b>. Turn the filter and the bow fades where the arc runs the wrong way, like polarising sunglasses on a rainbow.</p>
    <p class="tip"><b>Try it:</b> switch the polarising filter on and turn it. Then change the drop size and look just inside the main bow for faint extra bands.</p>`,
  terms: [
    { t: 'Secondary bow', d: 'The fainter second bow, from rays that reflect twice. It sits near 51° with the colours reversed.' },
    { t: 'Alexander’s dark band', d: 'The darker sky between the primary and secondary bows.' },
    { t: 'Polarisation', d: 'The direction a light wave vibrates. Rainbow light vibrates mostly along the arc.' },
    { t: 'Supernumerary bows', d: 'Faint extra bands just inside the main bow, from light waves interfering. Smaller drops spread them wider.' },
  ],
  defaults: { sun: 6, a: 0.5, polOn: false, pol: 0 },
  controls: [
    { key: 'sun', type: 'range', label: 'Sun’s elevation', min: 0, max: 30, step: 0.5, fmt: (v) => v.toFixed(0) + '°' },
    { key: 'a', type: 'log', label: 'Drop radius', min: 0.1, max: 1.5, fmt: (v) => v.toFixed(2) + ' mm', hint: 'Smaller drops spread the faint bands wider.' },
    { key: 'polOn', type: 'toggle', label: 'Polarising filter' },
    { key: 'pol', type: 'range', label: 'Filter angle', min: 0, max: 180, step: 1, fmt: (v) => v.toFixed(0) + '°', hint: '0° passes horizontal vibration, 90° passes vertical.' },
  ],
  quiz: [
    { q: 'How does the order of colours in the second bow compare with the first?', options: ['The same', 'Reversed, with red on the inside', 'Only green shows', 'It has no violet'], answer: 1, why: 'The extra reflection flips the ray, so violet is on the outside and red on the inside.' },
    { q: 'What is Alexander’s dark band?', options: ['A shadow of a cloud', 'Darker sky between the two bows', 'A third bow', 'The edge of the rain'], answer: 1, why: 'No rays leave the drop at angles between about 42° and 51°, so that gap is dim.' },
    { q: 'How is the light in a rainbow polarised?', options: ['Not at all', 'Along the arc, strongly', 'Straight up and down everywhere', 'Across the Sun’s direction only'], answer: 1, why: 'The back reflection is near Brewster’s angle, which suppresses one polarisation and leaves light vibrating along the arc.' },
  ],
  reel: [
    { ms: 5600, caption: 'Two bounces make a fainter second bow. Its colours run the other way.', set: { sun: 6, a: 0.5, polOn: false }, spin: 0 },
    { ms: 5600, caption: 'Rainbow light is polarised along the arc. A filter turns the bow on and off.', set: { sun: 6, a: 0.5, polOn: true }, anim: { pol: [0, 90] }, spin: 0 },
  ],
  build({ stage }) {
    stage.floor.visible = false;
    const g = new THREE.Group(); stage.root.add(g);
    const drop = makeDrop(RD); drop.position.x = DX; g.add(drop);
    const rays = new RayLines(stage, 200, { width: 3.4, opacity: 1 }), ctx = new RayLines(stage, 40, { width: 1.2, opacity: 0.35 });
    g.add(ctx.obj, rays.obj);
    stage.label('Sunlight →', [DX - 3.3, 2.4, 0]);
    const P = (b, n, k, len) => trace(b, n, k, len).pts.map(([x, y]) => [x * RD + DX, y * RD, 0]);
    const cRed = hexRGB(RED.hex), cVio = hexRGB(VIOLET.hex);
    ctx.begin(); for (let j = -4; j <= 4; j++) { const y = j * 0.4; ctx.seg([DX - 3.6, y, 0], [DX - Math.sqrt(RD * RD - y * y), y, 0], [1, 0.95, 0.8]); } ctx.end();
    rays.begin();
    [[1, 1], [2, -1]].forEach(([k, sg]) => [[N_RED, cRed], [N_VIOLET, cVio]].forEach(([n, c]) => rays.poly(P(sg * bExtreme(n, k), n, k, 1.5), c)));
    rays.end();
    stage.label(`Main bow: ${f1(epsExtreme(N_RED, 1) * DEG)}° (red) to ${f1(epsExtreme(N_VIOLET, 1) * DEG)}°`, [DX - 1.1, -2.7, 0], g, 'hot');
    stage.label(`Secondary: ${f1(epsExtreme(N_RED, 2) * DEG)}° (red) to ${f1(epsExtreme(N_VIOLET, 2) * DEG)}°`, [DX - 1.1, 3.2, 0], g);
    const cx = 3.3, cy = -0.3;
    const sky = canvasTexture(768, 432, (c, w, h, o) => o && paintSky(c, w, h, o));
    const sp = plane(PW, PH, sky.tex); sp.position.set(cx, cy, 0); g.add(sp);
    const L = (txt, e, phi, cls) => { const [x, y] = skyToPlane(PW, PH, SPAN, 0, e, phi); return stage.label(txt, [cx + x, cy + y, 0.05], g, cls); };
    const lP = L('Main bow', 42.3, 52, 'hot'), lS = L('Secondary bow', 51, 128, 'hot'), lA = L('Alexander’s dark band', 46.8, 28, ''), lN = L('Faint extra bands', 38.6, 108, '');
    const lAnti = L('antisolar point', 0, 0, '');
    stage.label('The sky, seen from the ground', [cx, cy + PH / 2 + 0.35, 0]);
    // polariser glyph
    const pc = canvasTexture(128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(30,40,60,.8)'; c.beginPath(); c.arc(64, 64, 60, 0, 7); c.fill(); c.strokeStyle = '#eef0f6'; c.lineWidth = 4; c.stroke(); c.beginPath(); c.moveTo(18, 64); c.lineTo(110, 64); c.moveTo(18, 64); c.lineTo(32, 54); c.moveTo(18, 64); c.lineTo(32, 74); c.moveTo(110, 64); c.lineTo(96, 54); c.moveTo(110, 64); c.lineTo(96, 74); c.stroke(); });
    const filt = new THREE.Mesh(new THREE.CircleGeometry(0.8, 40), new THREE.MeshBasicMaterial({ map: pc.tex, transparent: true, toneMapped: false })); filt.position.set(cx - PW / 2 + 1.1, cy - PH / 2 + 0.9, 0.08); g.add(filt);
    let sig = '', dirty = true;
    document.fonts?.ready.then(() => { dirty = true; });
    return {
      update(dt, s) {
        const sg = [s.sun.toFixed(1), s.a.toFixed(3), s.polOn, s.pol.toFixed(0)].join();
        if (sg === sig && !dirty) return; sig = sg; dirty = false;
        sky.redraw({ aMm: s.a, sun: s.sun, moon: false, pol: s.polOn ? s.pol : null, span: SPAN });
        filt.visible = s.polOn; filt.rotation.z = s.pol * RAD;
        const hide = (l, e, phi) => { const hz = (s.sun) ; const [x, y] = skyToPlane(PW, PH, SPAN, 0, e, phi); l.position.set(cx + x, cy + y, 0.05); l.visible = y > (hz * PW / SPAN) - PH * 0.4 + PH * 0.4 - (0.4 * PH); };
        void hide;
        const horizonY = -PH * 0.4 + (s.sun / SPAN) * PW; // plane y of the horizon
        [[lP, 42.3, 52], [lS, 51, 128], [lA, 46.8, 28], [lN, 38.6, 108]].forEach(([l, e, phi]) => { const [x, y] = skyToPlane(PW, PH, SPAN, 0, e, phi); l.position.set(cx + x, cy + y, 0.05); l.visible = cy + y - 0.15 > cy + horizonY; });
        lAnti.visible = false;
      },
      readout(s) {
        const p1 = arcPolarisation(N_RED, 1), p2 = arcPolarisation(N_RED, 2);
        return `<div class="big">Fainter, flipped, polarised</div>
          <p class="r-say">At the back surface, light vibrating along the arc reflects ${(p1.Rs / p1.Rp).toFixed(0)} times better than the other kind (main bow).</p>
          <div class="row"><span>Polarised along the arc: main</span><b>${Math.round(p1.P * 100)}%</b></div>
          <div class="row"><span>Polarised along the arc: secondary</span><b>${Math.round(p2.P * 100)}%</b></div>
          <p class="r-say">From the internal reflections alone; passing through the surface shifts these a little.</p>`;
      },
    };
  },
};
