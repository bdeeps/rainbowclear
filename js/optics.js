// Shared optics for RainbowClear: refraction in a water drop, the minimum-deviation angle, the
// Airy rainbow integral, Fresnel reflection, coloured ray lines and a painted "photo of the sky".
//
// Physics used (all standard geometric optics, Descartes 1637 and Airy 1838):
//  - Snell's law:  sin i = n sin r
//  - A ray that enters a sphere, reflects k times inside and leaves is turned through
//        D = k*180° + 2i − 2(k+1)r
//  - D is at an extreme where cos²i = (n² − 1) / (k(k+2)); rays near that impact parameter leave
//    almost parallel, so the light piles up there. That is the rainbow.
//  - Near the extreme the wave picture gives an intensity Ai²(x) (Airy) whose width scales as
//    (λ/a)^(2/3) for a drop of radius a. That makes the faint supernumerary bows and the
//    broad white fogbow of tiny droplets.
// Water's refractive index n(λ) = 1.3235 + 0.003287/λ² (λ in µm) is a two-term fit through
// about 1.331 at 656 nm and 1.344 at 400 nm. It is a model, good to a few parts in 10⁴.
import { THREE, M, clamp, lerp, smooth, canvasTexture } from './kit.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';

export { THREE, M, clamp, lerp, smooth, canvasTexture };
export const RAD = Math.PI / 180, DEG = 180 / Math.PI;
export const V = (x, y, z) => new THREE.Vector3(x, y, z);

export const nWater = (nm) => 1.3235 + 0.003287 / ((nm / 1000) ** 2);
export const BANDS = [
  { name: 'Red', nm: 656, hex: 0xff3b30 },
  { name: 'Orange', nm: 610, hex: 0xff9a1f },
  { name: 'Yellow', nm: 580, hex: 0xffe627 },
  { name: 'Green', nm: 530, hex: 0x3ddc6a },
  { name: 'Blue', nm: 470, hex: 0x3d8bff },
  { name: 'Indigo', nm: 435, hex: 0x6a55ff },
  { name: 'Violet', nm: 400, hex: 0xc04cff },
];
export const RED = BANDS[0], VIOLET = BANDS[6];
export const N_RED = nWater(RED.nm), N_VIOLET = nWater(VIOLET.nm);
export const hexRGB = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
// t: 0 red → 1 violet
export function spec(t) {
  const x = clamp(t, 0, 1) * (BANDS.length - 1), i = Math.min(BANDS.length - 2, Math.floor(x)), f = x - i;
  const a = hexRGB(BANDS[i].hex), b = hexRGB(BANDS[i + 1].hex);
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), lerp(a[2], b[2], f)];
}

// ---------------------------------------------------------------- ray physics
// b = impact parameter as a fraction of the drop's radius (= sin i). k = internal reflections.
export const incidence = (b) => Math.asin(b);
export const refraction = (b, n) => Math.asin(b / n);
export const deviation = (b, n, k) => k * Math.PI + 2 * Math.asin(b) - 2 * (k + 1) * Math.asin(b / n);
// Angle from the antisolar point (the direction straight back toward where the Sun is not), radians.
export function epsilon(b, n, k) {
  let D = deviation(b, n, k) % (2 * Math.PI); if (D < 0) D += 2 * Math.PI;
  return Math.abs(D - Math.PI);
}
export const bExtreme = (n, k) => Math.sqrt(1 - (n * n - 1) / (k * (k + 2)));
export const epsExtreme = (n, k) => epsilon(bExtreme(n, k), n, k);
// How sharply ε(b) turns at its extreme (radians per unit b², magnitude).
export function curvature(n, k) {
  const b0 = bExtreme(n, k), h = 2e-3;
  return Math.abs((epsilon(b0 + h, n, k) - 2 * epsilon(b0, n, k) + epsilon(b0 - h, n, k)) / (h * h));
}

