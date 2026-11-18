// Chapter 3: the whole bow. Drops anywhere in the sky that lie 40.5°–42.3° from the antisolar point (the point
// opposite the Sun) send coloured light to you. That makes a cone around the line from the Sun through your head,
// so the bow is a circle. The ground hides the part of the circle that falls below your horizon.
// Scale: R = 20 units to the rain. Rain is hidden under ground; the drawn eye height maps the slider's metres
// onto a rain curtain about 2 km away (rule: a point is visible if it is above the ground plane).
import { THREE, M, RayLines, spec, hexRGB, epsExtreme, nWater, RED, VIOLET, BANDS, DEG, RAD, clamp } from '../optics.js';

const R = 20, RAIN = 2000, NDROP = 7000;
const eye = (h) => Math.max(1.6, R * Math.sin(Math.atan(h / RAIN)));
const E1 = [VIOLET, RED].map((b) => epsExtreme(nWater(b.nm), 1) * DEG);   // violet, red
const E2 = [RED, VIOLET].map((b) => epsExtreme(nWater(b.nm), 2) * DEG);   // red, violet
function basis(sun) { const a = sun * RAD, A = [0, -Math.sin(a), Math.cos(a)]; return { A, S: [0, Math.sin(a), -Math.cos(a)], U: [1, 0, 0], W: [0, Math.cos(a), Math.sin(a)] }; }
function ringPt(bs, e, phi, E) { const ce = Math.cos(e * RAD), se = Math.sin(e * RAD), c = Math.cos(phi), s = Math.sin(phi); return [E[0] + R * (ce * bs.A[0] + se * (c * bs.U[0] + s * bs.W[0])), E[1] + R * (ce * bs.A[1] + se * (c * bs.U[1] + s * bs.W[1])), E[2] + R * (ce * bs.A[2] + se * (c * bs.U[2] + s * bs.W[2]))]; }

