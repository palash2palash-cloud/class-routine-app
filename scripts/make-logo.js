/* লোগো তৈরির স্ক্রিপ্ট (শুধু ডেভেলপমেন্টের সময় চালানো হয়, অ্যাপের অংশ নয়)।
   Palash-এর দেওয়া লোগো মেপে আঁকা: ৫১২×৫১২ ক্যানভাসে আকার 103..409, কোণের ব্যাসার্ধ 66,
   সাদা দাগ 28 চওড়া। মূল ছবিতে দাগ 214..242; Palash-এর অনুরোধে দুটো দাগই সমান অনুপাতে
   SHIFT পরিমাণ বামে/উপরে সরানো হয়েছে।
   ব্যবহার: node scripts/make-logo.js [shift]  (shift না দিলে 14) */
const fs = require('fs');
const path = require('path');

const COLORS = { tl: '#FFBE5D', tr: '#FF9160', bl: '#59D1C9', br: '#70A8FF' };
const A = 103, B = 409, R = 66, GAP = 28, ORIG_G0 = 214;

function mark(shift) {
  const g0 = ORIG_G0 - shift, g1 = g0 + GAP;
  const tl = `M${A} ${A + R}A${R} ${R} 0 0 1 ${A + R} ${A}H${g0}V${g0}H${A}Z`;
  const tr = `M${g1} ${A}H${B - R}A${R} ${R} 0 0 1 ${B} ${A + R}V${g0}H${g1}Z`;
  const bl = `M${A} ${g1}H${g0}V${B}H${A + R}A${R} ${R} 0 0 1 ${A} ${B - R}Z`;
  const br = `M${g1} ${g1}H${B}V${B - R}A${R} ${R} 0 0 1 ${B - R} ${B}H${g1}Z`;
  // টিক চিহ্ন: মূল নীল ঘরের (242..409) ভেতরের অবস্থান ঠিক রেখে নতুন ঘরে বসানো
  const s = (B - g1) / (B - 242);
  const m = function (v) { return +(g1 + (v - 242) * s).toFixed(1); };
  const pts = [[287.5, 317.5], [314.5, 345], [366, 293]].map(function (p) { return m(p[0]) + ' ' + m(p[1]); });
  const sw = +(21 * s).toFixed(1);
  return `<path d="${tl}" fill="${COLORS.tl}"/><path d="${tr}" fill="${COLORS.tr}"/>` +
    `<path d="${bl}" fill="${COLORS.bl}"/><path d="${br}" fill="${COLORS.br}"/>` +
    `<path d="M${pts[0]}L${pts[1]}L${pts[2]}" fill="none" stroke="#FFFFFF" stroke-width="${sw}" stroke-linecap="butt" stroke-linejoin="miter"/>`;
}

// মার্কটা নির্দিষ্ট আকারে, নির্দিষ্ট পটভূমিতে বসানো SVG
function svg(shift, opts) {
  opts = opts || {};
  const size = 512;
  const frac = opts.frac || (B - A) / size; // মার্ক ক্যানভাসের কত অংশ জুড়বে
  const k = frac * size / (B - A);
  const c = (A + B) / 2;
  let bg = '';
  if (opts.bg === 'square') bg = `<rect width="512" height="512" fill="#FFFFFF"/>`;
  if (opts.bg === 'rounded') bg = `<rect width="512" height="512" rx="112" fill="#FFFFFF"/>`;
  if (opts.bg === 'circle') bg = `<circle cx="256" cy="256" r="256" fill="#FFFFFF"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}` +
    `<g transform="translate(256 256) scale(${k.toFixed(4)}) translate(${-c} ${-c})">${mark(shift)}</g></svg>`;
}

module.exports = { svg: svg, mark: mark };

