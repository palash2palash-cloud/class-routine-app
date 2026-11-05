/* ছুটির দিনের চলন্ত দৃশ্য: শুক্রবারে সমুদ্রতীর, শনিবারে পাহাড়।
   সবকিছু SVG আর CSS অ্যানিমেশনে আঁকা, কোনো ছবি ফাইল লাগে না, ইন্টারনেট ছাড়াই চলে। */
(function () {
  'use strict';

  function wave(y, amp, len, width) {
    // width চওড়া একটা ঢেউয়ের রেখা, নিচে ভরাট
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

  function birds() {
    return '<g class="sc-birds">' +
      '<path class="sc-bird" d="M0 0q5-5 10 0q5-5 10 0"/>' +
      '<path class="sc-bird b2" d="M18 10q4-4 8 0q4-4 8 0"/>' +
      '<path class="sc-bird b3" d="M-14 12q3.5-3.5 7 0q3.5-3.5 7 0"/></g>';
  }

  function sun(cx, cy, r, rays) {
    let ray = '';
    if (rays) {
      for (let i = 0; i < 12; i++) {
        const a = i * Math.PI / 6;
        ray += '<line x1="' + (Math.cos(a) * (r + 7)).toFixed(1) + '" y1="' + (Math.sin(a) * (r + 7)).toFixed(1) + '" x2="' + (Math.cos(a) * (r + 15)).toFixed(1) + '" y2="' + (Math.sin(a) * (r + 15)).toFixed(1) + '"/>';
      }
    }
    return '<g transform="translate(' + cx + ' ' + cy + ')">' +
      '<circle class="sc-sunglow" r="' + (r * 2.3) + '" fill="url(#scSunGlow)"/>' +
      (rays ? '<g class="sc-rays">' + ray + '</g>' : '') +
      '<circle r="' + r + '" fill="url(#scSun)"/></g>';
  }

  // সৈকতের ছাতা: চার রঙের ভাগ, খুঁটি, পাশে শোবার চেয়ার
  function umbrella(x, y, s, c1, c2) {
    const top = -40, rim = -24, w = 22;
    const apex = [0, top];
    const pts = [-w, -w / 2, 0, w / 2, w];
    let canopy = '';
    for (let i = 0; i < 4; i++) {
      const a = pts[i], b = pts[i + 1];
      canopy += '<path d="M' + apex[0] + ' ' + apex[1] + ' L' + a + ' ' + rim + ' Q' + ((a + b) / 2) + ' ' + (rim + 4) + ' ' + b + ' ' + rim + ' Z" fill="' + (i % 2 ? c2 : c1) + '"/>';
    }
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<ellipse cx="4" cy="1" rx="22" ry="3.5" fill="rgba(120,80,30,.18)"/>' +
      '<path d="M8 -2 l20 0 l5 -7" fill="none" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M10 -2 v3 M26 -2 v3" stroke="#B9A07A" stroke-width="1.6"/>' +
      '<g class="sc-umb">' +
      '<line x1="0" y1="0" x2="0" y2="' + (top + 2) + '" stroke="#8B5E34" stroke-width="2"/>' +
      canopy + '<circle cx="0" cy="' + top + '" r="1.8" fill="#8B5E34"/></g></g>';
  }

  function seaScene() {
    const umbs = [
      [70, 228, .82, '#EF4444', '#FFFFFF'], [128, 222, .74, '#F59E0B', '#FFFFFF'], [182, 217, .66, '#3B82F6', '#FFFFFF'],
      [230, 213, .6, '#10B981', '#FDE68A'], [274, 210, .55, '#EC4899', '#FFFFFF'], [314, 207, .5, '#8B5CF6', '#FDE68A']
    ].map(function (u) { return umbrella(u[0], u[1], u[2], u[3], u[4]); }).join('');
    const glints = [0, 1, 2, 3, 4, 5].map(function (i) {
      return '<ellipse class="sc-glint" cx="' + (300 + (i % 2 ? 6 : -5)) + '" cy="' + (128 + i * 9) + '" rx="' + (14 - i) + '" ry="1.4" style="animation-delay:' + (i * .35) + 's"/>';
    }).join('');
    return '<svg class="scene scene-sea" viewBox="0 0 360 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="scSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4FB3F6"/><stop offset=".55" stop-color="#9ADCFB"/><stop offset="1" stop-color="#FFE3A8"/></linearGradient>' +
      '<linearGradient id="scSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#22A6E0"/><stop offset="1" stop-color="#0B6FA8"/></linearGradient>' +
      '<linearGradient id="scSand" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FBE4B5"/><stop offset="1" stop-color="#F0C784"/></linearGradient>' +
      '<radialGradient id="scSun"><stop offset="0" stop-color="#FFFBE6"/><stop offset=".6" stop-color="#FFE066"/><stop offset="1" stop-color="#FDB833"/></radialGradient>' +
      '<radialGradient id="scSunGlow"><stop offset="0" stop-color="#FFF3B0" stop-opacity=".9"/><stop offset="1" stop-color="#FFF3B0" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="360" height="250" fill="url(#scSky)"/>' +
      sun(300, 60, 20, true) +
      '<g class="sc-clouds"><g class="sc-cloud c1">' + cloud(60, 42, 1.1) + '</g><g class="sc-cloud c2">' + cloud(190, 26, .8) + '</g><g class="sc-cloud c3">' + cloud(-40, 70, .7) + '</g></g>' +
      '<g class="sc-flock" transform="translate(120 70)">' + birds() + '</g>' +
      // সমুদ্র
      '<rect y="116" width="360" height="100" fill="url(#scSea)"/>' +
      '<rect y="115" width="360" height="2" fill="#FFFFFF" opacity=".35"/>' +
      glints +
      '<g class="sc-wave w1"><path d="' + wave(134, 2.5, 30, 760) + '" fill="#1E9AD6" opacity=".55"/></g>' +
      '<g class="sc-wave w2"><path d="' + wave(150, 3.5, 44, 760) + '" fill="#168BC6" opacity=".6"/></g>' +
      '<g class="sc-wave w3"><path d="' + wave(168, 4.5, 60, 760) + '" fill="#2BB3E8" opacity=".7"/></g>' +
      // তীরে আছড়ে পড়া ঢেউ ও ফেনা
      '<path class="sc-wet" d="M0 196 C70 188 140 202 220 194 S320 186 360 192 V210 H0 Z" fill="#E2B877" opacity=".55"/>' +
      '<g class="sc-surf"><path d="M0 190 C60 180 130 196 210 186 S320 178 360 186 V198 C320 190 260 200 200 196 S70 192 0 200 Z" fill="#7DD3F5"/>' +
      '<path d="M0 197 C70 189 140 203 220 195 S320 187 360 193" fill="none" stroke="#FFFFFF" stroke-width="3.2" stroke-linecap="round" opacity=".95"/>' +
      '<path d="M20 193 q6 -3 12 0 M90 195 q6 -3 12 0 M170 197 q6 -3 12 0 M250 191 q6 -3 12 0 M320 189 q6 -3 12 0" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/></g>' +
      // বালুর তীর
      '<path d="M0 200 C80 192 150 206 230 198 S330 190 360 196 V250 H0 Z" fill="url(#scSand)"/>' +
      '<path d="M0 232 C90 226 200 238 360 228" fill="none" stroke="#E7B86E" stroke-width="1.2" opacity=".6"/>' +
      // নারকেল গাছ
      '<g class="sc-palm"><path d="M18 252 C22 220 30 190 46 160" fill="none" stroke="#8B5A2B" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M18 252 C22 220 30 190 46 160" fill="none" stroke="#A9743C" stroke-width="2.4" stroke-dasharray="3 5"/>' +
      '<g class="sc-fronds">' +
      '<path d="M46 160 C30 150 14 152 2 164 C18 156 32 158 46 160Z" fill="#2E9E57"/>' +
      '<path d="M46 160 C40 142 26 132 10 132 C26 140 38 148 46 160Z" fill="#37B464"/>' +
      '<path d="M46 160 C54 140 70 134 86 138 C70 142 58 150 46 160Z" fill="#2E9E57"/>' +
      '<path d="M46 160 C64 152 82 156 94 168 C80 160 64 158 46 160Z" fill="#37B464"/>' +
      '<path d="M46 160 C48 172 42 186 32 194 C38 182 42 172 46 160Z" fill="#279050"/>' +
      '<circle cx="44" cy="164" r="3.2" fill="#6B4423"/><circle cx="49" cy="163" r="3" fill="#7A4E2A"/></g></g>' +
      umbs +
      // বাতাসের রেখা
      '<g class="sc-wind"><path d="M0 92 q20 -6 40 0 t40 0" /><path d="M0 104 q16 -5 32 0 t32 0"/></g>' +
      '</svg>';
  }

  function pine(x, y, s, c) {
    return '<g class="sc-pine" transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<rect x="-1.5" y="-4" width="3" height="8" fill="#5B3A1E"/>' +
      '<path d="M0 -34 L-9 -18 L-5 -18 L-12 -6 L-7 -6 L-14 4 L14 4 L7 -6 L12 -6 L5 -18 L9 -18 Z" fill="' + c + '"/></g>';
  }

  function mountainScene() {
    const pines = [[30, 214, 1, '#1F5E3B'], [48, 220, .8, '#246B44'], [70, 212, .9, '#1F5E3B'], [300, 212, 1, '#1F5E3B'],
      [322, 218, .85, '#246B44'], [342, 210, .95, '#1F5E3B'], [262, 220, .7, '#2A7A4E']]
      .map(function (p) { return pine(p[0], p[1], p[2], p[3]); }).join('');
    return '<svg class="scene scene-hill" viewBox="0 0 360 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs>' +
      '<linearGradient id="scSky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7FB8F5"/><stop offset=".5" stop-color="#C9C2F4"/><stop offset="1" stop-color="#FFD9B0"/></linearGradient>' +
      '<linearGradient id="scLake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FB7E8"/><stop offset="1" stop-color="#3F6FB0"/></linearGradient>' +
      '<linearGradient id="scM1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9DA8E6"/><stop offset="1" stop-color="#B9B7EC"/></linearGradient>' +
      '<linearGradient id="scM2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6A74C9"/><stop offset="1" stop-color="#8A8FD6"/></linearGradient>' +
      '<linearGradient id="scM3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4E9A6E"/><stop offset="1" stop-color="#2F7652"/></linearGradient>' +
      '<radialGradient id="scSun"><stop offset="0" stop-color="#FFFBE6"/><stop offset=".6" stop-color="#FFD27A"/><stop offset="1" stop-color="#FFAA4C"/></radialGradient>' +
      '<radialGradient id="scSunGlow"><stop offset="0" stop-color="#FFE7B8" stop-opacity=".95"/><stop offset="1" stop-color="#FFE7B8" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect width="360" height="250" fill="url(#scSky2)"/>' +
      '<g class="sc-sunrise">' + sun(232, 112, 22, false) + '</g>' +
      '<g class="sc-clouds"><g class="sc-cloud c1">' + cloud(70, 40, 1) + '</g><g class="sc-cloud c2">' + cloud(240, 30, .75) + '</g></g>' +
      '<g class="sc-flock" transform="translate(150 64)">' + birds() + '</g>' +
      // দূরের পাহাড়
      '<path d="M0 150 L40 110 L70 128 L112 82 L150 120 L188 96 L226 128 L268 90 L310 122 L360 100 V200 H0 Z" fill="url(#scM1)" opacity=".9"/>' +
      // মাঝের বরফঢাকা পাহাড়
      '<path d="M-10 186 L60 112 L96 140 L150 72 L204 136 L240 108 L300 160 L330 132 L370 160 V210 H-10 Z" fill="url(#scM2)"/>' +
      '<path d="M150 72 L136 90 L144 88 L150 96 L156 87 L166 92 Z" fill="#FFFFFF"/>' +
      '<path d="M60 112 L50 123 L57 121 L62 127 L67 120 L72 124 Z" fill="#FFFFFF" opacity=".95"/>' +
      '<path d="M240 108 L232 117 L238 116 L242 121 L247 115 L251 118 Z" fill="#FFFFFF" opacity=".9"/>' +
      '<g class="sc-mist m1"><ellipse cx="80" cy="166" rx="90" ry="8" fill="#FFFFFF" opacity=".45"/></g>' +
      // কাছের সবুজ পাহাড়
      '<path d="M-10 214 C40 176 90 170 140 196 C180 176 230 168 280 186 C320 172 350 178 370 186 V250 H-10 Z" fill="url(#scM3)"/>' +
      '<g class="sc-mist m2"><ellipse cx="260" cy="190" rx="110" ry="7" fill="#FFFFFF" opacity=".35"/></g>' +
      // হ্রদ
      '<path d="M90 222 C140 212 220 212 280 222 C250 236 140 238 90 222 Z" fill="url(#scLake)"/>' +
      '<g class="sc-ripple"><path d="M120 222 h24 M170 226 h30 M220 221 h22 M150 230 h20" stroke="#E0F2FE" stroke-width="1.4" stroke-linecap="round"/></g>' +
      '<path d="M-10 236 C60 226 120 244 190 238 S320 226 370 236 V250 H-10 Z" fill="#256B47"/>' +
      pines +
      '</svg>';
  }

  window.Scenes = {
    forDay: function (dayKey) {
      if (dayKey === 'fri') return seaScene();
      if (dayKey === 'sat') return mountainScene();
      return '';
    }
  };
})();