export default {
  id: 'bow',
  short: 'The whole bow',
  title: 'The bow is a circle',
  subtitle: 'Every drop 42° from the point opposite the Sun lights up. Together they draw a ring.',
  view: { pos: [36, 19, -36], target: [0, 6, 14] },
  learn: `<p>Each drop sends red light toward you only if you sit at about <b>42° from the antisolar point</b>, the spot directly opposite the Sun. Draw a line from the Sun through your head and on into the sky. All the drops that sit 42° away from that line form a <b>cone</b>, with you at the tip. Its cross-section is a <b>circle</b>. Each drop is a tiny mirror-prism sending its own colours your way, and a different set of drops serves each person.</p>
    <p>The antisolar point is as far <b>below</b> the horizon as the Sun is above it. So the top of the bow stands <b>42° minus the Sun’s height</b> above the horizon. When the Sun climbs above about <b>42°</b>, the whole circle falls below the horizon and you see <b>no bow from the ground</b>. That is why rainbows are early and late in the day, and rarer near midday in the tropics.</p>
    <p>The ground cuts the circle off at your horizon. From a mountain or an aircraft the rain can lie below you, and you can see <b>more of the circle, even all of it</b>. The glowing drops here are the ones that happen to sit on the cone. Slide the <b>viewing height</b> up and the <b>Sun’s elevation</b> down to complete it.</p>
    <p class="tip"><b>Try it:</b> set the Sun to 10° and rise from 2 m up to 3 km. The arc grows into a ring.</p>
    <p class="note">The rain is a curtain about 2 km away in this model. Heights are real metres; the picture is not to scale.</p>`,
  terms: [
    { t: 'Antisolar point', d: 'The point in the sky exactly opposite the Sun. The bow is centred on it, and your shadow’s head points to it.' },
    { t: 'Cone of light', d: 'All the directions 42° from the antisolar axis. Where rain crosses this cone, you see colour.' },
    { t: 'Horizon cut-off', d: 'The ground blocks the part of the circle that dips below your horizon. A higher eye lowers the horizon.' },
  ],
  defaults: { sun: 14, h: 1.6, sec: false },
  controls: [
    { key: 'sun', type: 'range', label: 'Sun’s elevation', min: 0, max: 60, step: 0.5, fmt: (v) => v.toFixed(0) + '°', hint: 'Above about 42° the whole bow is below the horizon.' },
    { key: 'h', type: 'log', label: 'Viewing height', min: 1.6, max: 3000, fmt: (v) => (v < 10 ? v.toFixed(1) : Math.round(v)) + ' m', hint: '1.6 m is standing on the ground; 3000 m is a plane or high peak.' },
    { key: 'sec', type: 'toggle', label: 'Show the secondary bow (51°)' },
  ],
  quiz: [
    { q: 'What shape is a rainbow, really?', options: ['An arc', 'A full circle, partly hidden by the ground', 'A parabola', 'An ellipse'], answer: 1, why: 'The drops 42° from the antisolar point form a cone, so the bow is a circle. Usually the ground hides the lower part.' },
    { q: 'When is no rainbow visible from level ground?', options: ['When the Sun is higher than about 42°', 'When it is windy', 'At noon only in winter', 'When the drops are big'], answer: 0, why: 'The top of the bow is at 42° minus the Sun’s height. Above 42° the whole circle is below the horizon.' },
    { q: 'Where is the antisolar point?', options: ['Straight up', 'At the Sun', 'Opposite the Sun, below the horizon', 'On the horizon, always'], answer: 2, why: 'It is the direction directly opposite the Sun, as far below the horizon as the Sun is above it.' },
  ],
  reel: [
    { ms: 5400, caption: 'Drops 42° from the point opposite the Sun send you red. Together they draw a ring.', set: { h: 1.6, sec: false }, anim: { sun: [30, 10] }, view: { pos: [36, 19, -36], target: [0, 6, 14] }, spin: 0 },
    { ms: 5800, caption: 'On the ground, the horizon hides the rest. Rise high enough and the full circle appears.', set: { sun: 8, sec: false }, anim: { h: [1.6, 2600, true] }, view: { pos: [52, 36, -40], target: [0, 10, 14] }, spin: 0 },
  ],
  build({ stage }) {
    stage.floor.visible = false;
    stage.scene.background = new THREE.Color(0x0a111f);
    const g = new THREE.Group(); stage.root.add(g);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(130, 64), new THREE.MeshStandardMaterial({ color: 0x16251e, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; g.add(ground);
    const grid = new THREE.GridHelper(260, 52, 0x2a3d33, 0x1d2c25); grid.position.y = 0.02; g.add(grid);
    // observer
    const me = new THREE.Group(); g.add(me);
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 6, 12), M.matte(0xd8dce8)); body.position.y = 0.8;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 14), M.matte(0xe8d2bd));
    me.add(body, head);
    const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(3, 28, 18), M.glow(0xffe9a8)); g.add(sunMesh);
    const beams = new RayLines(stage, 40, { width: 1.6, opacity: 0.55 });
    const axis = new RayLines(stage, 4, { width: 2, opacity: 0.8 });
    const rings = new RayLines(stage, 1800, { width: 3.6, opacity: 1 });
    const spokes = new RayLines(stage, 40, { width: 1, opacity: 0.22 });
    g.add(beams.obj, axis.obj, rings.obj, spokes.obj);
    const lblSun = stage.label('Sun', [0, 0, 0], g), lblA = stage.label('Antisolar point', [0, 0, 0], g, 'hot'), lblTop = stage.label('', [0, 0, 0], g);
    // rain
    const rain = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshBasicMaterial({ toneMapped: false }), NDROP);
    rain.frustumCulled = false; g.add(rain);
    const pos = new Float32Array(NDROP * 3);
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < NDROP; i++) { pos[i * 3] = (rnd() - 0.5) * 80; pos[i * 3 + 1] = rnd() * 34 + 0.2; pos[i * 3 + 2] = 4 + rnd() * 46; }
    const mat4 = new THREE.Matrix4(), col = new THREE.Color();
    let sig = '', info = { frac: 0, top: 0 };
    const redraw = (s) => {
      const bs = basis(s.sun), y = eye(s.h), E = [0, y, 0];
      me.position.set(0, y - 1.62, 0); head.position.y = 1.62; body.position.y = 0.85; body.scale.y = 1;
      if (y <= 1.7) me.position.y = 0;
      const sunP = [E[0] + bs.S[0] * 70, E[1] + bs.S[1] * 70, E[2] + bs.S[2] * 70]; sunMesh.position.set(...sunP);
      lblSun.position.set(sunP[0], sunP[1] + 5, sunP[2]);
      beams.begin(); for (let j = -3; j <= 3; j++) { const o = [j * 2.2, (j % 2) * 1.2, 0]; beams.seg([sunP[0] + o[0], sunP[1] + o[1], sunP[2]], [E[0] + o[0] * 0.6, E[1] + o[1] * 0.6 + 0.2, E[2] + o[2] - 1.5], [1, 0.9, 0.55], [1, 0.9, 0.55]); } beams.end();
      const tip = [E[0] + bs.A[0] * R, E[1] + bs.A[1] * R, E[2] + bs.A[2] * R];
      axis.begin(); axis.seg(E, tip, [1, 1, 1]); axis.seg(E, sunP, [1, 0.9, 0.55]); axis.end();
      lblA.position.set(tip[0], tip[1] - 1.2, tip[2]);
      rings.begin(); let vis = 0, tot = 0;
      const ringSet = (e, c) => {
        let prev = ringPt(bs, e, 0, E);
        for (let i = 1; i <= 120; i++) {
          const p = ringPt(bs, e, (i / 120) * Math.PI * 2, E), ok = p[1] >= 0 && prev[1] >= 0;
          rings.seg(prev, p, ok ? c : c.map((v) => v * 0.12));
          if (c === ringSet.ref) { tot++; if (ok) vis++; }
          prev = p;
        }
      };
      ringSet.ref = null;
      const cV = hexRGB(VIOLET.hex), cR = hexRGB(RED.hex);
      BANDS.forEach((B, bi) => { const e = epsExtreme(nWater(B.nm), 1) * DEG, c = hexRGB(B.hex); if (B === RED) ringSet.ref = c; ringSet(e, c); });
      if (s.sec) [RED, VIOLET].forEach((B) => ringSet(epsExtreme(nWater(B.nm), 2) * DEG, hexRGB(B.hex)));
      rings.end();
      void cV; void cR;
      // spokes
      spokes.begin(); for (let i = 0; i < 28; i++) spokes.seg(E, ringPt(bs, (E1[0] + E1[1]) / 2, (i / 28) * Math.PI * 2, E), [0.8, 0.85, 1]); spokes.end();
      info = { frac: tot ? vis / tot : 0, top: E1[1] - s.sun };
      lblTop.position.set(...ringPt(bs, E1[1], Math.PI / 2, E)); lblTop.element.textContent = info.top > 0 ? `top of bow ${info.top.toFixed(0)}° up` : '';
      lblTop.visible = info.top > 0 && info.frac > 0;
      // rain
      let lit = 0;
      for (let i = 0; i < NDROP; i++) {
        const px = pos[i * 3], py = pos[i * 3 + 1], pz = pos[i * 3 + 2];
        const dx = px - E[0], dy = py - E[1], dz = pz - E[2], d = Math.hypot(dx, dy, dz);
        const e = Math.acos((dx * bs.A[0] + dy * bs.A[1] + dz * bs.A[2]) / d) * DEG;
        let c = null, sc = 0.1;
        if (e >= E1[0] && e <= E1[1]) { c = spec((E1[1] - e) / (E1[1] - E1[0])); sc = 0.34; lit++; }
        else if (s.sec && e >= E2[0] && e <= E2[1]) { c = spec((e - E2[0]) / (E2[1] - E2[0])); sc = 0.3; lit++; }
        if (c) col.setRGB(c[0], c[1], c[2]); else col.setRGB(0.1, 0.14, 0.24);
        mat4.makeScale(sc, sc, sc).setPosition(px, py, pz);
        rain.setMatrixAt(i, mat4); rain.setColorAt(i, col);
      }
      rain.instanceMatrix.needsUpdate = true; rain.instanceColor.needsUpdate = true;
    };
    return {
      update(dt, s) {
        const sg = [s.sun.toFixed(2), s.h.toFixed(2), s.sec].join();
        if (sg !== sig) { sig = sg; redraw(s); }
      },
      readout(s) {
        const top = E1[1] - s.sun, f = info.frac;
        let msg, big;
        if (s.sun >= E1[1]) { big = 'No bow'; msg = 'The Sun is above about 42°, so the whole circle is below your horizon. Rise higher, or wait for the Sun to sink.'; }
        else if (f <= 0.001) { big = 'No bow visible'; msg = 'The circle is there, but the ground hides all of it. Get higher or lower the Sun.'; }
        else if (f > 0.995) { big = 'A full circle'; msg = 'Rain lies below you and the ground is out of the way, so the whole ring shows. Pilots see this.'; }
        else { big = `${Math.round(f * 100)}% of the circle`; msg = 'The ground hides the rest.'; }
        return `<div class="big">${big}</div><p class="r-say">${msg}</p>
          <div class="row"><span>Top of the bow</span><b>${top > 0 ? top.toFixed(1) + '° above the horizon' : 'below the horizon'}</b></div>
          <div class="row"><span>Antisolar point</span><b>${s.sun.toFixed(0)}° below the horizon</b></div>`;
      },
    };
  },
};
