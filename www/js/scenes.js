/* ছুটির দিনের চলন্ত দৃশ্য। সবকিছু SVG আর CSS অ্যানিমেশনে আঁকা, কোনো ছবি ফাইল লাগে না, ইন্টারনেট ছাড়াই চলে।
   দৃশ্য: sea (সমুদ্রতীর), hill (পাহাড়), river (গ্রামের নদী), tea (চা বাগান), night (জ্যোৎস্না রাত), sunset (সূর্যাস্ত)।
   কোন দিনে কোনটা, সেটা সেটিংসে বদলানো যায়। একই পাতায় কয়েকটা দৃশ্য থাকলেও (সেটিংসের নমুনা)
   যাতে গ্রেডিয়েন্টের id না মেলে, তাই প্রতিটা দৃশ্যের id আলাদা উপসর্গ (prefix) দিয়ে বানানো হয়। */
(function () {
  'use strict';

  const LIST = ['sea', 'hill', 'river', 'tea', 'night', 'sunset'];
  let seq = 0;

  function wave(y, amp, len, width) {
    let d = 'M0 ' + y;
    for (let x = 0; x < width; x += len) {
      d += ' Q' + (x + len / 4) + ' ' + (y - amp) + ' ' + (x + len / 2) + ' ' + y;
      d += ' T' + (x + len) + ' ' + y;
    }
    return d + ' V260 H0 Z';
  }

  function cloud(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<ellipse cx="0" cy="0" rx="22" ry="9"/><ellipse cx="-12" cy="-4" rx="11" ry="9"/><ellipse cx="6" cy="-8" rx="13" ry="11"/><ellipse cx="18" cy="-2" rx="10" ry="7"/></g>';
  }

  function clouds(list) {
    return '<g class="sc-clouds">' + list.map(function (c, i) {
      return '<g class="sc-cloud c' + (i + 1) + '">' + cloud(c[0], c[1], c[2]) + '</g>';
    }).join('') + '</g>';
  }

  // উড়ন্ত পাখির ঝাঁক: পুরো আকাশ পার হয়ে চলে যায়, ডানা ঝাপটায়
  function flock(y, cls, s) {
    const one = function (x, yy, k, d) {
      return '<g transform="translate(' + x + ' ' + yy + ') scale(' + k + ')"><path class="sc-bird" style="animation-delay:' + d + 's" d="M-9 0 q4.5 -6 9 0 q4.5 -6 9 0"/></g>';
    };
    return '<g transform="translate(0 ' + y + ') scale(' + s + ')"><g class="sc-flock ' + cls + '">' +
      one(0, 0, 1, 0) + one(-20, 9, .85, -.25) + one(-36, -4, .75, -.4) + one(-50, 12, .7, -.15) + one(-16, -10, .7, -.5) + '</g></g>';
  }

  function sun(P, cx, cy, r, rays) {
    let ray = '';
    if (rays) {
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        ray += '<line x1="' + (Math.cos(a) * (r + 7)).toFixed(1) + '" y1="' + (Math.sin(a) * (r + 7)).toFixed(1) + '" x2="' + (Math.cos(a) * (r + 15)).toFixed(1) + '" y2="' + (Math.sin(a) * (r + 15)).toFixed(1) + '"/>';
      }
    }
    return '<g transform="translate(' + cx + ' ' + cy + ')">' +
      '<circle class="sc-sunglow" r="' + (r * 2.3) + '" fill="url(#' + P + 'Glow)"/>' +
      (rays ? '<g class="sc-rays">' + ray + '</g>' : '') +
      '<circle r="' + r + '" fill="url(#' + P + 'Sun)"/></g>';
  }

  function sunDefs(P, mid, edge, glow) {
    return '<radialGradient id="' + P + 'Sun"><stop offset="0" stop-color="#FFFBE6"/><stop offset=".6" stop-color="' + mid + '"/><stop offset="1" stop-color="' + edge + '"/></radialGradient>' +
      '<radialGradient id="' + P + 'Glow"><stop offset="0" stop-color="' + glow + '" stop-opacity=".9"/><stop offset="1" stop-color="' + glow + '" stop-opacity="0"/></radialGradient>';
  }

  function grad(id, stops) {
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' + stops.map(function (s) {
      return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"/>';
    }).join('') + '</linearGradient>';
  }

  function svg(kind, defs, body) {
    return '<svg class="scene scene-' + kind + '" viewBox="0 0 360 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>' + defs + '</defs>' + body + '</svg>';
  }

  // সৈকতের ছাতা: চার রঙের ভাগ, খুঁটি, পাশে শোবার চেয়ার (কোনো মানুষ নেই)
  function umbrella(x, y, s, c1, c2, delay) {
    const top = -40, rim = -24, w = 22;
    const pts = [-w, -w / 2, 0, w / 2, w];
    let canopy = '';
    for (let i = 0; i < 4; i++) {
      const a = pts[i], b = pts[i + 1];
      canopy += '<path d="M0 ' + top + ' L' + a + ' ' + rim + ' Q' + ((a + b) / 2) + ' ' + (rim + 4) + ' ' + b + ' ' + rim + ' Z" fill="' + (i % 2 ? c2 : c1) + '"/>';
    }
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<ellipse cx="6" cy="1" rx="24" ry="3.5" fill="rgba(120,80,30,.18)"/>' +
      '<path d="M8 -2 l18 0 l5 -7" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M10 -2 v3 M24 -2 v3" stroke="#B9A07A" stroke-width="1.6"/>' +
      '<g class="sc-umb" style="animation-delay:' + delay + 's">' +
      '<line x1="0" y1="0" x2="0" y2="' + (top + 2) + '" stroke="#8B5E34" stroke-width="2"/>' +
      canopy + '<circle cx="0" cy="' + top + '" r="1.8" fill="#8B5E34"/></g></g>';
  }

  function sailboat(x, y, s, hull, sail, cls) {
    return '<g class="' + cls + '"><g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="sc-bob">' +
      '<path d="M-14 0 L14 0 L10 6 L-10 6 Z" fill="' + hull + '"/>' +
      '<line x1="0" y1="0" x2="0" y2="-26" stroke="' + hull + '" stroke-width="1.4"/>' +
      '<path d="M1 -25 L1 -2 L15 -2 Z" fill="' + sail + '"/><path d="M-1 -20 L-1 -2 L-11 -2 Z" fill="' + sail + '" opacity=".85"/></g></g></g>';
  }

  /* ---------------- সমুদ্রতীর ---------------- */
  function seaScene(P) {
    const colors = [['#EF4444', '#FFFFFF'], ['#F59E0B', '#FFFFFF'], ['#3B82F6', '#FFFFFF'], ['#10B981', '#FDE68A'], ['#EC4899', '#FFFFFF'], ['#8B5CF6', '#FDE68A']];
    // তীর বরাবর এক সারিতে, সমান দূরত্বে, সমান মাপে
    const umbs = colors.map(function (c, i) { return umbrella(34 + i * 58, 230, .8, c[0], c[1], -i * .5); }).join('');
    const glints = [0, 1, 2, 3, 4, 5].map(function (i) {
      return '<ellipse class="sc-glint" cx="' + (300 + (i % 2 ? 6 : -5)) + '" cy="' + (124 + i * 8) + '" rx="' + (14 - i) + '" ry="1.4" style="animation-delay:' + (i * .35) + 's"/>';
    }).join('');
    const defs = grad(P + 'Sky', [[0, '#3FA9F5'], [.6, '#9ADCFB'], [1, '#FFE6B0']]) +
      grad(P + 'Sea', [[0, '#1FA2DE'], [1, '#0A69A2']]) +
      grad(P + 'Sand', [[0, '#FCE7BD'], [1, '#EFC27C']]) +
      sunDefs(P, '#FFE066', '#FDB833', '#FFF3B0');
    return svg('sea', defs,
      '<rect width="360" height="250" fill="url(#' + P + 'Sky)"/>' +
      sun(P, 306, 52, 19, true) +
      clouds([[60, 40, 1.1], [190, 24, .8], [-40, 68, .7]]) +
      flock(66, 'f1', 1) + flock(40, 'f2', .7) +
      '<rect y="112" width="360" height="104" fill="url(#' + P + 'Sea)"/>' +
      '<rect y="111" width="360" height="2" fill="#FFFFFF" opacity=".4"/>' +
      sailboat(0, 116, .7, '#0F3D5E', '#FFFFFF', 'sc-sail') +
      glints +
      '<g class="sc-wave w1"><path d="' + wave(130, 2.5, 30, 760) + '" fill="#1E9AD6" opacity=".55"/></g>' +
      '<g class="sc-wave w2"><path d="' + wave(148, 3.5, 44, 760) + '" fill="#168BC6" opacity=".6"/></g>' +
      '<g class="sc-wave w3"><path d="' + wave(166, 4.5, 60, 760) + '" fill="#2BB3E8" opacity=".7"/></g>' +
      // তীরে আছড়ে পড়া ঢেউ ও ফেনা
      '<path class="sc-wet" d="M0 196 C70 188 140 202 220 194 S320 186 360 192 V210 H0 Z" fill="#E2B877" opacity=".55"/>' +
      '<g class="sc-surf"><path d="M0 190 C60 180 130 196 210 186 S320 178 360 186 V198 C320 190 260 200 200 196 S70 192 0 200 Z" fill="#7DD3F5"/>' +
      '<path d="M0 197 C70 189 140 203 220 195 S320 187 360 193" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" opacity=".95"/>' +
      '<path d="M20 193 q6 -3 12 0 M90 195 q6 -3 12 0 M170 197 q6 -3 12 0 M250 191 q6 -3 12 0 M320 189 q6 -3 12 0" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/></g>' +
      '<path d="M0 200 C80 192 150 206 230 198 S330 190 360 196 V250 H0 Z" fill="url(#' + P + 'Sand)"/>' +
      '<path d="M0 240 C90 234 200 246 360 236" fill="none" stroke="#E7B86E" stroke-width="1.2" opacity=".6"/>' +
      umbs +
      // বালুতে তারামাছ আর ঝিনুক
      '<path d="M300 236 l2 -5 l2 5 l5 0 l-4 3 l2 5 l-5 -3 l-5 3 l2 -5 l-4 -3 z" fill="#FB923C"/>' +
      '<path d="M60 241 q4 -7 8 0 z" fill="#FDE2E4" stroke="#E8A0A8" stroke-width=".6"/>' +
      '<g class="sc-wind"><path d="M0 92 q20 -6 40 0 t40 0"/><path d="M0 102 q16 -5 32 0 t32 0"/></g>');
  }

  function pine(x, y, s, c) {
    return '<g class="sc-pine" transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<rect x="-1.5" y="-4" width="3" height="8" fill="#5B3A1E"/>' +
      '<path d="M0 -34 L-9 -18 L-5 -18 L-12 -6 L-7 -6 L-14 4 L14 4 L7 -6 L12 -6 L5 -18 L9 -18 Z" fill="' + c + '"/></g>';
  }

  /* ---------------- পাহাড় ---------------- */
  function hillScene(P) {
    const pines = [[30, 214, 1, '#1F5E3B'], [48, 220, .8, '#246B44'], [70, 212, .9, '#1F5E3B'], [300, 212, 1, '#1F5E3B'],
      [322, 218, .85, '#246B44'], [342, 210, .95, '#1F5E3B'], [262, 220, .7, '#2A7A4E']]
      .map(function (p) { return pine(p[0], p[1], p[2], p[3]); }).join('');
    const defs = grad(P + 'Sky', [[0, '#7FB8F5'], [.5, '#C9C2F4'], [1, '#FFD9B0']]) +
      grad(P + 'Lake', [[0, '#8FB7E8'], [1, '#3F6FB0']]) +
      grad(P + 'M1', [[0, '#9DA8E6'], [1, '#B9B7EC']]) +
      grad(P + 'M2', [[0, '#6A74C9'], [1, '#8A8FD6']]) +
      grad(P + 'M3', [[0, '#4E9A6E'], [1, '#2F7652']]) +
      sunDefs(P, '#FFD27A', '#FFAA4C', '#FFE7B8');
    return svg('hill', defs,
      '<rect width="360" height="250" fill="url(#' + P + 'Sky)"/>' +
      '<g class="sc-sunrise">' + sun(P, 232, 112, 22, false) + '</g>' +
      clouds([[70, 40, 1], [240, 30, .75]]) +
      flock(62, 'f1', .9) +
      '<path d="M0 150 L40 110 L70 128 L112 82 L150 120 L188 96 L226 128 L268 90 L310 122 L360 100 V200 H0 Z" fill="url(#' + P + 'M1)" opacity=".9"/>' +
      '<path d="M-10 186 L60 112 L96 140 L150 72 L204 136 L240 108 L300 160 L330 132 L370 160 V210 H-10 Z" fill="url(#' + P + 'M2)"/>' +
      '<path d="M150 72 L136 90 L144 88 L150 96 L156 87 L166 92 Z" fill="#FFFFFF"/>' +
      '<path d="M60 112 L50 123 L57 121 L62 127 L67 120 L72 124 Z" fill="#FFFFFF" opacity=".95"/>' +
      '<path d="M240 108 L232 117 L238 116 L242 121 L247 115 L251 118 Z" fill="#FFFFFF" opacity=".9"/>' +
      '<g class="sc-mist m1"><ellipse cx="80" cy="166" rx="90" ry="8" fill="#FFFFFF" opacity=".45"/></g>' +
      '<path d="M-10 214 C40 176 90 170 140 196 C180 176 230 168 280 186 C320 172 350 178 370 186 V250 H-10 Z" fill="url(#' + P + 'M3)"/>' +
      '<g class="sc-mist m2"><ellipse cx="260" cy="190" rx="110" ry="7" fill="#FFFFFF" opacity=".35"/></g>' +
      '<path d="M90 222 C140 212 220 212 280 222 C250 236 140 238 90 222 Z" fill="url(#' + P + 'Lake)"/>' +
      '<g class="sc-ripple"><path d="M120 222 h24 M170 226 h30 M220 221 h22 M150 230 h20" stroke="#E0F2FE" stroke-width="1.4" stroke-linecap="round"/></g>' +
      '<path d="M-10 236 C60 226 120 244 190 238 S320 226 370 236 V250 H-10 Z" fill="#256B47"/>' +
      pines);
  }

  /* ---------------- গ্রামের নদী ---------------- */
  function hut(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<rect x="-12" y="-14" width="24" height="14" fill="#D9A066"/>' +
      '<rect x="-3" y="-9" width="6" height="9" fill="#7A4A22"/>' +
      '<path d="M-17 -13 L0 -27 L17 -13 Z" fill="#B7791F"/><path d="M-17 -13 L0 -27 L17 -13" fill="none" stroke="#8A5A14" stroke-width="1.2"/></g>';
  }

  function tree(x, y, s, c) {
    return '<g class="sc-tree" transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<rect x="-1.6" y="-12" width="3.2" height="12" fill="#6B4423"/>' +
      '<circle cx="0" cy="-18" r="9" fill="' + c + '"/><circle cx="-7" cy="-13" r="6" fill="' + c + '"/><circle cx="7" cy="-13" r="6" fill="' + c + '"/></g>';
  }

  // বাংলার পালতোলা নৌকা: বাঁকা খোল, ছই, চৌকো পাল
  function country(x, y, s) {
    return '<g class="sc-boat"><g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><g class="sc-bob">' +
      '<path d="M-26 -2 Q0 10 26 -2 Q22 6 0 7 Q-22 6 -26 -2 Z" fill="#5B3A1E"/>' +
      '<path d="M-10 -2 Q-2 -12 8 -2 Z" fill="#C08A3E"/>' +
      '<line x1="12" y1="-1" x2="12" y2="-38" stroke="#5B3A1E" stroke-width="1.4"/>' +
      '<path d="M13 -36 L29 -30 L27 -6 L13 -8 Z" fill="#F4E2C1" stroke="#C9A877" stroke-width=".8"/>' +
      '<path d="M15 -27 L27 -23 M14 -17 L27 -15" stroke="#D9BE90" stroke-width=".8"/></g></g></g>';
  }

  function riverScene(P) {
    const defs = grad(P + 'Sky', [[0, '#5AB8F0'], [.65, '#BDE7FB'], [1, '#FFF1C9']]) +
      grad(P + 'Riv', [[0, '#7CC7EC'], [1, '#2F8FC4']]) +
      grad(P + 'Fld', [[0, '#7BC96F'], [1, '#3E9B4F']]) +
      sunDefs(P, '#FFE066', '#FDB833', '#FFF3B0');
    const trees = [[24, 118, .9, '#2F7D45'], [44, 120, .75, '#3B8F52'], [118, 116, .85, '#2F7D45'], [212, 118, .8, '#3B8F52'],
      [300, 117, .9, '#2F7D45'], [326, 120, .7, '#3B8F52']].map(function (t) { return tree(t[0], t[1], t[2], t[3]); }).join('');
    return svg('river', defs,
      '<rect width="360" height="250" fill="url(#' + P + 'Sky)"/>' +
      sun(P, 70, 48, 18, true) +
      clouds([[160, 34, .9], [280, 52, .75], [-30, 70, .6]]) +
      flock(58, 'f1', .85) +
      // দূরের গাছের সারি আর ঘর
      '<path d="M0 120 C60 112 120 118 180 114 S300 110 360 118 V130 H0 Z" fill="#5FA868"/>' +
      trees + hut(76, 122, .8) + hut(258, 121, .7) +
      // সরষে ক্ষেত আর সবুজ মাঠ
      '<path d="M0 126 C80 120 160 130 240 124 S330 120 360 126 V146 H0 Z" fill="#F6D04D"/>' +
      '<path d="M0 140 C90 134 200 144 360 136 V160 H0 Z" fill="url(#' + P + 'Fld)"/>' +
      // নদী
      '<path d="M0 156 C90 148 260 150 360 156 V216 C260 210 100 214 0 220 Z" fill="url(#' + P + 'Riv)"/>' +
      '<g class="sc-ripple"><path d="M30 170 h26 M110 182 h34 M200 168 h24 M260 190 h30 M70 200 h22 M310 176 h20" stroke="#E0F2FE" stroke-width="1.4" stroke-linecap="round"/></g>' +
      '<g class="sc-ripple r2"><path d="M60 178 h16 M160 196 h22 M236 180 h18 M330 202 h14" stroke="#FFFFFF" stroke-width="1.1" stroke-linecap="round" opacity=".8"/></g>' +
      country(0, 186, .9) +
      // কাছের ঘাসের পাড়
      '<path d="M0 214 C80 206 180 222 360 210 V250 H0 Z" fill="#4CA65A"/>' +
      '<g class="sc-grass"><path d="M14 226 l3 -10 l3 10 M40 236 l2 -8 l3 8 M300 230 l3 -10 l3 10 M330 238 l2 -8 l3 8 M200 240 l2 -8 l3 8" stroke="#2E7D3F" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>' +
      '<g class="sc-wind"><path d="M0 92 q20 -6 40 0 t40 0"/></g>');
  }

  /* ---------------- চা বাগান ---------------- */
  function shadeTree(x, y, s) {
    return '<g class="sc-tree" transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M0 0 L0 -40 M0 -26 L-8 -34 M0 -30 L7 -37" stroke="#5B3A1E" stroke-width="1.6" fill="none"/>' +
      '<ellipse cx="0" cy="-42" rx="18" ry="5" fill="#2F7D45"/><ellipse cx="-6" cy="-35" rx="9" ry="3.5" fill="#3B8F52"/></g>';
  }

  function teaRows(y0, n, gap, amp, color) {
    let d = '';
    for (let i = 0; i < n; i++) {
      const y = y0 + i * gap;
      d += 'M-10 ' + y + ' C80 ' + (y - amp) + ' 160 ' + (y + amp) + ' 240 ' + y + ' S330 ' + (y - amp) + ' 370 ' + y + ' ';
    }
    return '<path d="' + d + '" fill="none" stroke="' + color + '" stroke-width="5" stroke-linecap="round"/>';
  }

  function teaScene(P) {
    const defs = grad(P + 'Sky', [[0, '#8FD3F4'], [.7, '#DDF3E4'], [1, '#F6F9D9']]) +
      grad(P + 'H1', [[0, '#8FCB7A'], [1, '#6DB062']]) +
      grad(P + 'H2', [[0, '#5DAE5A'], [1, '#3F8F45']]) +
      grad(P + 'H3', [[0, '#3E9A4C'], [1, '#2B7A3A']]) +
      sunDefs(P, '#FFE38A', '#FFC24A', '#FFF6C4');
    return svg('tea', defs,
      '<rect width="360" height="250" fill="url(#' + P + 'Sky)"/>' +
      sun(P, 286, 56, 17, true) +
      clouds([[70, 34, .9], [200, 26, .7]]) +
      flock(64, 'f1', .8) +
      // পেছনের টিলা
      '<path d="M-10 128 C40 96 100 92 150 112 C200 88 270 86 370 116 V170 H-10 Z" fill="url(#' + P + 'H1)"/>' +
      '<g clip-path="url(#' + P + 'C1)">' + teaRows(108, 6, 9, 4, '#5FA857') + '</g>' +
      '<clipPath id="' + P + 'C1"><path d="M-10 128 C40 96 100 92 150 112 C200 88 270 86 370 116 V170 H-10 Z"/></clipPath>' +
      '<g class="sc-mist m1"><ellipse cx="120" cy="132" rx="120" ry="8" fill="#FFFFFF" opacity=".55"/></g>' +
      // মাঝের টিলা
      '<path d="M-10 170 C60 140 140 136 210 156 C260 140 320 138 370 150 V210 H-10 Z" fill="url(#' + P + 'H2)"/>' +
      '<g clip-path="url(#' + P + 'C2)">' + teaRows(150, 7, 9, 5, '#2F8040') + '</g>' +
      '<clipPath id="' + P + 'C2"><path d="M-10 170 C60 140 140 136 210 156 C260 140 320 138 370 150 V210 H-10 Z"/></clipPath>' +
      shadeTree(60, 160, .9) + shadeTree(170, 150, .8) + shadeTree(290, 152, .85) +
      '<g class="sc-mist m2"><ellipse cx="250" cy="176" rx="130" ry="7" fill="#FFFFFF" opacity=".45"/></g>' +
      // সামনের টিলা
      '<path d="M-10 214 C70 186 170 184 240 200 C290 190 340 190 370 196 V250 H-10 Z" fill="url(#' + P + 'H3)"/>' +
      '<g clip-path="url(#' + P + 'C3)">' + teaRows(196, 7, 9, 6, '#226B33') + '</g>' +
      '<clipPath id="' + P + 'C3"><path d="M-10 214 C70 186 170 184 240 200 C290 190 340 190 370 196 V250 H-10 Z"/></clipPath>' +
      // পাহাড়ি আঁকাবাঁকা পথ
      '<path d="M170 250 C176 232 196 222 214 212 C226 206 236 202 244 200" fill="none" stroke="#D8B784" stroke-width="5" stroke-linecap="round"/>' +
      shadeTree(110, 214, 1.05) + shadeTree(320, 208, 1));
  }

  /* ---------------- জ্যোৎস্না রাত ---------------- */
  function nightScene(P) {
    const stars = [[20, 20, 1.2], [52, 46, .9], [84, 18, 1.4], [120, 60, .8], [150, 28, 1.1], [182, 12, .9], [210, 54, 1.3],
      [246, 22, .8], [270, 70, 1], [26, 82, .8], [96, 92, 1], [330, 18, 1.1], [344, 64, .9], [300, 40, .7], [168, 86, .8], [62, 120, .7]]
      .map(function (s, i) {
        return '<circle class="sc-star" cx="' + s[0] + '" cy="' + s[1] + '" r="' + s[2] + '" style="animation-delay:' + (-(i * .37) % 3).toFixed(2) + 's"/>';
      }).join('');
    const flies = [[60, 222], [120, 230], [200, 218], [262, 232], [320, 224], [160, 240]].map(function (f, i) {
      return '<circle class="sc-fly" cx="' + f[0] + '" cy="' + f[1] + '" r="1.6" style="animation-delay:' + (-i * .9) + 's"/>';
    }).join('');
    const defs = grad(P + 'Sky', [[0, '#0B1230'], [.6, '#1E2A5A'], [1, '#3B3F7A']]) +
      grad(P + 'Lake', [[0, '#253A70'], [1, '#121C3E']]) +
      '<radialGradient id="' + P + 'Moon"><stop offset="0" stop-color="#FFFDF2"/><stop offset="1" stop-color="#F3E7B8"/></radialGradient>' +
      '<radialGradient id="' + P + 'Halo"><stop offset="0" stop-color="#FFF6D0" stop-opacity=".55"/><stop offset="1" stop-color="#FFF6D0" stop-opacity="0"/></radialGradient>';
    return svg('night', defs,
      '<rect width="360" height="250" fill="url(#' + P + 'Sky)"/>' +
      stars +
      '<path class="sc-shoot" d="M0 0 L46 16" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>' +
      '<g transform="translate(278 62)"><circle class="sc-sunglow" r="46" fill="url(#' + P + 'Halo)"/>' +
      '<circle r="20" fill="url(#' + P + 'Moon)"/><circle cx="-6" cy="-5" r="3.4" fill="#E9DCA6" opacity=".6"/><circle cx="6" cy="6" r="2.4" fill="#E9DCA6" opacity=".55"/><circle cx="8" cy="-8" r="1.6" fill="#E9DCA6" opacity=".5"/></g>' +
      '<g class="sc-clouds night"><g class="sc-cloud c1">' + cloud(80, 70, .9) + '</g><g class="sc-cloud c2">' + cloud(220, 104, .7) + '</g></g>' +
      // পাহাড়ের ছায়ামূর্তি
      '<path d="M-10 170 L40 128 L80 150 L130 110 L180 152 L230 124 L280 156 L330 132 L370 150 V200 H-10 Z" fill="#2E3870"/>' +
      '<path d="M-10 196 C60 168 120 172 180 186 C240 170 300 172 370 184 V210 H-10 Z" fill="#161C3D"/>' +
      // হ্রদে চাঁদের প্রতিবিম্ব
      '<rect y="200" width="360" height="50" fill="url(#' + P + 'Lake)"/>' +
      '<g class="sc-reflect">' + [0, 1, 2, 3, 4].map(function (i) {
        return '<rect x="' + (268 - i * 3 + (i % 2 ? 4 : 0)) + '" y="' + (206 + i * 8) + '" width="' + (22 + i * 6) + '" height="2" rx="1" fill="#FFF3C4" opacity="' + (.8 - i * .12) + '"/>';
      }).join('') + '</g>' +
      '<path d="M-10 238 C40 230 80 236 120 240 L120 250 H-10 Z" fill="#0E1430"/>' +
      flies);
  }

  /* ---------------- সূর্যাস্ত ---------------- */
  function sunsetScene(P) {
    const defs = grad(P + 'Sky', [[0, '#3B2A6B'], [.35, '#B4478A'], [.7, '#F7845A'], [1, '#FFC371']]) +
      grad(P + 'Sea', [[0, '#F59A6A'], [.4, '#B4547E'], [1, '#3C2C62']]) +
      sunDefs(P, '#FFD27A', '#FF8A3D', '#FFC98A');
    const streak = [0, 1, 2, 3, 4, 5, 6].map(function (i) {
      const w = 60 - i * 6;
      return '<rect class="sc-glint" x="' + (180 - w / 2 + (i % 2 ? 5 : -5)) + '" y="' + (168 + i * 9) + '" width="' + w + '" height="2.2" rx="1.1" fill="#FFD79A" style="animation-delay:' + (i * .3) + 's"/>';
    }).join('');
    return svg('sunset', defs,
      '<rect width="360" height="250" fill="url(#' + P + 'Sky)"/>' +
      '<g class="sc-set">' + sun(P, 180, 168, 34, false) + '</g>' +
      '<g class="sc-clouds dusk"><g class="sc-cloud c1">' + cloud(60, 70, 1.2) + '</g><g class="sc-cloud c2">' + cloud(250, 50, .9) + '</g><g class="sc-cloud c3">' + cloud(-60, 110, .8) + '</g></g>' +
      flock(96, 'f1 dark', 1) + flock(66, 'f2 dark', .7) +
      '<rect y="166" width="360" height="84" fill="url(#' + P + 'Sea)"/>' +
      '<rect y="165" width="360" height="1.5" fill="#FFE2B0" opacity=".7"/>' +
      streak +
      sailboat(0, 186, 1, '#2A1E45', '#2A1E45', 'sc-sail slow') +
      '<g class="sc-wave w1"><path d="' + wave(206, 2, 36, 760) + '" fill="#3C2C62" opacity=".35"/></g>' +
      '<g class="sc-wave w2"><path d="' + wave(226, 3, 50, 760) + '" fill="#2A1E45" opacity=".45"/></g>');
  }

  const BUILD = { sea: seaScene, hill: hillScene, river: riverScene, tea: teaScene, night: nightScene, sunset: sunsetScene };

  function html(kind) {
    if (!BUILD[kind]) return '';
    seq += 1;
    return BUILD[kind]('sc' + seq + kind);
  }

  // ছুটির দিনে কোন দৃশ্য: সেটিংস থেকে, না থাকলে শুক্রবারে সমুদ্র, শনিবারে পাহাড়
  function choiceFor(dayKey) {
    const st = (window.Store && window.Store.settings) || {};
    const sc = st.scenes || {};
    if (dayKey === 'fri') return sc.fri || 'sea';
    if (dayKey === 'sat') return sc.sat || 'hill';
    return sc.other || 'river';
  }

  window.Scenes = {
    NONE: 'none',
    LIST: LIST,
    html: html,
    choiceFor: choiceFor,
    forDay: function (dayKey) { return html(choiceFor(dayKey)); }
  };
})();