if (require.main === module) {
  const shift = process.argv[2] !== undefined ? +process.argv[2] : 14;
  const out = path.join(__dirname, '..', 'resources', 'logo');
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'logo-original-check.svg'), svg(0, { bg: 'square' }));
  fs.writeFileSync(path.join(out, 'logo.svg'), svg(shift, { bg: 'square' }));
  fs.writeFileSync(path.join(__dirname, '..', 'www', 'img', 'logo.svg'), svg(shift, { frac: 0.92 }));
  console.log('ok');
}

// নোটিফিকেশনের ছোট আইকন (সাদা ছায়ামূর্তি, টিক চিহ্নটা ফাঁকা) — Android vector drawable
function statIcon(shift) {
  const g0 = ORIG_G0 - shift, g1 = g0 + GAP;
  const k = 22 / (B - A);
  const f = function (v) { return +(1 + (v - A) * k).toFixed(2); };
  const a = f(A), b = f(B), r = +(R * k).toFixed(2), x0 = f(g0), x1 = f(g1);
  const s = (B - g1) / (B - 242);
  const m = function (v) { return g1 + (v - 242) * s; };
  const P = [[287.5, 317.5], [314.5, 345], [366, 293]].map(function (p) { return [m(p[0]), m(p[1])]; });
  const h = 21 * s / 2;
  function unit(dx, dy) { const l = Math.hypot(dx, dy); return [dx / l, dy / l]; }
  const d0 = unit(P[1][0] - P[0][0], P[1][1] - P[0][1]);
  const d1 = unit(P[2][0] - P[1][0], P[2][1] - P[1][1]);
  const n0 = [-d0[1] * h, d0[0] * h], n1 = [-d1[1] * h, d1[0] * h];
  // ৯০° কোণের মোড়ে miter বিন্দু
  const bis = unit(n0[0] + n1[0], n0[1] + n1[1]);
  const ml = h / Math.cos(Math.PI / 4);
  const mi = [bis[0] * ml, bis[1] * ml];
  const poly = [
    [P[0][0] + n0[0], P[0][1] + n0[1]], [P[1][0] + mi[0], P[1][1] + mi[1]], [P[2][0] + n1[0], P[2][1] + n1[1]],
    [P[2][0] - n1[0], P[2][1] - n1[1]], [P[1][0] - mi[0], P[1][1] - mi[1]], [P[0][0] - n0[0], P[0][1] - n0[1]]
  ].map(function (p) { return f(p[0]) + ',' + f(p[1]); });
  const tl = `M${a},${a + r}A${r},${r} 0,0 1,${a + r},${a}H${x0}V${x0}H${a}Z`;
  const tr = `M${x1},${a}H${+(b - r).toFixed(2)}A${r},${r} 0,0 1,${b},${+(a + r).toFixed(2)}V${x0}H${x1}Z`;
  const bl = `M${a},${x1}H${x0}V${b}H${+(a + r).toFixed(2)}A${r},${r} 0,0 1,${a},${+(b - r).toFixed(2)}Z`;
  const br = `M${x1},${x1}H${b}V${+(b - r).toFixed(2)}A${r},${r} 0,0 1,${+(b - r).toFixed(2)},${b}H${x1}Z` +
    `M${poly[0]}L${poly.slice(1).join('L')}Z`;
  return '<?xml version="1.0" encoding="utf-8"?>\n' +
    '<!-- Notification small icon: the app logo as a white silhouette (Android tints it) -->\n' +
    '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n' +
    '    android:width="24dp"\n    android:height="24dp"\n    android:viewportWidth="24"\n    android:viewportHeight="24">\n' +
    `    <path android:fillColor="#FFFFFFFF" android:pathData="${tl}${tr}${bl}"/>\n` +
    `    <path android:fillColor="#FFFFFFFF" android:fillType="evenOdd" android:pathData="${br}"/>\n` +
    '</vector>\n';
}
module.exports.statIcon = statIcon;
if (require.main === module) {
  const shift = process.argv[2] !== undefined ? +process.argv[2] : 14;
  fs.writeFileSync(path.join(__dirname, '..', 'resources', 'android', 'res', 'drawable', 'ic_stat_class.xml'), statIcon(shift));
}