// Real 2D ray path through a unit-radius drop, in the plane of the ray. The ray travels along +x
// at height b. Returns the polyline in drop units plus the exit direction.
export function trace(b, n, k, exitLen = 5, inLen = 2.6) {
  const refract = (d, N, eta) => { // N points back toward where the ray came from
    const c = -(d[0] * N[0] + d[1] * N[1]), s2 = eta * eta * (1 - c * c);
    if (s2 >= 1) return null;
    const f = eta * c - Math.sqrt(1 - s2);
    return [eta * d[0] + f * N[0], eta * d[1] + f * N[1]];
  };
  let P = [-Math.sqrt(Math.max(0, 1 - b * b)), b], d = [1, 0];
  const pts = [[-inLen, b], P.slice()];
  d = refract(d, P, 1 / n);
  for (let j = 0; j < k; j++) {
    const dp = d[0] * P[0] + d[1] * P[1];
    P = [P[0] - 2 * dp * d[0], P[1] - 2 * dp * d[1]];
    pts.push(P.slice());
    const dn = d[0] * P[0] + d[1] * P[1];
    d = [d[0] - 2 * dn * P[0], d[1] - 2 * dn * P[1]];
  }
  const dp = d[0] * P[0] + d[1] * P[1];
  P = [P[0] - 2 * dp * d[0], P[1] - 2 * dp * d[1]];
  pts.push(P.slice());
  const out = refract(d, [-P[0], -P[1]], n) || d;
  pts.push([P[0] + out[0] * exitLen, P[1] + out[1] * exitLen]);
  return { pts, dir: out, exit: P };
}

// Fresnel power reflectance for light inside the water meeting the surface at angle ri (radians).
// s = polarised perpendicular to the plane of incidence, p = in that plane.
export function fresnelInside(ri, n) {
  const ci = Math.cos(ri), st = n * Math.sin(ri);
  if (st >= 1) return { Rs: 1, Rp: 1 };
  const ct = Math.sqrt(1 - st * st);
  const rs = (n * ci - ct) / (n * ci + ct), rp = (ci - n * ct) / (ci + n * ct);
  return { Rs: rs * rs, Rp: rp * rp };
}
// Share of the arc's light polarised along the arc, from the internal reflections alone.
export function arcPolarisation(n, k) {
  const r = refraction(bExtreme(n, k), n), { Rs, Rp } = fresnelInside(r, n);
  const s = Rs ** k, p = Rp ** k;
  return { P: (s - p) / (s + p), Rs, Rp, r };
}

// ---------------------------------------------------------------- Airy function
const C1 = 0.355028053887817, C2 = 0.258819403792807;
export function airy(x) {
  if (x > 5) return Math.exp((-2 / 3) * x ** 1.5) / (2 * Math.sqrt(Math.PI) * x ** 0.25);
  if (x < -9) { const z = -x; return Math.sin((2 / 3) * z ** 1.5 + Math.PI / 4) / (Math.sqrt(Math.PI) * z ** 0.25); }
  let f = 1, g = x, tf = 1, tg = x; const x3 = x * x * x;
  for (let k = 1; k < 70; k++) { tf *= x3 / ((3 * k - 1) * 3 * k); tg *= x3 / (3 * k * (3 * k + 1)); f += tf; g += tg; }
  return C1 * f - C2 * g;
}
// Width of the Airy pattern in degrees for wavelength nm and drop radius aMm (millimetres).
export function airyWidth(nm, aMm, k) {
  const n = nWater(nm), K = (2 * Math.PI) / (nm * 1e-6), a = aMm; // both in mm
  return Math.cbrt(curvature(n, k) / (2 * K * K * a * a)) * DEG;
}
// Relative brightness of the k-th bow's peak (reflection losses and focusing, rough).
export function bowWeight(k) {
  const n = nWater(550), r = refraction(bExtreme(n, k), n), { Rs, Rp } = fresnelInside(r, n);
  return (0.5 * (Rs ** k + Rp ** k)) * curvature(n, k) ** (-2 / 3);
}

// ---------------------------------------------------------------- spectrum → colour
function wl2rgb(nm) {
  let r = 0, g = 0, b = 0;
  if (nm < 440) { r = (440 - nm) / 60; b = 1; } else if (nm < 490) { g = (nm - 440) / 50; b = 1; }
  else if (nm < 510) { g = 1; b = (510 - nm) / 20; } else if (nm < 580) { r = (nm - 510) / 70; g = 1; }
  else if (nm < 645) { r = 1; g = (645 - nm) / 65; } else { r = 1; }
  const f = nm < 420 ? 0.45 + 0.55 * (nm - 380) / 40 : 1;
  return [r * f, g * f, b * f];
}
const LAMBDAS = Array.from({ length: 31 }, (_, i) => 400 + i * 10);
const WHITE = LAMBDAS.reduce((a, l) => { const c = wl2rgb(l); return [a[0] + c[0], a[1] + c[1], a[2] + c[2]]; }, [0, 0, 0]);
const E0 = 24, E1 = 66, ESTEP = 0.05, NE = Math.round((E1 - E0) / ESTEP) + 1;

// Sky response against angle from the antisolar point, for drops of radius aMm: bow colours (r,g,b)
// and a smooth "how bright is the glow here" curve for the unpainted sky. Cached.
const lutCache = new Map();
export function skyLUT(aMm) {
  const key = aMm.toFixed(4);
  if (lutCache.has(key)) return lutCache.get(key);
  const rgb = new Float32Array(NE * 3), base = new Float32Array(NE), wk = [0, bowWeight(1), bowWeight(2)];
  const norm = wk[1];
  const par = LAMBDAS.map((nm) => [1, 2].map((k) => { const n = nWater(nm); return { e0: epsExtreme(n, k) * DEG, w: airyWidth(nm, aMm, k), k }; }));
  const edge1 = par[LAMBDAS.length - 1][0].e0 /* red end at 700nm */, edge2 = par[LAMBDAS.length - 1][1].e0;
  const soft = Math.max(0.35, par[15][0].w);
  const sig = (x) => 1 / (1 + Math.exp(-x));
  for (let i = 0; i < NE; i++) {
    const e = E0 + i * ESTEP; let R = 0, G = 0, B = 0;
    for (let li = 0; li < LAMBDAS.length; li++) {
      const c = wl2rgb(LAMBDAS[li]);
      for (let q = 0; q < 2; q++) {
        const p = par[li][q], x = q === 0 ? (e - p.e0) / p.w : (p.e0 - e) / p.w;
        const I = airy(x) ** 2 / 0.287 * (wk[p.k] / norm);
        R += c[0] * I; G += c[1] * I; B += c[2] * I;
      }
    }
    rgb[i * 3] = R / WHITE[0]; rgb[i * 3 + 1] = G / WHITE[1]; rgb[i * 3 + 2] = B / WHITE[2];
    // glow: bright inside the first bow, dark Alexander band between the bows, bright again outside the second
    base[i] = 0.5 - 0.27 * sig((e - edge1) / soft) + 0.22 * sig((e - edge2) / soft);
  }
  const out = { rgb, base, sig: par.map((p) => p.map((x) => x.w)) };
  lutCache.set(key, out);
  return out;
}

// ---------------------------------------------------------------- 3D helpers
// Many coloured line segments in one draw call. begin() / seg() / end().
export class RayLines {
  constructor(stage, cap, { width = 3, opacity = 1 } = {}) {
    this.cap = cap; this.n = 0;
    this.pos = new Float32Array(cap * 6); this.col = new Float32Array(cap * 6);
    this.geo = new LineSegmentsGeometry();
    this.geo.setPositions(new Float32Array(cap * 6).fill(0.0001));
    this.geo.setColors(new Float32Array(cap * 6));
    this.mat = stage.lineMaterial({ vertexColors: true, linewidth: width, transparent: true, opacity, worldUnits: false, depthWrite: false });
    this.obj = new LineSegments2(this.geo, this.mat);
    this.obj.frustumCulled = false;
    this.obj.renderOrder = 2;
  }
  begin() { this.n = 0; return this; }
  seg(a, b, c1, c2 = c1) {
    if (this.n >= this.cap) return;
    const o = this.n++ * 6, P = this.pos, C = this.col;
    P[o] = a[0]; P[o + 1] = a[1]; P[o + 2] = a[2] ?? 0; P[o + 3] = b[0]; P[o + 4] = b[1]; P[o + 5] = b[2] ?? 0;
    C[o] = c1[0]; C[o + 1] = c1[1]; C[o + 2] = c1[2]; C[o + 3] = c2[0]; C[o + 4] = c2[1]; C[o + 5] = c2[2];
  }
  poly(pts, c, z = 0) { for (let i = 0; i < pts.length - 1; i++) this.seg([pts[i][0], pts[i][1], z], [pts[i + 1][0], pts[i + 1][1], z], c); }
  end() {
    const a = this.geo.attributes.instanceStart.data, c = this.geo.attributes.instanceColorStart.data;
    a.array.set(this.pos); a.needsUpdate = true; c.array.set(this.col); c.needsUpdate = true;
    this.geo.instanceCount = this.n;
  }
}
export const dim = (c, f) => [c[0] * f, c[1] * f, c[2] * f];

// A glass-like water drop of radius R, with a ring marking the plane the rays travel in.
export function makeDrop(R = 2, { ring = true } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(R, 64, 48), new THREE.MeshPhysicalMaterial({ color: 0xbfe3ff, transparent: true, opacity: 0.13, roughness: 0.04, metalness: 0, clearcoat: 1, depthWrite: false, envMapIntensity: 1.4 }));
  g.add(body);
  if (ring) {
    const pts = []; for (let i = 0; i <= 120; i++) { const a = (i / 120) * Math.PI * 2; pts.push(V(Math.cos(a) * R, Math.sin(a) * R, 0)); }
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xbcd4f5, transparent: true, opacity: 0.7 }));
    g.add(line);
  }
  return g;
}

export function plane(w, h, tex) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.DoubleSide }));
  return m;
}

export const FONT = '500 22px Geist, system-ui, sans-serif';
export const fmtDeg = (r, d = 1) => (r * DEG).toFixed(d) + '°';

// ---------------------------------------------------------------- the sky picture
// A flat map of the sky around the antisolar point. o: { aMm, sun (° elevation), moon, pol (° or null), span (° across) }
export function paintSky(g, w, h, o) {
  const lut = skyLUT(o.aMm), img = g.createImageData(w, h), d = img.data;
  const dpp = o.span / w, cx = w / 2, cy = h * 0.9, horizon = cy - (o.sun || 0) / dpp;
  const Pk = [0, arcPolarisation(nWater(550), 1).P, arcPolarisation(nWater(550), 2).P];
  const night = o.moon ? 1 : 0, sunLight = night ? 0.2 : 1;
  const bowGain = night ? 0.12 : 1, sat = night ? 0.12 : 1;
  const polOn = o.pol !== null && o.pol !== undefined, theta = (o.pol || 0) * RAD;
  const e0 = 24, step = 0.05;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const o4 = (y * w + x) * 4;
      if (y >= horizon) { const f = 1 - (y - horizon) / (h - horizon + 1) * 0.5; d[o4] = 20 * f * (night ? 0.4 : 1); d[o4 + 1] = 34 * f * (night ? 0.4 : 1); d[o4 + 2] = 28 * f * (night ? 0.5 : 1); d[o4 + 3] = 255; continue; }
      const dx = (x - cx) * dpp, dy = (cy - y) * dpp, e = Math.hypot(dx, dy);
      const sky = 0.55 + 0.45 * (y / Math.max(1, horizon)); // a little lighter near the horizon
      let li = Math.round((e - e0) / step); li = Math.max(0, Math.min(NE - 1, li));
      const baseV = (e < e0 ? 0.5 : lut.base[li]) * sunLight;
      let R = (46 + 30 * sky) * baseV * 1.9, G = (58 + 34 * sky) * baseV * 1.9, B = (80 + 40 * sky) * baseV * 1.9;
      if (e >= e0 && e <= E1) {
        let m = 1;
        if (polOn) { // light along the arc is polarised along the arc; the filter's axis is `theta`
          const tang = Math.atan2(dy, dx) + Math.PI / 2, P = e < 46 ? Pk[1] : Pk[2];
          m = 1 + P * Math.cos(2 * (theta - tang));
        }
        let r = lut.rgb[li * 3] * m, gg = lut.rgb[li * 3 + 1] * m, bb = lut.rgb[li * 3 + 2] * m;
        const lum = (r + gg + bb) / 3; r = lum + (r - lum) * sat; gg = lum + (gg - lum) * sat; bb = lum + (bb - lum) * sat;
        const gain = 2.6 * bowGain;
        R += 255 * (1 - Math.exp(-r * gain)); G += 255 * (1 - Math.exp(-gg * gain)); B += 255 * (1 - Math.exp(-bb * gain));
      }
      d[o4] = Math.min(255, R); d[o4 + 1] = Math.min(255, G); d[o4 + 2] = Math.min(255, B); d[o4 + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
}

// Pixel → plane helpers for labels on a w×h-unit plane showing paintSky output.
export function skyToPlane(planeW, planeH, span, sun, eDeg, phiDeg) {
  const dpp = span / 768, W = 768, H = Math.round(768 * planeH / planeW), cx = W / 2, cy = H * 0.9;
  void dpp; void sun;
  const px = cx + (eDeg * Math.cos(phiDeg * RAD)) / (span / W), py = cy - (eDeg * Math.sin(phiDeg * RAD)) / (span / W);
  return [(px / W - 0.5) * planeW, (0.5 - py / H) * planeH];
}

// Airy intensity of one colour's k-th bow at angle e (degrees from the antisolar point), peak ≈ 1.
export function bowI(nm, aMm, k, e) {
  const n = nWater(nm), e0 = epsExtreme(n, k) * DEG, w = airyWidth(nm, aMm, k);
  return airy(k === 1 ? (e - e0) / w : (e0 - e) / w) ** 2 / 0.287;
}
