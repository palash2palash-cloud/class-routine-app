/* অ্যাপের মূল অংশ: স্ক্রিন আঁকা, বোতাম চাপলে কী হবে, ইত্যাদি। */
(function () {
  'use strict';

  const I = window.I18N;
  const S = window.Store;
  const N = window.Notify;
  const E = window.Exporter;
  const t = I.t;

  const state = {
    view: 'today',
    prevView: 'today',
    editId: null,
    presetDay: null,
    presetTimes: null,
    search: '',
    renderedDay: null,
    loadError: false,
    sortables: [],
    overlays: []
  };

  const $ = function (sel, root) { return (root || document).querySelector(sel); };
  const $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  function esc(s) {
    return String(s === null || s === undefined ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  const ICON = {
    edit: '<svg viewBox="0 0 24 24"><path d="M15.2 3.6a2 2 0 0 1 2.8 0l2.4 2.4a2 2 0 0 1 0 2.8L9.6 19.6 4 21l1.4-5.6L15.2 3.6Zm1.4 1.4-1.6 1.6 2.4 2.4 1.6-1.6-2.4-2.4Zm-3 3L6.9 14.7l-.7 2.9 2.9-.7 6.7-6.7-2.2-2.2Z"/></svg>',
    room: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7Zm0 4.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z"/></svg>',
    people: '<svg viewBox="0 0 24 24"><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20c0-3.3 3.1-6 7-6s7 2.7 7 6v1H2v-1Zm15.5 1v-1c0-2-.8-3.8-2.2-5.1 3.5-.5 6.7 1.7 6.7 5.1v1h-4.5Z"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M12 2a6 6 0 0 0-6 6v3.6L4.3 15A1 1 0 0 0 5.2 16.5h13.6a1 1 0 0 0 .9-1.5L18 11.6V8a6 6 0 0 0-6-6Zm-2.5 16a2.5 2.5 0 0 0 5 0h-5Z"/></svg>',
    bellOff: '<svg viewBox="0 0 24 24"><path d="M3.7 2.3a1 1 0 0 0-1.4 1.4l18 18a1 1 0 0 0 1.4-1.4l-2.4-2.4a1 1 0 0 0 .4-1.4L18 11.6V8a6 6 0 0 0-10.2-4.3L3.7 2.3ZM6 9.4V11.6L4.3 15a1 1 0 0 0 .9 1.5h9.9L6 9.4Zm3.5 8.6a2.5 2.5 0 0 0 5 0h-5Z"/></svg>',
    note: '<svg viewBox="0 0 24 24"><path d="M5 3h10l4 4v14H5V3Zm9 1.5V8h3.5L14 4.5ZM8 11v1.6h8V11H8Zm0 4v1.6h6V15H8Z"/></svg>',
    drag: '<svg viewBox="0 0 24 24"><path d="M9 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 7a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-1.5 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM18 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm-1.5 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM18 19a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1Z"/></svg>',
    back: '<svg viewBox="0 0 24 24"><path d="M15.7 4.3a1 1 0 0 1 0 1.4L9.4 12l6.3 6.3a1 1 0 1 1-1.4 1.4l-7-7a1 1 0 0 1 0-1.4l7-7a1 1 0 0 1 1.4 0Z"/></svg>',
    list: '<svg viewBox="0 0 24 24"><path d="M4 5h16v2H4V5Zm0 6h16v2H4v-2Zm0 6h16v2H4v-2Z"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><path d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm10 0h8v8h-8v-8Z"/></svg>',
    glance: '<svg viewBox="0 0 24 24"><path d="M2 4h4v4H2V4Zm5.5 0h4v4h-4V4ZM13 4h4v4h-4V4Zm5.5 0H22v4h-3.5V4ZM2 10h4v4H2v-4Zm5.5 0h4v4h-4v-4ZM13 10h4v4h-4v-4Zm5.5 0H22v4h-3.5v-4ZM2 16h4v4H2v-4Zm5.5 0h4v4h-4v-4ZM13 16h4v4h-4v-4Zm5.5 0H22v4h-3.5v-4Z"/></svg>',
    search: '<svg viewBox="0 0 24 24"><path d="M10 3a7 7 0 0 1 5.6 11.2l4.6 4.6a1 1 0 0 1-1.4 1.4l-4.6-4.6A7 7 0 1 1 10 3Zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><path d="M8 3h11a2 2 0 0 1 2 2v11h-2V5H8V3ZM5 7h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Z"/></svg>',
    periods: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm1 3v4.6l3.4 2-1 1.7L11 12.7V7h2Z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M9.5 16.2 5.3 12l-1.4 1.4 5.6 5.6L20.1 8.4 18.7 7z"/></svg>',
    pdf: '<svg viewBox="0 0 24 24"><path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm7 1.5V9h5.5L13 3.5ZM11 11v5.2l-2.1-2.1-1.4 1.4L12 20l4.5-4.5-1.4-1.4-2.1 2.1V11h-2Z"/></svg>',
    palette: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Zm-5 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/></svg>'
  };

  /* ---------------- থিম ---------------- */

  const darkQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function applyTheme() {
    const pref = S.settings.theme;
    const dark = pref === 'dark' || (pref === 'system' && darkQuery && darkQuery.matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#111827' : '#4F46E5');
  }

  /* ---------------- টোস্ট ---------------- */

  let toastTimer = null;
  function toast(msg, action) {
    const el = $('#toast');
    el.innerHTML = '<span>' + esc(msg) + '</span>' + (action ? '<button type="button" class="toast-action">' + esc(action.label) + '</button>' : '');
    el.classList.add('show');
    if (action) {
      $('.toast-action', el).onclick = function () {
        el.classList.remove('show');
        action.run();
      };
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, action ? 6000 : 2800);
  }

  /* ---------------- ডায়ালগ ও শিট ---------------- */

  function openOverlay(kind, innerHtml, onClose) {
    const root = $('#overlayRoot');
    const wrap = document.createElement('div');
    wrap.className = 'overlay overlay-' + kind;
    wrap.innerHTML = '<div class="scrim"></div><div class="' + (kind === 'sheet' ? 'sheet' : 'dialog') + '" role="dialog" aria-modal="true">' + innerHtml + '</div>';
    root.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add('open'); });
    const entry = { el: wrap, onClose: onClose };
    state.overlays.push(entry);
    $('.scrim', wrap).addEventListener('click', function () { closeOverlay(entry); });
    return entry;
  }

  function closeOverlay(entry, silent) {
    entry = entry || state.overlays[state.overlays.length - 1];
    if (!entry) return;
    state.overlays = state.overlays.filter(function (e) { return e !== entry; });
    entry.el.classList.remove('open');
    setTimeout(function () { entry.el.remove(); }, 220);
    if (!silent && entry.onClose) entry.onClose();
  }

  function confirmDialog(opts) {
    return new Promise(function (resolve) {
      let done = false;
      const entry = openOverlay('dialog',
        '<h2 class="dialog-title">' + esc(opts.title) + '</h2>' +
        (opts.message ? '<p class="dialog-msg">' + esc(opts.message) + '</p>' : '') +
        '<div class="dialog-actions">' +
        '<button type="button" class="btn btn-text" data-act="cancel">' + esc(opts.cancelText || t('common.cancel')) + '</button>' +
        '<button type="button" class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" data-act="ok">' + esc(opts.okText || t('common.ok')) + '</button>' +
        '</div>',
        function () { if (!done) { done = true; resolve(false); } });
      $('[data-act="cancel"]', entry.el).onclick = function () { done = true; closeOverlay(entry, true); resolve(false); };
      $('[data-act="ok"]', entry.el).onclick = function () { done = true; closeOverlay(entry, true); resolve(true); };
    });
  }

  function infoDialog(title, message) {
    const entry = openOverlay('dialog',
      '<h2 class="dialog-title">' + esc(title) + '</h2><p class="dialog-msg">' + esc(message) + '</p>' +
      '<div class="dialog-actions"><button type="button" class="btn btn-primary" data-act="ok">' + esc(t('common.ok')) + '</button></div>');
    $('[data-act="ok"]', entry.el).onclick = function () { closeOverlay(entry, true); };
  }

  /* ---------------- সাহায্যকারী ---------------- */

  function nowMin() {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
  }

  function addMinutes(hhmm, mins) {
    let total = (S.toMin(hhmm) + mins) % 1440;
    if (total < 0) total += 1440;
    return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
  }

  function fmtTime(hhmm) {
    return I.formatTime(hhmm, S.settings.timeFormat);
  }

  // রুটিনের লেখা অ্যাপের ভাষায় (Localize: বাংলা ⇄ ইংরেজি)
  const L = function (x) { return window.Localize.loc(x); };
  function classSec(c) {
    return window.Localize.classLabel(c);
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function colorVars(hex) {
    const rgb = hexToRgb(hex);
    return '--c:' + hex + ';--c-rgb:' + rgb.join(',') + ';';
  }

  function reminderLabel(c) {
    const lead = N.leadFor(c, S.settings);
    if (lead === null) return t('card.remindOff');
    return t('card.remindMin', { m: lead });
  }

  /* ---------------- ক্লাস কার্ড ---------------- */

  /* চলমান ক্লাসের বালুঘড়ি: উপরের বালি কমে, নিচে জমে, মাঝে বালির সরু ধারা পড়ে।
     কতটা বালি নেমেছে তা ক্লাসের কতটা সময় পার হয়েছে তার সমান (updateLive হালনাগাদ করে)। */
  // বালুঘড়ির নকশাগুলো (সেটিংস থেকে বাছাই করা যায়); রংগুলো CSS-এ .hg-<নাম> ক্লাসে
  const HG_STYLES = ['classic', 'black', 'wood', 'crystal', 'rose', 'night', 'emerald', 'minimal', 'off'];
  const DAYEND_STYLES = ['classic', 'black', 'wood', 'crystal', 'rose', 'night', 'emerald', 'minimal'];

  /* দিনশেষের বড় বালুঘড়ি: শেষ ক্লাস থেকে রাত ১২টা পর্যন্ত বালি ঝরে।
     মাপ ও গড়ন Palash-এর দেওয়া ছবির মতো (ঢাকনা ২২২ চওড়া, পুরো উচ্চতা ৩৩৩)।
     রং আসে CSS-এর .bh-<নাম> থেকে। হোমপেজে এটি লক: চাপলে কিছু হয় না। */
  const BH_GLASS = 'M186 136V168C186 214 250 246 257 270C250 294 186 326 186 372V404H350V372C350 326 286 294 279 270C286 246 350 214 350 168V136Z';
  function bigHourglassHtml(style, uid) {
    const k = 'bh' + uid;
    // ঝরে পড়া বালির দানা: প্রতিটির গতি, দেরি আর সামান্য এদিক-ওদিক আলাদা, তাই ধারাটা জীবন্ত দেখায়
    const grains = [];
    for (let i = 0; i < 26; i++) {
      const dx = ((i * 37) % 9 - 4) * 0.55;
      const x = 268 + ((i * 53) % 5 - 2) * 0.5;
      const r = 0.95 + ((i * 29) % 5) * 0.22;
      const dur = 0.6 + ((i * 17) % 6) * 0.06;
      grains.push('<circle class="bh-grain" cx="' + x.toFixed(2) + '" cy="270" r="' + r.toFixed(2) + '" style="--dx:' + dx.toFixed(2) + 'px;animation-duration:' + dur.toFixed(2) + 's;animation-delay:-' + (i * 0.033).toFixed(3) + 's"/>');
    }
    // স্তূপের চূড়ায় দানা ছিটকে গড়িয়ে পড়া
    const splash = [-7, 6, -4, 9, -10, 4].map(function (dx, i) {
      return '<circle class="bh-splash-g" cx="268" cy="406" r="' + (i % 2 ? 1.1 : 0.9) + '" style="--dx:' + dx + 'px;animation-delay:-' + (i * 0.13).toFixed(2) + 's"/>';
    }).join('');
    return '<div class="big-hg bh-' + style + '" aria-hidden="true">' +
      '<svg viewBox="116 98 304 354" preserveAspectRatio="xMidYMid meet">' +
      '<defs>' +
      '<clipPath id="' + k + 'c"><path d="' + BH_GLASS + '"/></clipPath>' +
      '<linearGradient id="' + k + 's" x1="0" y1="0" x2="0" y2="1"><stop class="bh-s1" offset="0"/><stop class="bh-s2" offset=".6"/><stop class="bh-s3" offset="1"/></linearGradient>' +
      '<linearGradient id="' + k + 'b" x1="0" y1="0" x2="0" y2="1"><stop class="bh-s2" offset="0"/><stop class="bh-s3" offset="1"/></linearGradient>' +
      '<linearGradient id="' + k + 'g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".38"/><stop offset=".3" stop-color="#fff" stop-opacity=".1"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient>' +
      '<linearGradient id="' + k + 'k" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".12"/></linearGradient>' +
      '</defs>' +
      '<ellipse class="bh-shadow" cx="268" cy="437" rx="146" ry="11"/>' +
      // কাচের ভেতরে: কাচ, উপরের বালি, ঝরে পড়া ধারা, নিচের স্তূপ, ডান দিকের ছায়া, চকচকে আভা
      '<path class="bh-edge" d="' + BH_GLASS + '"/>' +
      '<path class="bh-glass" d="' + BH_GLASS + '"/>' +
      '<g clip-path="url(#' + k + 'c)">' +
      '<path class="bh-top" d="M118 158C168 150 222 156 254 166Q268 172 282 166C314 156 368 150 418 158V274H118Z" fill="url(#' + k + 's)"/>' +
      '<path class="bh-top bh-top-lip" d="M118 158C168 150 222 156 254 166Q268 172 282 166C314 156 368 150 418 158" />' +
      '<path class="bh-stream" d="M266.2 266Q267.4 300 266.9 406H269.1Q268.6 300 269.8 266Z"/>' +
      grains.join('') +
      '<path class="bh-bottom" d="M118 406V364C196 356 236 318 268 312C300 318 340 356 418 364V406Z" fill="url(#' + k + 'b)"/>' +
      '<g class="bh-splash">' + splash + '</g>' +
      '<path class="bh-shade" d="M296 130H360V410H186V394L279 278L296 254Z"/>' +
      '<rect x="116" y="98" width="304" height="354" fill="url(#' + k + 'g)"/>' +
      '</g>' +
      '<path class="bh-line" d="' + BH_GLASS + '"/>' +
      '<path class="bh-gloss" d="M197 146V170C197 198 214 218 234 234" stroke-width="5"/>' +
      '<path class="bh-gloss" d="M197 394V374C197 346 210 328 228 312" stroke-width="3.5" opacity=".55"/>' +
      // উপরের ঢাকনা: হালকা লাল পাত, নিচে গাঢ় ঢালু অংশ
      '<rect class="bh-cap1" x="157" y="103" width="222" height="21" rx="4.5"/>' +
      '<rect x="157" y="103" width="222" height="21" rx="4.5" fill="url(#' + k + 'k)"/>' +
      '<path class="bh-cap2" d="M160 123H376L363 137H173Z"/>' +
      // নিচের ঢাকনা: উল্টো করে, ঢালু অংশ উপরে
      '<path class="bh-cap1" d="M173 403H363L376 418H160Z"/>' +
      '<rect class="bh-cap2" x="157" y="417" width="222" height="19" rx="4.5"/>' +
      '<rect x="157" y="417" width="222" height="19" rx="4.5" fill="url(#' + k + 'k)" opacity=".6"/>' +
      '</svg></div>';
  }

  // ফ্লিপ ক্লকের একটি সংখ্যা: উপরের অর্ধেক ভাঁজ হয়ে নামে, তারপর নিচের অর্ধেক বসে যায়
  function flipDigitHtml(u) {
    return '<span class="fc" data-u="' + u + '"><span class="fc-t"><b></b></span><span class="fc-b"><b></b></span>' +
      '<span class="fc-ft"><b></b></span><span class="fc-fb"><b></b></span></span>';
  }
  function setFlip(el, ch) {
    const old = el.getAttribute('data-v');
    if (old === ch) return;
    el.setAttribute('data-v', ch);
    const q = function (c) { return el.querySelector('.' + c + ' b'); };
    q('fc-t').textContent = ch;
    q('fc-fb').textContent = ch;
    if (old === null || document.hidden) { q('fc-b').textContent = ch; q('fc-ft').textContent = ch; return; }
    q('fc-ft').textContent = old;
    q('fc-b').textContent = old;
    el.classList.remove('go');
    void el.offsetWidth;
    el.classList.add('go');
    clearTimeout(el._flipT);
    el._flipT = setTimeout(function () { q('fc-b').textContent = ch; el.classList.remove('go'); }, 640);
  }


  // চলমান ক্লাসের কার্ডের বালুঘড়ি: দিনশেষের বড় বালুঘড়ির একই নকশা, ছোট মাপে
  function hourglassHtml(id, style) {
    style = style || S.settings.hgStyle || 'classic';
    if (style === 'off') return '';
    return '<span class="hourglass" aria-hidden="true">' + bigHourglassHtml(style, 'c' + String(id).replace(/[^a-zA-Z0-9_-]/g, '')) + '</span>';
  }

  // চলমান ক্লাসের কার্ডে ক্লাস শেষ হতে কত বাকি, তার গোল ঘড়ি
  function cardTimerHtml() {
    let ticks = '';
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      const r1 = i % 3 ? 29.5 : 28, r2 = 32;
      ticks += '<line x1="' + (42 + Math.sin(a) * r1).toFixed(2) + '" y1="' + (42 - Math.cos(a) * r1).toFixed(2) + '" x2="' + (42 + Math.sin(a) * r2).toFixed(2) + '" y2="' + (42 - Math.cos(a) * r2).toFixed(2) + '"/>';
    }
    return '<div class="card-timer" aria-hidden="true"><svg viewBox="0 0 84 84">' +
      '<circle class="ct-face" cx="42" cy="42" r="40"/>' +
      '<circle class="ct-track" cx="42" cy="42" r="36"/>' +
      '<circle class="ct-prog" cx="42" cy="42" r="36" transform="rotate(-90 42 42)"/>' +
      '<g class="ct-ticks">' + ticks + '</g>' +
      '<circle class="ct-dot" cx="42" cy="6" r="4"/>' +
      '</svg><span class="ct-text"><b class="ct-time">০০:০০</b><small>' + esc(t('card.left')) + '</small></span></div>';
  }

  function tickCardTimer() {
    const el = $('.class-card.is-now .card-timer');
    if (!el) return;
    const c = S.getClass(el.closest('.class-card').getAttribute('data-id'));
    if (!c) return;
    const now = new Date();
    const base = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const st = base + S.toMin(c.start) * 60000, en = base + S.toMin(c.end) * 60000;
    const left = Math.max(0, Math.round((en - now.getTime()) / 1000));
    const p = Math.min(1, Math.max(0, (now.getTime() - st) / Math.max(1, en - st)));
    const mm = Math.floor(left / 60), ss = left % 60;
    $('.ct-time', el).textContent = I.num(String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0'));
    const C = 2 * Math.PI * 36;
    const prog = $('.ct-prog', el);
    prog.style.strokeDasharray = C.toFixed(2);
    prog.style.strokeDashoffset = (C * p).toFixed(2);
    // ঘড়ির কাঁটার মতো একটা বিন্দু ঘোরে
    $('.ct-dot', el).setAttribute('transform', 'rotate(' + (p * 360).toFixed(1) + ' 42 42)');
    el.classList.toggle('is-ending', left <= 300);
  }

  function cardHtml(c, opts) {
    opts = opts || {};
    const cs = classSec(c);
    const lead = N.leadFor(c, S.settings);
    const meta = [];
    if (cs) meta.push('<span class="chip">' + ICON.people + esc(cs) + '</span>');
    if (c.room) meta.push('<span class="chip">' + ICON.room + esc(t('card.room')) + ' ' + esc(L(c.room)) + '</span>');
    meta.push('<span class="chip chip-soft' + (lead === null || !S.settings.notifEnabled ? ' is-off' : '') + '">' +
      (lead === null || !S.settings.notifEnabled ? ICON.bellOff : ICON.bell) + esc(reminderLabel(c)) + '</span>');

    return '<article class="class-card" data-id="' + esc(c.id) + '" style="' + colorVars(c.color) + (opts.index !== undefined ? '--i:' + opts.index + ';' : '') + '">' +
      '<div class="card-time' + (opts.live && S.settings.hgStyle !== 'off' ? ' has-hg' : '') + '">' +
      '<span class="t-start">' + esc(fmtTime(c.start)) + '</span>' +
      '<span class="t-line"></span>' +
      (opts.live ? hourglassHtml(c.id) : '') +
      '<span class="t-end">' + esc(fmtTime(c.end)) + '</span>' +
      '</div>' +
      '<div class="card-body">' +
      '<div class="card-head"><h3>' + esc(L(c.subject) || t('form.untitled')) + '</h3>' +
      (opts.live ? '<span class="live-badge" hidden>' + esc(t('today.now')) + '</span>' : '') + '</div>' +
      (opts.live ? cardTimerHtml() : '') +
      '<div class="card-meta">' + meta.join('') + '</div>' +
      (c.note ? '<p class="card-note">' + ICON.note + '<span>' + esc(L(c.note)) + '</span></p>' : '') +
      (opts.live && S.getNote(S.sectionKey(c)) ? '<p class="card-prep">' + ICON.edit + '<span><b>' + esc(t('prep.cardLabel')) + '</b> ' + esc(S.getNote(S.sectionKey(c))) + '</span></p>' : '') +
      (opts.live ? '<div class="card-progress" hidden><span></span></div>' : '') +
      (opts.live ? attButtonHtml(c) : '') +
      '</div>' +
      (opts.drag ? '<button type="button" class="drag-handle" aria-label="' + esc(t('week.drag')) + '">' + ICON.drag + '</button>' : '') +
      '</article>';
  }

  function emptyHtml(kind, title, text, btn, artHtml) {
    const art = artHtml ? '<div class="scene-wrap">' + artHtml + '</div>' : {
      empty: '<svg viewBox="0 0 120 100" class="empty-art"><rect x="18" y="16" width="84" height="70" rx="14" class="ea-1"/><rect x="18" y="16" width="84" height="20" rx="10" class="ea-2"/><rect x="32" y="48" width="44" height="8" rx="4" class="ea-3"/><rect x="32" y="64" width="30" height="8" rx="4" class="ea-4"/><circle cx="92" cy="78" r="16" class="ea-5"/><path d="M92 70v8l6 4" class="ea-6"/></svg>',
      holiday: '<svg viewBox="0 0 120 100" class="empty-art"><circle cx="60" cy="44" r="22" class="ea-5"/><g class="ea-6"><path d="M60 10v8M60 70v8M26 44h8M86 44h8M36 20l6 6M78 62l6 6M36 68l6-6M78 26l6-6"/></g><rect x="20" y="84" width="80" height="8" rx="4" class="ea-2"/></svg>',
      search: '<svg viewBox="0 0 120 100" class="empty-art"><circle cx="52" cy="44" r="24" class="ea-2"/><circle cx="52" cy="44" r="14" class="ea-1"/><path d="M70 62l20 20" class="ea-6" stroke-width="8"/></svg>'
    }[kind];
    return '<div class="empty' + (artHtml ? ' has-scene' : '') + '">' + art + '<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' +
      (btn ? '<button type="button" class="btn btn-primary" data-action="' + esc(btn.action) + '"' + (btn.day ? ' data-day="' + esc(btn.day) + '"' : '') + '>' + ICON.plus + esc(btn.label) + '</button>' : '') +
      '</div>';
  }

  /* ---------------- টপ বার ও নেভিগেশন ---------------- */

  function setTop(title, sub, actionsHtml, backable) {
    $('#topTitle').textContent = title;
    $('#topSub').textContent = sub || '';
    $('#topSub').hidden = !sub;
    const bar = $('#topbar');
    bar.classList.toggle('has-back', !!backable);
    let backBtn = $('.top-back', bar);
    if (backable && !backBtn) {
      bar.insertAdjacentHTML('afterbegin', '<button type="button" class="icon-btn top-back" aria-label="' + esc(t('common.back')) + '">' + ICON.back + '</button>');
      $('.top-back', bar).onclick = goBack;
    } else if (!backable && backBtn) {
      backBtn.remove();
    }
    $('#topActions').innerHTML = actionsHtml || '';
    $('#topLogo').hidden = state.view !== 'today';
  }

  function navigate(view, opts) {
    opts = opts || {};
    if (view === 'today' || view === 'week' || view === 'settings' || view === 'calendar') state.prevView = view;
    if (view === 'add') {
      view = 'form';
      state.editId = null;
      state.presetDay = opts.day || null;
      state.presetTimes = opts.start && opts.end ? { start: opts.start, end: opts.end } : null;
    } else if (view === 'form') {
      state.editId = opts.id || null;
      state.presetDay = opts.day || null;
    }
    if (view === 'settings' && state.view !== 'settings') { state.draft = null; state.dirty = false; state.leadCustomOpen = false; }
    state.view = view;
    render();
    $('#view').scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function goBack() {
    if (state.overlays.length) { closeOverlay(); return true; }
    if (state.view === 'form') { navigate(state.prevView || 'today'); return true; }
    if (state.view === 'settings' && state.dirty) {
      canLeaveSettings().then(function (ok) { if (ok) navigate('today'); });
      return true;
    }
    if (state.view !== 'today') { navigate('today'); return true; }
    return false;
  }

  function highlightNav() {
    const active = state.view === 'form' ? (state.editId ? state.prevView : 'add') : state.view;
    $$('.nav-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-nav') === active);
    });
  }

  function destroySortables() {
    state.sortables.forEach(function (s) { try { s.destroy(); } catch (e) { /* ignore */ } });
    state.sortables = [];
  }

  function render() {
    destroySortables();
    const view = $('#view');
    view.className = 'view view-' + state.view;
    view.classList.remove('enter');
    void view.offsetWidth;
    view.classList.add('enter');
    if (state.view === 'today') renderToday();
    else if (state.view === 'week') renderWeek();
    else if (state.view === 'form') renderForm();
    else if (state.view === 'settings') renderSettings();
    else if (state.view === 'calendar') renderCalendar();
    highlightNav();
  }

  /* ---------------- আজ (Today) ---------------- */

  function todayInfo() {
    const now = new Date();
    const dayKey = S.dayKeyOf(now);
    return {
      now: now,
      dayKey: dayKey,
      iso: S.isoDate(now),
      holiday: S.settings.holidays.indexOf(dayKey) !== -1,
      classes: S.classesForDay(dayKey)
    };
  }

  function greeting() {
    const h = new Date().getHours();
    if (h >= 4 && h < 12) return t('today.goodMorning');
    if (h >= 12 && h < 17) return t('today.goodAfternoon');
    return t('today.goodEvening');
  }

  function renderToday() {
    const info = todayInfo();
    state.renderedDay = info.iso;
    const muted = S.settings.mutedDates.indexOf(info.iso) !== -1 || S.settings.mutedDays.indexOf(info.dayKey) !== -1;
    let actions = '';
    if (S.settings.notifEnabled && !info.holiday && info.classes.length) {
      actions = '<button type="button" class="icon-btn' + (muted ? ' is-muted' : '') + '" data-action="toggle-mute-today" aria-label="' + esc(t('today.muteToday')) + '">' + (muted ? ICON.bellOff : ICON.bell) + '</button>';
    }
    setTop(t('today.appTitle'), I.formatDate(info.now), actions);

    let html = '';
    if (state.loadError) {
      html += '<div class="banner banner-error"><strong>' + esc(t('error.loadTitle')) + '</strong><span>' + esc(t('error.loadText')) + '</span>' +
        '<button type="button" class="btn btn-small" data-action="restore">' + esc(t('settings.restore')) + '</button></div>';
    }
    // রাত ১২টার পর থেকে আজকের ক্লাস যতক্ষণ বাকি, ততক্ষণ উপরে ছোট ফ্লিপ ঘড়ি (ক্লাস চললে লাল)
    const nm0 = nowMin();
    if (!info.holiday && info.classes.some(function (c) { return S.toMin(c.end) > nm0; })) {
      html += '<section class="now-clock" id="nowClock" aria-hidden="true">' +
        '<span class="nc-label" id="ncLabel"></span>' +
        '<span class="nc-digits">' +
        ['h', 'm', 's'].map(function (u, i) {
          return (i ? '<span class="nc-colon"><i></i><i></i></span>' : '') + '<span class="nc-pair">' + flipDigitHtml('n' + u + '0') + flipDigitHtml('n' + u + '1') + '</span>';
        }).join('') + '</span>' +
        '<span class="nc-ap" id="ncAp"></span></section>';
    }
    html += profileCardHtml();

    if (info.holiday) {
      // শুক্রবারে সমুদ্র, শনিবারে পাহাড়ের চলন্ত দৃশ্য; অন্য ছুটির দিনে সূর্য
      html += emptyHtml('holiday', t('today.holidayTitle'), info.classes.length ? t('today.holidayHasClasses') : t('today.holidayText'), null, window.Scenes ? window.Scenes.forDay(info.dayKey) : '');
      if (info.classes.length) {
        html += '<div class="card-list">' + info.classes.map(function (c, i) { return cardHtml(c, { index: i }); }).join('') + '</div>';
      }
    } else if (!info.classes.length) {
      html += emptyHtml('empty', t('today.emptyTitle'), t('today.emptyText'), { action: 'add', day: info.dayKey, label: t('today.addBtn') });
    } else {
      if (muted) {
        html += '<div class="banner banner-warn">' + ICON.bellOff + '<span>' + esc(t('today.mutedBanner')) + '</span></div>';
      }
      html += '<section class="status-card" id="statusCard"></section>';
      // শেষ হয়ে যাওয়া ক্লাস তালিকায় আর থাকে না; সব শেষ হলে তালিকাই থাকে না
      const nm = nowMin();
      const left = info.classes.filter(function (c) { return S.toMin(c.end) > nm; });
      if (left.length) {
        html += '<div class="section-label">' + esc(t('today.remainingCount', { n: left.length })) + '</div>';
        html += '<div class="card-list">' + left.map(function (c, i) { return cardHtml(c, { live: true, index: i }); }).join('') + '</div>';
      } else {
        // সব ক্লাস শেষ: রাত ১২টা পর্যন্ত চলা বড় বালুঘড়ি (হোমপেজে লক করা)
        const des = S.settings.dayEndStyle || 'classic';
        const nextTxt = nextClassText();
        html += '<section class="day-end" id="dayEnd">' +
          (nextTxt ? '<div class="de-marquee" style="--mq:' + esc(S.settings.marqueeColor || '#DC2626') + '"><div class="mq-track" id="mqTrack"><span>' + esc(nextTxt) + '</span></div></div>' : '') +
          bigHourglassHtml(des, 'home') +
          '<div class="de-clock bh-' + des + '">' +
          '<span class="de-clock-label">' + esc(t('nowClock.label')) + '</span>' +
          '<div class="de-clock-row" id="deClock">' +
          ['h', 'm', 's'].map(function (u, i) {
            return (i ? '<span class="de-colon"><i></i><i></i></span>' : '') +
              '<span class="de-unit"><span class="de-pair">' + flipDigitHtml(u + '0') + flipDigitHtml(u + '1') + '</span>' +
              '<small>' + esc(t('dayEnd.' + u)) + '</small></span>';
          }).join('') + '<span class="de-ap" id="deAp"></span></div></div></section>';
      }
    }
    $('#view').innerHTML = html;
    tickNowClock();
    startMarquee();
    fitOneLine($('#view'));
    updateLive();
    fitDayEnd();
  }

  // বড় বালুঘড়িকে হোমপেজের বাকি ফাঁকা জায়গার মাপে বসানো
  function fitDayEnd() {
    const sec = $('#dayEnd');
    if (!sec) return;
    const svg = $('.big-hg svg', sec);
    const nav = $('#bottomNav');
    const top = sec.getBoundingClientRect().top + window.scrollY;
    const navH = nav ? nav.getBoundingClientRect().height : 70;
    const clock = $('.de-clock', sec);
    const mq = $('.de-marquee', sec);
    const below = (clock ? clock.getBoundingClientRect().height : 110) + (mq ? mq.getBoundingClientRect().height + 16 : 0);
    const avail = window.innerHeight - top - navH - below - 44;
    if (!sec.clientWidth) { setTimeout(fitDayEnd, 300); return; } // পেজ তখনও দেখা যাচ্ছে না
    const maxW = sec.clientWidth * 0.86;
    const h = Math.max(200, Math.min(avail, 440, maxW * 354 / 304));
    svg.style.height = Math.round(h) + 'px';
    svg.style.width = Math.round(h * 304 / 354) + 'px';
  }

  // ডিজিটাল কাউন্টডাউন: রাত ১২টা পর্যন্ত, প্রতি সেকেন্ডে; বালুঘড়িও একই সাথে এগোয়
  function tickDayEndClock() {
    const box = $('#deClock');
    if (!box) return false;
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    setClockTime(box, '', $('#deAp', box));
    const hg = $('#dayEnd .big-hg');
    if (hg && state.dayEndStart) {
      const p = Math.min(1, Math.max(0, (now.getTime() - state.dayEndStart) / Math.max(1, end - state.dayEndStart)));
      hg.style.setProperty('--top', (1 - p).toFixed(4));
      hg.style.setProperty('--bottom', (0.06 + p * 0.94).toFixed(4));
    }
    return true;
  }

  // ফ্লিপ ঘড়িতে এখনকার সময় বসানো (prefix: '' দিনশেষের ঘড়ি, 'n' উপরের ঘড়ি)
  function setClockTime(box, prefix, apEl) {
    const now = new Date();
    const h24 = now.getHours();
    const is12 = S.settings.timeFormat !== '24';
    const parts = { h: is12 ? (h24 % 12 || 12) : h24, m: now.getMinutes(), s: now.getSeconds() };
    ['h', 'm', 's'].forEach(function (u) {
      const v = String(parts[u]).padStart(2, '0');
      [0, 1].forEach(function (i) {
        const el = $('[data-u="' + prefix + u + i + '"]', box);
        if (el) setFlip(el, I.num(v[i]));
      });
    });
    if (apEl) {
      if (is12) {
        const f = I.formatTime(String(h24).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'), '12').split(' ');
        apEl.textContent = I.getLang() === 'bn' ? f[0] : f[f.length - 1];
      }
      apEl.hidden = !is12;
    }
  }

  // পরের ক্লাসের দিনের সব ক্লাসের পুরো তথ্য এক লাইনে (দিনশেষের স্ক্রল লেখার জন্য)
  function nextClassText() {
    const now = new Date();
    const periods = S.periods();
    for (let d = 1; d < 8; d++) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
      const dk = S.dayKeyOf(date);
      if (S.settings.holidays.indexOf(dk) !== -1) continue;
      const list = S.classesForDay(dk);
      if (!list.length) continue;
      const parts = date.getDate() + ' ' + (t('months')[date.getMonth()] || '');
      const dayTxt = d === 1 ? t('prep.tomorrow') + ' (' + I.dayName(dk) + ', ' + I.num(parts) + ')' : I.dayName(dk) + ', ' + I.num(parts);
      const out = [t('marquee.head', { day: dayTxt, n: I.num(list.length) })];
      list.forEach(function (c) {
        const pi = periods.findIndex(function (p) { return p.start === c.start; });
        const bits = [];
        if (pi !== -1) bits.push(t('marquee.period', { n: I.num(pi + 1) }));
        bits.push(fmtTime(c.start) + ' – ' + fmtTime(c.end));
        bits.push(L(c.subject) || t('form.untitled'));
        if (c.grade) bits.push(t('marquee.grade', { g: window.Localize.loc(c.grade, 'grade') }));
        if (c.section) bits.push(t('marquee.section', { s: L(c.section) }));
        if (c.room) bits.push(t('card.room') + ' ' + L(c.room));
        out.push(bits.join(', '));
      });
      return out.join('     ★     ');
    }
    return '';
  }

  // লেখার দৈর্ঘ্য অনুযায়ী গতি ঠিক রাখা (প্রতি সেকেন্ডে প্রায় ৬০ পিক্সেল)
  function startMarquee() {
    const tr = $('#mqTrack');
    if (!tr) return;
    const w = tr.scrollWidth;
    if (!w) { setTimeout(startMarquee, 300); return; }
    tr.style.animationDuration = Math.max(10, w / 70).toFixed(1) + 's';
    tr.classList.add('run');
  }

  // হোমপেজের উপরের ফ্লিপ ঘড়ি: এখনকার সময়, প্রতি সেকেন্ডে
  function tickNowClock() {
    const box = $('#nowClock');
    if (!box) return;
    const now = new Date();
    const h24 = now.getHours();
    const is12 = S.settings.timeFormat !== '24';
    const h = is12 ? (h24 % 12 || 12) : h24;
    const parts = { h: h, m: now.getMinutes(), s: now.getSeconds() };
    ['h', 'm', 's'].forEach(function (u) {
      const v = String(parts[u]).padStart(2, '0');
      [0, 1].forEach(function (i) {
        const el = $('[data-u="n' + u + i + '"]', box);
        if (el) setFlip(el, I.num(v[i]));
      });
    });
    const hm = String(h24).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const ap = $('#ncAp', box);
    if (is12) {
      const f = I.formatTime(hm, '12').split(' ');
      ap.textContent = I.getLang() === 'bn' ? f[0] : f[f.length - 1];
    }
    ap.hidden = !is12;
    const m = h24 * 60 + now.getMinutes();
    const live = todayInfo().classes.some(function (c) { return S.toMin(c.start) <= m && m < S.toMin(c.end); });
    box.classList.toggle('is-live', live);
    $('#ncLabel', box).textContent = live ? t('nowClock.live') : t('nowClock.label');
  }

  // দিনশেষের বালুঘড়ির বালি আর লেখা হালনাগাদ
  function updateDayEnd(info) {
    const sec = $('#dayEnd');
    if (!sec) return;
    const now = new Date();
    const lastEnd = info.classes.reduce(function (mx, c) { return Math.max(mx, S.toMin(c.end)); }, 0);
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, lastEnd).getTime();
    state.dayEndStart = start;
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
    const p = Math.min(1, Math.max(0, (now.getTime() - start) / Math.max(1, end - start)));
    const hg = $('.big-hg', sec);
    hg.style.setProperty('--top', (1 - p).toFixed(4));
    hg.style.setProperty('--bottom', (0.06 + p * 0.94).toFixed(4));
    hg.classList.toggle('is-done', p >= 1);
    tickDayEndClock();
  }

  /* পরের ক্লাসের প্রস্তুতি নোট: রুটিনের প্রতিটি সেকশনের জন্য একটি ঘর,
     সেকশনের পরের ক্লাস যেটা আগে, সেটা উপরে। */
  function nextClassOfSection(key, from) {
    const base = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const nm = from.getHours() * 60 + from.getMinutes();
    for (let d = 0; d < 8; d++) {
      const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d);
      const dk = S.dayKeyOf(date);
      if (S.settings.holidays.indexOf(dk) !== -1) continue;
      const list = S.classesForDay(dk).filter(function (c) {
        return S.sectionKey(c) === key && (d > 0 || S.toMin(c.start) > nm);
      });
      if (list.length) return { date: date, c: list[0], when: date.getTime() + S.toMin(list[0].start) * 60000 };
    }
    return null;
  }

  function prepSections() {
    const seen = {};
    const out = [];
    const now = new Date();
    S.data.classes.forEach(function (c) {
      const key = S.sectionKey(c);
      if (!key || seen[key]) return;
      seen[key] = true;
      const nx = nextClassOfSection(key, now);
      out.push({ key: key, label: S.sectionLabel(c), color: (nx ? nx.c.color : c.color), next: nx });
    });
    out.sort(function (a, b) {
      return (a.next ? a.next.when : Infinity) - (b.next ? b.next.when : Infinity) || S.collator().compare(a.label, b.label);
    });
    return out;
  }

  function prepPanelHtml(info) {
    if (!S.data.classes.length) return '';
    const secs = prepSections();
    if (!secs.length) return '';
    const todayIso = info.iso;
    let html = '<section class="prep-panel">' +
      '<div class="prep-head"><h2>' + ICON.edit + esc(t('prep.title')) + '</h2>' +
      '<p>' + esc(t('prep.help')) + '</p></div><div class="prep-list">';
    secs.forEach(function (sc) {
      const note = S.getNote(sc.key);
      let when = t('prep.noNext');
      if (sc.next) {
        const iso = S.isoDate(sc.next.date);
        const tomorrow = new Date(info.now.getFullYear(), info.now.getMonth(), info.now.getDate() + 1);
        const dayTxt = iso === todayIso ? t('prep.today') : (iso === S.isoDate(tomorrow) ? t('prep.tomorrow') : I.dayName(S.dayKeyOf(sc.next.date)));
        when = t('prep.next', { day: dayTxt, time: fmtTime(sc.next.c.start) });
      }
      html += '<button type="button" class="prep-item' + (note ? ' has-note' : '') + '" data-prep="' + esc(sc.key) + '" data-label="' + esc(sc.label) + '" style="' + colorVars(sc.color) + '">' +
        '<span class="prep-top"><span class="prep-sec">' + esc(sc.label) + '</span><span class="prep-when">' + esc(when) + '</span></span>' +
        '<span class="prep-note">' + (note ? esc(note) : '<i>' + esc(t('prep.empty')) + '</i>') + '</span>' +
        '</button>';
    });
    return html + '</div></section>';
  }

  function openPrepSheet(key, label) {
    const cur = S.getNote(key);
    const entry = openOverlay('sheet',
      '<div class="sheet-handle"></div><h2 class="sheet-title">' + esc(t('prep.sheetTitle', { section: label })) + '</h2>' +
      '<p class="sheet-sub">' + esc(t('prep.sheetSub')) + '</p>' +
      '<label class="field"><span class="field-label">' + esc(t('prep.field')) + '</span>' +
      '<textarea id="prepText" maxlength="400" rows="4" placeholder="' + esc(t('prep.placeholder')) + '"></textarea></label>' +
      '<div class="sheet-actions">' +
      (cur ? '<button type="button" class="btn btn-text danger-text" data-act="clear">' + esc(t('prep.clear')) + '</button><span class="flex-1"></span>' : '') +
      '<button type="button" class="btn btn-text" data-act="cancel">' + esc(t('common.cancel')) + '</button>' +
      '<button type="button" class="btn btn-primary" data-act="ok">' + esc(t('common.save')) + '</button></div>');
    const el = entry.el;
    const ta = $('#prepText', el);
    ta.value = cur;
    $('[data-act="cancel"]', el).onclick = function () { closeOverlay(entry, true); };
    $('[data-act="ok"]', el).onclick = function () {
      if (!S.setNote(key, ta.value)) { toast(t('settings.saveFail')); return; }
      closeOverlay(entry, true);
      toast(ta.value.trim() ? t('prep.saved') : t('prep.cleared'));
      if (state.view === 'today') renderToday();
    };
    const clr = $('[data-act="clear"]', el);
    if (clr) clr.onclick = async function () {
      const ok = await confirmDialog({ title: t('prep.clearTitle'), message: t('prep.clearText', { section: label }), okText: t('prep.clearOk'), danger: true });
      if (!ok) return;
      S.setNote(key, '');
      closeOverlay(entry, true);
      toast(t('prep.cleared'));
      if (state.view === 'today') renderToday();
    };
  }

  // প্রতি কয়েক সেকেন্ডে চলমান ক্লাস আর কাউন্টডাউন হালনাগাদ
  function updateLive() {
    if (state.view !== 'today') return;
    const info = todayInfo();
    if (info.iso !== state.renderedDay) { renderToday(); return; }
    const card = $('#statusCard');
    if (!card) return;
    updateDayEnd(info);
    const m = nowMin();
    let current = null;
    let next = null;
    info.classes.forEach(function (c) {
      const s = S.toMin(c.start);
      const e = S.toMin(c.end);
      if (s <= m && m < e && !current) current = c;
      if (s > m && !next) next = c;
    });

    // কোনো ক্লাস শেষ হলে তার কার্ড সরে যায় আর তালিকা নতুন করে আঁকা হয়
    let ended = false;
    $$('.class-card').forEach(function (el) {
      const c = S.getClass(el.getAttribute('data-id'));
      if (c && $('.card-progress', el) && m >= S.toMin(c.end)) {
        ended = true;
        el.classList.add('is-leaving');
      }
    });
    if (ended && !state.leaving) {
      state.leaving = true;
      setTimeout(function () { state.leaving = false; if (state.view === 'today') renderToday(); }, 450);
    }

    $$('.class-card').forEach(function (el) {
      const c = S.getClass(el.getAttribute('data-id'));
      if (!c) return;
      const s = S.toMin(c.start);
      const e = S.toMin(c.end);
      const isNow = current && current.id === c.id;
      const wasNow = el.classList.contains('is-now');
      el.classList.toggle('is-now', !!isNow);
      // নতুন ক্লাস শুরু হলে সেই কার্ডটা স্ক্রিনে এনে দেখানো
      if (isNow && !wasNow && !document.body.classList.contains('kb-open')) {
        setTimeout(function () { el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 300);
      }
      el.classList.toggle('is-past', m >= e);
      const badge = $('.live-badge', el);
      const prog = $('.card-progress', el);
      if (badge) badge.hidden = !isNow;
      if (prog) {
        prog.hidden = !isNow;
        if (isNow) $('span', prog).style.width = Math.min(100, Math.max(0, ((m - s) / (e - s)) * 100)).toFixed(1) + '%';
      }
      if (isNow) setTimeout(tickCardTimer, 0);
      const hg = $('.hourglass', el);
      if (hg && isNow) {
        // বালুঘড়ি দুই সময়ের লেখার মাঝ বরাবর থাকবে
        const tw = Math.max($('.t-start', el).offsetWidth, $('.t-end', el).offsetWidth);
        if (tw) hg.style.width = tw + 'px';
        else if (!state.hgRetry) {
          // পেজ তখনও দেখা যাচ্ছে না, একটু পরে আবার মাপা হবে
          state.hgRetry = true;
          setTimeout(function () { state.hgRetry = false; updateLive(); }, 400);
        }
        const p = Math.min(1, Math.max(0, (m - s) / (e - s)));
        hg.style.setProperty('--top', (1 - p).toFixed(3));
        hg.style.setProperty('--bottom', (0.12 + p * 0.88).toFixed(3));
      }
    });

    let html = '';
    if (current) {
      const left = Math.ceil(S.toMin(current.end) - m);
      html += '<div class="status-row status-now" style="' + colorVars(current.color) + '">' +
        '<span class="pulse"></span><div><small>' + esc(t('today.runningNow')) + '</small>' +
        '<strong>' + esc(L(current.subject) || t('form.untitled')) + '</strong>' +
        '<span>' + esc(t('today.endsIn', { d: I.duration(left) })) + '</span></div></div>';
    }
    if (next) {
      const wait = Math.ceil(S.toMin(next.start) - m);
      const where = [classSec(next), next.room ? t('card.room') + ' ' + L(next.room) : ''].filter(Boolean).join(' · ');
      html += '<div class="status-row status-next">' +
        '<div class="countdown"><b>' + esc(I.num(wait >= 60 ? Math.floor(wait / 60) : wait)) + '</b><small>' + esc(wait >= 60 ? t('today.hourShort') : t('today.minShort')) + '</small></div>' +
        '<div><small>' + esc(t('today.nextClass')) + '</small><strong>' + esc(L(next.subject) || t('form.untitled')) + '</strong>' +
        '<span>' + esc(t('today.startsIn', { d: I.duration(wait) })) + (where ? ' · ' + esc(where) : '') + '</span></div></div>';
    }
    if (!current && !next) {
      html += '<div class="status-row status-done"><div class="done-icon">' + ICON.check + '</div><div><strong>' + esc(t('today.allDone')) + '</strong><span>' + esc(t('today.allDoneText')) + '</span></div></div>';
    }
    card.innerHTML = html;
  }

  /* ---------------- সপ্তাহ (Week) ---------------- */

  function renderWeek() {
    const mode = S.settings.weekMode;
    setTop(t('week.title'), t('week.sub', { n: S.data.classes.length }),
      '<button type="button" class="icon-btn" data-action="edit-periods" aria-label="' + esc(t('period.edit')) + '">' + ICON.periods + '</button>' +
      (S.data.classes.length ? '<button type="button" class="icon-btn" data-action="save-pdf" aria-label="' + esc(t('settings.savePdf')) + '">' + ICON.pdf + '</button>' : '') +
      '<div class="seg seg-icons">' +
      '<button type="button" class="' + (mode === 'list' ? 'on' : '') + '" data-action="week-mode" data-mode="list" aria-label="' + esc(t('week.listView')) + '">' + ICON.list + '</button>' +
      '<button type="button" class="' + (mode === 'grid' ? 'on' : '') + '" data-action="week-mode" data-mode="grid" aria-label="' + esc(t('week.gridView')) + '">' + ICON.grid + '</button>' +
      '<button type="button" class="' + (mode === 'glance' ? 'on' : '') + '" data-action="week-mode" data-mode="glance" aria-label="' + esc(t('week.glanceView')) + '">' + ICON.glance + '</button>' +
      '</div>');

    let html = '<div class="search-box">' + ICON.search +
      '<input type="search" id="weekSearch" autocomplete="off" placeholder="' + esc(t('week.searchPh')) + '" value="' + esc(state.search) + '"/></div>';
    html += '<div id="weekBody"></div>';
    $('#view').innerHTML = html;
    const input = $('#weekSearch');
    input.addEventListener('input', function () {
      state.search = input.value;
      renderWeekBody();
    });
    renderWeekBody();
  }

  function renderWeekBody() {
    destroySortables();
    const body = $('#weekBody');
    if (!body) return;
    const q = state.search.trim();
    const total = S.data.classes.length;
    if (!total) {
      body.innerHTML = emptyHtml('empty', t('week.emptyTitle'), t('week.emptyText'), { action: 'add', label: t('today.addBtn') });
      return;
    }
    if (S.settings.weekMode === 'grid') {
      body.innerHTML = weekGridHtml(q);
      return;
    }
    if (S.settings.weekMode === 'glance') {
      body.innerHTML = weekGlanceHtml(q);
      fitGlance();
      return;
    }
    let html = '';
    let shown = 0;
    S.DAYS.forEach(function (d) {
      const holiday = S.settings.holidays.indexOf(d) !== -1;
      const list = S.classesForDay(d).filter(function (c) { return S.matches(c, q); });
      shown += list.length;
      if (q && !list.length) return;
      html += '<section class="day-section' + (holiday ? ' is-holiday' : '') + '">' +
        '<header class="day-head"><div><h2>' + esc(I.dayName(d)) + '</h2>' +
        '<span>' + esc(holiday ? t('week.holiday') : t('week.count', { n: list.length })) + '</span></div>' +
        '<button type="button" class="icon-btn small" data-action="add" data-day="' + d + '" aria-label="' + esc(t('week.addTo', { day: I.dayName(d) })) + '">' + ICON.plus + '</button></header>' +
        '<div class="day-list" data-day="' + d + '">' +
        list.map(function (c) { return cardHtml(c, { drag: !q }); }).join('') +
        '</div>' +
        (!list.length ? '<p class="day-empty">' + esc(holiday ? t('week.holiday') : t('week.noClassDrop')) + '</p>' : '') +
        '</section>';
    });
    if (q && !shown) {
      html = emptyHtml('search', t('week.noResultTitle'), t('week.noResultText'));
    } else if (!q) {
      html += '<p class="hint">' + esc(t('week.dragHint')) + '</p>';
    }
    body.innerHTML = html;
    if (!q && window.Sortable) setupSortable();
  }

  function setupSortable() {
    $$('.day-list').forEach(function (el) {
      const s = window.Sortable.create(el, {
        group: 'week',
        handle: '.drag-handle',
        animation: 180,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        dragClass: 'drag-active',
        forceFallback: true,
        fallbackOnBody: true,
        scroll: true,
        bubbleScroll: true,
        onEnd: function (ev) {
          const id = ev.item.getAttribute('data-id');
          const from = ev.from.getAttribute('data-day');
          const to = ev.to.getAttribute('data-day');
          if (from === to) {
            if (ev.oldIndex === ev.newIndex) return;
            const ids = $$('.class-card', ev.to).map(function (n) { return n.getAttribute('data-id'); });
            S.reorderDay(to, ids);
            toast(t('week.reordered'));
          } else {
            const c = S.getClass(id);
            S.moveToDay(id, to);
            const clash = c && S.findOverlap(to, c.start, c.end, id);
            toast(clash ? t('week.movedClash', { day: I.dayName(to) }) : t('week.moved', { day: I.dayName(to) }));
          }
          N.reschedule();
          setTimeout(renderWeekBody, 30);
        }
      });
      state.sortables.push(s);
    });
  }

  function weekGridHtml(q) {
    const rows = S.DAYS.map(function (d) {
      return { day: d, holiday: S.settings.holidays.indexOf(d) !== -1, list: S.classesForDay(d).filter(function (c) { return S.matches(c, q); }) };
    }).filter(function (r) { return !q || r.list.length; });
    if (!rows.length) return emptyHtml('search', t('week.noResultTitle'), t('week.noResultText'));
    // কলাম = সপ্তাহের সব আলাদা শুরুর সময়, যাতে একই পিরিয়ড একই কলামে থাকে
    const slots = S.mergedSlots(rows.map(function (r) { return r.list; }));
    let html = '<div class="grid-scroll"><table class="week-grid"><thead><tr><th>' + esc(t('week.day')) + '</th>';
    slots.forEach(function (sl, i) {
      html += '<th>' + esc(t('week.period', { n: i + 1 })) + '<small>' + esc(fmtTime(sl.start)) + '</small></th>';
    });
    if (!slots.length) html += '<th></th>';
    html += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr class="' + (r.holiday ? 'is-holiday' : '') + '"><th>' + esc(I.dayShort(r.day)) + '</th>';
      (slots.length ? slots : [{ start: null }]).forEach(function (sl, i) {
        const here = r.list.filter(function (c) { return c.start === sl.start; });
        if (!here.length) {
          if (sl.start && !r.holiday && !q) {
            // খালি ঘরে চাপলে ওই দিন আর পিরিয়ডের সময় বসানো অবস্থায় নতুন ক্লাস
            html += '<td class="empty-cell"><button type="button" class="grid-add" data-action="add" data-day="' + r.day + '" data-start="' + sl.start + '" data-end="' + sl.end + '" aria-label="' + esc(t('week.addHere')) + '">' + ICON.plus + '</button></td>';
            return;
          }
          html += '<td class="empty-cell">' + (i === 0 && r.holiday && !r.list.length ? esc(t('week.holiday')) : '') + '</td>';
          return;
        }
        html += '<td>' + here.map(function (c) {
          return '<button type="button" class="grid-cell" data-id="' + esc(c.id) + '" style="' + colorVars(c.color) + '">' +
            '<b>' + esc(L(c.subject) || t('form.untitled')) + '</b>' +
            '<span>' + esc(classSec(c)) + '</span>' +
            (c.room ? '<span>' + esc(t('card.room') + ' ' + L(c.room)) + '</span>' : '') +
            '</button>';
        }).join('') + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div><p class="hint">' + esc(t('week.gridHint')) + '</p>';
    return html;
  }

  /* পুরো সপ্তাহ এক পর্দায়: পাশে সরাতে হয় না, ছোট ঘরে শুধু শ্রেণি আর শাখার সংক্ষেপ */
  const ROMAN = { one: 'I', two: 'II', three: 'III', four: 'IV', five: 'V', six: 'VI', seven: 'VII', eight: 'VIII', nine: 'IX', ten: 'X', eleven: 'XI', twelve: 'XII', first: '1st', second: '2nd' };
  function shortGrade(c) {
    const g = window.Localize.loc(c.grade, 'grade');
    if (I.getLang() === 'bn') return g;
    return g.split(/\s+/).map(function (w) { return ROMAN[w.toLowerCase()] || w; }).join(' ');
  }
  // শাখা দুই ভাগে: বিভাগ (মানবিক / Arts) আর নম্বর (১ / 1)
  const GROUP_EN = { h: 'Arts', s: 'Science', b: 'Business', c: 'Business' };
  function sectionParts(c) {
    const txt = L(c.section).trim();
    if (I.getLang() === 'bn') {
      const m = /^(.*?)\s*-\s*([0-9০-৯]{1,2})$/.exec(txt);
      return m ? [m[1], m[2]] : [txt, ''];
    }
    const m = /^([HSBC])\s*-?\s*(\d{1,2})$/i.exec(txt);
    if (m) return [GROUP_EN[m[1].toLowerCase()], m[2]];
    const m2 = /^(.*?)\s*-\s*(\d{1,2})$/.exec(txt);
    return m2 ? [m2[1], m2[2]] : [txt, ''];
  }


  // এক নজরের রুটিন নিচের নেভিগেশন পর্যন্ত পুরো জায়গা জুড়ে বসে
  function fitGlance() {
    const box = $('.glance');
    if (!box) return;
    const nav = $('#bottomNav');
    const bottom = nav ? nav.getBoundingClientRect().top : window.innerHeight;
    const top = box.getBoundingClientRect().top;
    const head = box.querySelector('thead').offsetHeight;
    const total = box.querySelector('.glance-total').offsetHeight;
    const rows = $$('.glance-grid tbody tr', box);
    const off = rows.filter(function (r) { return !!r.querySelector('.g-off'); }).length;
    const work = rows.length - off;
    if (!work) return;
    const avail = bottom - top - head - total - 34 - off * 34 - rows.length * 4;
    const h = Math.max(64, Math.min(130, Math.floor(avail / work)));
    box.style.setProperty('--gh', h + 'px');
  }
  window.addEventListener('resize', function () { if (state.view === 'week') fitGlance(); });

  function weekGlanceHtml(q) {
    const rows = S.DAYS.map(function (d) {
      return { day: d, holiday: S.settings.holidays.indexOf(d) !== -1, list: S.classesForDay(d).filter(function (c) { return S.matches(c, q); }) };
    }).filter(function (r) { return !q || r.list.length; });
    if (!rows.length) return emptyHtml('search', t('week.noResultTitle'), t('week.noResultText'));
    const slots = S.mergedSlots(rows.map(function (r) { return r.list; }));
    const subjects = {};
    S.data.classes.forEach(function (c) { subjects[(c.subject || '').trim().toLowerCase()] = 1; });
    const manySubjects = Object.keys(subjects).length > 1;
    let html = '<div class="glance"><table class="glance-grid"><thead><tr><th class="g-day"></th>';
    slots.forEach(function (sl, i) {
      html += '<th><b>' + esc(I.num(i + 1)) + '</b><small>' + esc(I.num(((+sl.start.slice(0, 2) % 12) || 12) + ':' + sl.start.slice(3, 5))) + '</small></th>';
    });
    html += '</tr></thead><tbody>';
    let total = 0;
    rows.forEach(function (r) {
      total += r.list.length;
      html += '<tr class="' + (r.holiday ? 'is-holiday' : '') + '"><th class="g-day">' + esc(I.dayShort(r.day)) + '</th>';
      if (r.holiday && !r.list.length) {
        html += '<td class="g-off" colspan="' + Math.max(1, slots.length) + '">' + esc(t('week.holiday')) + '</td></tr>';
        return;
      }
      slots.forEach(function (sl) {
        const here = r.list.filter(function (c) { return c.start === sl.start; });
        if (!here.length) { html += '<td class="g-empty"></td>'; return; }
        html += '<td>' + here.map(function (c) {
          return '<button type="button" class="grid-cell g-cell' + (I.getLang() === 'bn' ? '' : ' en') + '" data-id="' + esc(c.id) + '" style="' + colorVars(c.color) + '">' +
            (manySubjects ? '<i>' + esc((L(c.subject) || '').slice(0, 6)) + '</i>' : '') +
            '<b>' + esc(shortGrade(c)) + '</b>' + sectionParts(c).filter(Boolean).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('') + '</button>';
        }).join('') + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table><p class="glance-total">' + esc(t('week.glanceTotal', { n: I.num(total) })) + '</p></div>';
    return html;
  }

  /* ---------------- হাজিরা ----------------
     লাইভ ক্লাসের কার্ডে "হাজিরা নিন" বোতাম। ক্লাস শেষ হলে খোলা হাজিরার পাতা নিজে থেকে বন্ধ হয়।
     শিক্ষার্থীর তালিকা শ্রেণি-শাখা অনুযায়ী (যেমন দ্বাদশ মানবিক-২ এর সব ক্লাসে একই তালিকা)। */

  function groupLabel(key) {
    const g = S.classGroups().filter(function (x) { return x.key === key; })[0];
    return g && g.sample ? classSec(g.sample) : key;
  }

  function attCounts(rec) {
    const out = { P: 0, A: 0, L: 0 };
    if (!rec) return out;
    S.studentsOf(rec.group).forEach(function (st) { const m = rec.marks[st.id]; if (out[m] !== undefined) out[m]++; });
    return out;
  }

  function attButtonHtml(c) {
    const rec = S.getAttendance(S.isoDate(new Date()), c.id);
    const n = attCounts(rec);
    const taken = rec && S.studentsOf(rec.group).length;
    return '<button type="button" class="att-btn" data-action="attendance" data-id="' + esc(c.id) + '">' +
      '<span class="att-btn-ic">' + ICON.check + '</span>' +
      '<span class="att-btn-tx"><b>' + esc(taken ? t('att.btnTaken') : t('att.btn')) + '</b><small>' + esc(taken ? t('att.btnSub', { p: I.num(n.P + n.L), n: I.num(n.P + n.A + n.L) }) : t('att.btnHint')) + '</small></span>' +
      (taken ? '<span class="att-btn-ct"><i class="p">' + I.num(n.P) + '</i><i class="a">' + I.num(n.A) + '</i><i class="l">' + I.num(n.L) + '</i></span>' : '<span class="att-btn-go">›</span>') + '</button>';
  }

  function isLiveNow(c) {
    const info = todayInfo();
    if (info.holiday && !info.classes.length) return false;
    const m = nowMin();
    return info.classes.some(function (x) { return x.id === c.id; }) && S.toMin(c.start) <= m && m < S.toMin(c.end);
  }

  function monthLabel(ym) {
    const p = ym.split('-');
    const months = t('months');
    return (Array.isArray(months) ? months[+p[1] - 1] : p[1]) + ' ' + I.num(p[0]);
  }

  // উপরের হিসাব: উপস্থিত, অনুপস্থিত, দেরি, আর উপস্থিতির হার
  function statsHtml(n, total) {
    const pct = total ? Math.round((n.P + n.L) * 100 / total) : 0;
    return '<div class="att-stats">' +
      '<div class="st p"><b>' + I.num(n.P) + '</b><span>' + esc(t('att.markP')) + '</span></div>' +
      '<div class="st a"><b>' + I.num(n.A) + '</b><span>' + esc(t('att.markA')) + '</span></div>' +
      '<div class="st l"><b>' + I.num(n.L) + '</b><span>' + esc(t('att.markL')) + '</span></div>' +
      '<div class="st t"><b>' + I.num(pct) + '%</b><span>' + esc(t('att.total', { n: I.num(total) })) + '</span></div>' +
      '<div class="att-bar"><i class="p" style="width:' + (total ? n.P * 100 / total : 0) + '%"></i><i class="l" style="width:' + (total ? n.L * 100 / total : 0) + '%"></i><i class="a" style="width:' + (total ? n.A * 100 / total : 0) + '%"></i></div></div>';
  }

  function studentRowsHtml(group, rec) {
    const list = S.studentsOf(group);
    if (!list.length) return '<p class="att-empty">' + esc(t('att.noStudents')) + '</p>';
    return list.map(function (st) {
      const m = rec ? rec.marks[st.id] || '' : '';
      return '<div class="att-row" data-sid="' + esc(st.id) + '">' +
        '<span class="att-roll">' + esc(I.num(st.roll || '–')) + '</span>' +
        '<button type="button" class="att-name" data-edit="' + esc(st.id) + '"><b>' + esc(st.name || '–') + '</b>' +
        (st.sid ? '<small>' + esc(t('att.colId')) + ': ' + esc(I.num(st.sid)) + '</small>' : '') + '</button>' +
        (rec ? '<div class="att-marks">' + ['P', 'A', 'L'].map(function (k) {
          return '<button type="button" class="m-' + k.toLowerCase() + (m === k ? ' on' : '') + '" data-mark="' + k + '" aria-label="' + esc(t('att.mark' + k)) + '">' + k + '</button>';
        }).join('') + '</div>' : '<span class="att-edit-ic">' + ICON.edit + '</span>') +
        '</div>';
    }).join('');
  }

  function exportRowHtml(ym) {
    return '<div class="att-export"><div class="att-export-head"><span>' + esc(t('att.register')) + '</span>' +
      '<div class="att-month"><button type="button" data-att="prevMonth" aria-label="‹">‹</button><b>' + esc(monthLabel(ym)) + '</b><button type="button" data-att="nextMonth" aria-label="›">›</button></div></div>' +
      '<div class="att-export-btns"><button type="button" class="xl" data-att="xlsx"><i>XLS</i><span>' + esc(t('att.excel')) + '</span></button>' +
      '<button type="button" class="pd" data-att="pdf"><i>PDF</i><span>' + esc(t('att.pdf')) + '</span></button></div></div>';
  }

  function shiftYm(ym, d) {
    const p = ym.split('-');
    const dt = new Date(+p[0], +p[1] - 1 + d, 1);
    return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
  }

  async function exportAttendance(group, ym, kind) {
    const recs = S.attendanceFor(group, ym);
    if (!S.studentsOf(group).length) { toast(t('att.noStudentsShort')); return; }
    if (!recs.length) { toast(t('att.noRecords', { month: monthLabel(ym) })); return; }
    const sample = S.classGroups().filter(function (x) { return x.key === group; })[0];
    const info = { group: group, label: groupLabel(group), subject: sample && sample.sample ? L(sample.sample.subject) : '', month: ym, monthLabel: monthLabel(ym) };
    await runExport(function () { return kind === 'xlsx' ? E.saveAttendanceXlsx(info) : E.saveAttendancePdf(info); }, t('att.sheetTitle'));
  }

  // হাজিরার পাতা (লাইভ ক্লাস থেকে)
  function openAttendanceSheet(classId) {
    const c = S.getClass(classId);
    if (!c) return;
    if (!isLiveNow(c)) { toast(t('att.notLive')); return; }
    const iso = S.isoDate(new Date());
    const group = S.sectionKey(c);
    let ym = iso.slice(0, 7);
    S.openAttendance(iso, c);
    const entry = openOverlay('sheet', '<div class="att-sheet"></div>', function () { state.att = null; if (state.view === 'today') renderToday(); });
    entry.el.classList.add('overlay-att');
    state.att = { entry: entry, classId: c.id, iso: iso };
    const box = $('.att-sheet', entry.el);
    function draw() {
      const rec = S.getAttendance(iso, c.id) || S.openAttendance(iso, c);
      const n = attCounts(rec);
      const total = S.studentsOf(group).length;
      const sc = box.querySelector('.att-list') ? box.querySelector('.att-list').scrollTop : 0;
      box.innerHTML = '<div class="sheet-handle"></div>' +
        '<div class="att-hero" style="' + colorVars(c.color) + '">' +
        '<div class="att-hero-top"><span class="att-live"><i></i>' + esc(t('today.now')) + '</span><span class="att-date">' + esc(I.formatDate ? I.formatDate(new Date()) : iso) + '</span></div>' +
        '<h2>' + esc(classSec(c) || L(c.subject)) + '</h2>' +
        '<p>' + esc([L(c.subject), fmtTime(c.start) + ' – ' + fmtTime(c.end), c.room ? t('card.room') + ' ' + L(c.room) : ''].filter(Boolean).join('  ·  ')) + '</p></div>' +
        statsHtml(n, total) +
        '<div class="att-tools">' +
        (total ? '<button type="button" class="att-tool" data-att="allP">' + ICON.check + '<span>' + esc(t('att.allP')) + '</span></button>' : '') +
        '<button type="button" class="att-tool" data-att="add">' + ICON.plus + '<span>' + esc(t('att.addStudent')) + '</span></button>' +
        '<button type="button" class="att-tool" data-att="bulk">' + ICON.list + '<span>' + esc(t('att.bulk')) + '</span></button></div>' +
        (total ? '<div class="att-listhead"><span>' + esc(t('att.colRoll')) + '</span><span>' + esc(t('att.colName')) + '</span><span>' + esc(t('att.marksHead')) + '</span></div>' : '') +
        '<div class="att-list">' + studentRowsHtml(group, rec) + '</div>' +
        exportRowHtml(ym) +
        '<p class="att-note">' + esc(t('att.autoClose')) + '</p>' +
        '<div class="sheet-actions"><button type="button" class="btn btn-primary btn-block" data-att="done">' + ICON.check + esc(t('att.done')) + '</button></div>';
      const list = box.querySelector('.att-list');
      if (list) list.scrollTop = sc;
    }
    draw();
    box.addEventListener('click', async function (e) {
      const mk = e.target.closest('[data-mark]');
      if (mk) {
        const sid = mk.closest('.att-row').getAttribute('data-sid');
        S.setMark(iso, c.id, sid, mk.getAttribute('data-mark'));
        $$('[data-mark]', mk.parentNode).forEach(function (b) { b.classList.toggle('on', b === mk); });
        const old = $('.att-stats', box);
        old.outerHTML = statsHtml(attCounts(S.getAttendance(iso, c.id)), S.studentsOf(group).length);
        return;
      }
      const ed = e.target.closest('[data-edit]');
      if (ed) { openStudentForm(group, ed.getAttribute('data-edit'), function () { S.openAttendance(iso, c); draw(); }); return; }
      const b = e.target.closest('[data-att]');
      if (!b) return;
      const act = b.getAttribute('data-att');
      if (act === 'done') { closeOverlay(entry); toast(t('att.saved')); }
      else if (act === 'allP') { S.setAllMarks(iso, c.id, 'P'); draw(); }
      else if (act === 'add') openStudentForm(group, null, function () { S.openAttendance(iso, c); draw(); });
      else if (act === 'bulk') openBulkStudents(group, function () { S.openAttendance(iso, c); draw(); });
      else if (act === 'prevMonth' || act === 'nextMonth') { ym = shiftYm(ym, act === 'prevMonth' ? -1 : 1); draw(); }
      else if (act === 'xlsx' || act === 'pdf') exportAttendance(group, ym, act);
    });
  }

  // ক্লাস শেষ হলে খোলা হাজিরার পাতা বন্ধ
  function checkAttendanceSheet() {
    if (!state.att) return;
    const c = S.getClass(state.att.classId);
    if (c && S.isoDate(new Date()) === state.att.iso && isLiveNow(c)) return;
    // উপরে শিক্ষার্থী যোগের ফর্ম খোলা থাকলে সেগুলোও বন্ধ
    state.overlays.slice().reverse().forEach(function (o) { if (o !== state.att.entry && o.el.classList.contains('overlay-student')) closeOverlay(o, true); });
    closeOverlay(state.att.entry);
    toast(t('att.endedClosed'));
  }

  // শিক্ষার্থী যোগ বা সম্পাদনা
  function openStudentForm(group, id, onDone) {
    const cur = id ? S.studentsOf(group).filter(function (x) { return x.id === id; })[0] : null;
    const entry = openOverlay('sheet',
      '<div class="sheet-handle"></div><h2 class="sheet-title">' + esc(cur ? t('att.editStudent') : t('att.addStudent')) + '</h2>' +
      '<p class="sheet-sub">' + esc(groupLabel(group)) + '</p>' +
      '<div class="att-form">' +
      '<label class="field"><span class="field-label">' + esc(t('att.colId')) + '</span><input id="stSid" maxlength="30" autocomplete="off"/></label>' +
      '<label class="field"><span class="field-label">' + esc(t('att.colRoll')) + '</span><input id="stRoll" maxlength="20" inputmode="numeric" autocomplete="off"/></label>' +
      '<label class="field att-form-name"><span class="field-label">' + esc(t('att.colName')) + '</span><input id="stName" maxlength="80" autocomplete="off"/></label></div>' +
      '<div class="sheet-actions">' +
      (cur ? '<button type="button" class="btn btn-text danger-text" data-act="del">' + esc(t('att.delete')) + '</button><span class="flex-1"></span>' : '') +
      '<button type="button" class="btn btn-text" data-act="cancel">' + esc(t('common.cancel')) + '</button>' +
      (cur ? '' : '<button type="button" class="btn btn-tonal" data-act="more">' + esc(t('att.saveMore')) + '</button>') +
      '<button type="button" class="btn btn-primary" data-act="ok">' + esc(t('common.save')) + '</button></div>');
    entry.el.classList.add('overlay-student');
    const el = entry.el;
    const f = { sid: $('#stSid', el), roll: $('#stRoll', el), name: $('#stName', el) };
    if (cur) { f.sid.value = cur.sid; f.roll.value = cur.roll; f.name.value = cur.name; }
    setTimeout(function () { (cur ? f.name : f.roll).focus(); }, 250);
    function save(more) {
      const st = { id: cur ? cur.id : undefined, sid: I.toAsciiDigits(f.sid.value.trim()), roll: I.toAsciiDigits(f.roll.value.trim()), name: f.name.value.trim() };
      if (!st.name && !st.roll) { toast(t('att.needName')); f.name.focus(); return; }
      if (!S.saveStudent(group, st)) { toast(t('settings.saveFail')); return; }
      if (onDone) onDone();
      if (more) {
        toast(t('att.addedOne', { name: st.name || st.roll }));
        f.sid.value = ''; f.name.value = '';
        const r = parseInt(st.roll, 10);
        f.roll.value = isNaN(r) ? '' : String(r + 1);
        f.name.focus();
        return;
      }
      closeOverlay(entry, true);
    }
    $('[data-act="cancel"]', el).onclick = function () { closeOverlay(entry, true); };
    $('[data-act="ok"]', el).onclick = function () { save(false); };
    const more = $('[data-act="more"]', el);
    if (more) more.onclick = function () { save(true); };
    const del = $('[data-act="del"]', el);
    if (del) del.onclick = async function () {
      const ok = await confirmDialog({ title: t('att.delTitle'), message: t('att.delText', { name: cur.name || cur.roll }), okText: t('att.delete'), danger: true });
      if (!ok) return;
      S.deleteStudent(group, cur.id);
      closeOverlay(entry, true);
      if (onDone) onDone();
      toast(t('att.deleted'));
    };
  }

  // একসাথে অনেক শিক্ষার্থী: প্রতি লাইনে "আইডি, রোল, নাম" (বা শুধু "রোল, নাম")
  function openBulkStudents(group, onDone) {
    const entry = openOverlay('sheet',
      '<div class="sheet-handle"></div><h2 class="sheet-title">' + esc(t('att.bulk')) + '</h2>' +
      '<p class="sheet-sub">' + esc(groupLabel(group)) + '</p>' +
      '<p class="group-help">' + esc(t('att.bulkHelp')) + '</p>' +
      '<label class="field"><textarea id="bulkText" rows="8" placeholder="' + esc(t('att.bulkPh')) + '"></textarea></label>' +
      '<div class="sheet-actions"><button type="button" class="btn btn-text" data-act="cancel">' + esc(t('common.cancel')) + '</button>' +
      '<button type="button" class="btn btn-primary" data-act="ok">' + esc(t('att.bulkAdd')) + '</button></div>');
    entry.el.classList.add('overlay-student');
    const el = entry.el;
    $('[data-act="cancel"]', el).onclick = function () { closeOverlay(entry, true); };
    $('[data-act="ok"]', el).onclick = function () {
      const rows = $('#bulkText', el).value.split(/\n/).map(function (line) {
        const parts = line.split(/\t|,|;|\|/).map(function (x) { return x.trim(); }).filter(function (x, i, a) { return x || i < a.length - 1; });
        if (!parts.length || !parts.join('')) return null;
        if (parts.length >= 3) return { sid: I.toAsciiDigits(parts[0]), roll: I.toAsciiDigits(parts[1]), name: parts.slice(2).join(', ') };
        if (parts.length === 2) return { roll: I.toAsciiDigits(parts[0]), name: parts[1] };
        return { name: parts[0] };
      }).filter(Boolean);
      if (!rows.length) { toast(t('att.bulkEmpty')); return; }
      const n = S.addStudents(group, rows);
      if (n < 0) { toast(t('settings.saveFail')); return; }
      closeOverlay(entry, true);
      if (onDone) onDone();
      toast(t('att.bulkDone', { n: I.num(n) }));
    };
  }

  // সেটিংস থেকে: সব শ্রেণি-শাখার তালিকা, শিক্ষার্থী সম্পাদনা আর খাতা সংরক্ষণ
  function openStudentsHub() {
    const entry = openOverlay('sheet', '<div class="att-sheet"></div>');
    const box = $('.att-sheet', entry.el);
    function draw() {
      const groups = S.classGroups();
      box.innerHTML = '<div class="sheet-handle"></div><h2 class="sheet-title">' + esc(t('att.hubTitle')) + '</h2>' +
        '<p class="sheet-sub">' + esc(t('att.hubSub')) + '</p>' +
        (groups.length ? '<div class="att-groups">' + groups.map(function (g) {
          const n = S.studentsOf(g.key).length;
          const r = S.attendanceFor(g.key).length;
          return '<button type="button" class="att-group" data-group="' + esc(g.key) + '"' + (g.sample ? ' style="' + colorVars(g.sample.color) + '"' : '') + '>' +
            '<b>' + esc(groupLabel(g.key)) + '</b><span>' + esc(t('att.groupLine', { n: I.num(n), r: I.num(r) })) + '</span></button>';
        }).join('') + '</div>' : '<p class="att-empty">' + esc(t('att.noGroups')) + '</p>') +
        '<div class="sheet-actions"><button type="button" class="btn btn-primary" data-act="close">' + esc(t('common.ok')) + '</button></div>';
    }
    draw();
    box.addEventListener('click', function (e) {
      if (e.target.closest('[data-act="close"]')) { closeOverlay(entry, true); return; }
      const g = e.target.closest('[data-group]');
      if (g) openGroupSheet(g.getAttribute('data-group'), draw);
    });
  }

  function openGroupSheet(group, onBack) {
    let ym = S.isoDate(new Date()).slice(0, 7);
    const entry = openOverlay('sheet', '<div class="att-sheet"></div>', onBack);
    entry.el.classList.add('overlay-student');
    const box = $('.att-sheet', entry.el);
    function draw() {
      const total = S.studentsOf(group).length;
      box.innerHTML = '<div class="sheet-handle"></div><h2 class="sheet-title">' + esc(groupLabel(group)) + '</h2>' +
        '<p class="sheet-sub">' + esc(t('att.total', { n: I.num(total) })) + ' · ' + esc(t('att.liveOnly')) + '</p>' +
        '<div class="att-tools"><button type="button" class="att-tool" data-att="add">' + ICON.plus + '<span>' + esc(t('att.addStudent')) + '</span></button>' +
        '<button type="button" class="att-tool" data-att="bulk">' + ICON.list + '<span>' + esc(t('att.bulk')) + '</span></button></div>' +
        '<div class="att-list">' + studentRowsHtml(group, null) + '</div>' +
        exportRowHtml(ym) +
        '<div class="sheet-actions"><button type="button" class="btn btn-primary" data-att="done">' + esc(t('common.ok')) + '</button></div>';
    }
    draw();
    box.addEventListener('click', function (e) {
      const row = e.target.closest('.att-row');
      if (row) { openStudentForm(group, row.getAttribute('data-sid'), draw); return; }
      const b = e.target.closest('[data-att]');
      if (!b) return;
      const act = b.getAttribute('data-att');
      if (act === 'done') closeOverlay(entry);
      else if (act === 'add') openStudentForm(group, null, draw);
      else if (act === 'bulk') openBulkStudents(group, draw);
      else if (act === 'prevMonth' || act === 'nextMonth') { ym = shiftYm(ym, act === 'prevMonth' ? -1 : 1); draw(); }
      else if (act === 'xlsx' || act === 'pdf') exportAttendance(group, ym, act);
    });
  }

  /* ---------------- ক্যালেন্ডার: কাজের রিমাইন্ডার ---------------- */
  // প্রতিটি মাসের নিজস্ব রঙিন জোড়া
  const MONTH_COLORS = [
    ['#2563EB', '#7C3AED'], ['#DB2777', '#F97316'], ['#059669', '#0EA5E9'], ['#D97706', '#DC2626'],
    ['#16A34A', '#CA8A04'], ['#0891B2', '#4F46E5'], ['#7C3AED', '#DB2777'], ['#EA580C', '#E11D48'],
    ['#0D9488', '#65A30D'], ['#C2410C', '#9333EA'], ['#4F46E5', '#0891B2'], ['#BE123C', '#7C3AED']
  ];
  const REMIND_OPTS = [0, 5, 15, 30, 60, 1440, -1];

  /* বাংলা তারিখ (বাংলাদেশের সংশোধিত বঙ্গাব্দ, ২০১৯ থেকে): ১৪ এপ্রিল ১ বৈশাখ;
     বৈশাখ-আশ্বিন ৩১ দিন, কার্তিক-মাঘ ও চৈত্র ৩০ দিন, ফাল্গুন ২৯ (অধিবর্ষে ৩০) দিন */
  function banglaDate(date) {
    const y = date.getFullYear();
    const startY = (date.getMonth() > 3 || (date.getMonth() === 3 && date.getDate() >= 14)) ? y : y - 1;
    const start = new Date(startY, 3, 14);
    let days = Math.round((new Date(y, date.getMonth(), date.getDate()) - start) / 86400000);
    const feb = startY + 1;
    const leap = (feb % 4 === 0 && feb % 100 !== 0) || feb % 400 === 0;
    const lens = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, leap ? 30 : 29, 30];
    let m = 0;
    while (m < 11 && days >= lens[m]) { days -= lens[m]; m++; }
    return { d: days + 1, m: m, y: startY - 593 };
  }
  function banglaDateText(date) {
    const b = banglaDate(date);
    return t('cal.bnDate', { d: I.num(b.d), m: t('bnMonths')[b.m], y: I.num(b.y) });
  }

  // জাতীয় ও আন্তর্জাতিক দিবস (প্রতি বছর একই ইংরেজি তারিখে)। চাঁদের হিসাবের ছুটি (ঈদ ইত্যাদি) এখানে নেই।
  const OBS_DAYS = ['01-01', '02-21', '03-08', '03-25', '03-26', '04-07', '04-14', '05-01', '05-31', '06-05', '08-12',
    '09-08', '10-05', '10-10', '10-16', '10-24', '11-21', '12-03', '12-10', '12-14', '12-16', '12-25'];
  function observances(date) {
    const k = String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
    return OBS_DAYS.indexOf(k) !== -1 ? [t('obs.' + k)] : [];
  }
  const REPEAT_OPTS = ['none', 'daily', 'weekly', 'monthly', 'yearly'];

  function remindText(m) {
    if (m < 0) return t('cal.remOff');
    if (m === 0) return t('cal.remAt');
    if (m === 1440) return t('cal.remDay');
    if (m >= 60 && m % 60 === 0) return t('cal.remHour', { h: I.num(m / 60) });
    return t('cal.remMin', { m: I.num(m) });
  }

  function renderCalendar() {
    const today = new Date();
    const todayIso = S.isoDate(today);
    if (!state.calSel) state.calSel = todayIso;
    if (!state.calMonth) state.calMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const m0 = state.calMonth;
    const months = t('months');
    const monthName = Array.isArray(months) ? months[m0.getMonth()] : String(m0.getMonth() + 1);
    const col = MONTH_COLORS[m0.getMonth()];
    setTop(t('cal.title'), t('cal.sub'),
      '<button type="button" class="icon-btn cal-today-btn" data-action="cal-today" aria-label="' + esc(t('cal.today')) + '">' + esc(t('cal.today')) + '</button>');

    // শনিবার থেকে সপ্তাহ শুরু
    const jsToKey = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const lead = (m0.getDay() + 1) % 7;
    const daysIn = new Date(m0.getFullYear(), m0.getMonth() + 1, 0).getDate();
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<span class="cal-cell is-blank"></span>';
    for (let d = 1; d <= daysIn; d++) {
      const date = new Date(m0.getFullYear(), m0.getMonth(), d);
      const iso = S.isoDate(date);
      const dk = jsToKey[date.getDay()];
      const evs = S.eventsOn(iso);
      const hol = S.settings.holidays.indexOf(dk) !== -1;
      const obs = observances(date).length;
      const cls = ['cal-cell'];
      if (obs) cls.push('is-obs');
      if (iso === todayIso) cls.push('is-today');
      if (iso === state.calSel) cls.push('is-sel');
      if (hol) cls.push('is-hol');
      if (iso < todayIso) cls.push('is-past');
      cells += '<button type="button" class="' + cls.join(' ') + '" data-date="' + iso + '">' +
        '<span class="cal-num">' + esc(I.num(d)) + '</span>' +
        '<span class="cal-dots">' + evs.slice(0, 3).map(function (e) { return '<i style="background:' + esc(e.color) + '"></i>'; }).join('') +
        (evs.length > 3 ? '<b>+</b>' : '') + '</span>' +
        (obs ? '<span class="cal-star">★</span>' : '') +
        '</button>';
    }
    let html = '<section class="cal-card" style="--m1:' + col[0] + ';--m2:' + col[1] + '">' +
      '<header class="cal-head"><button type="button" class="cal-nav" data-cal="prev" aria-label="' + esc(t('cal.prev')) + '">' + ICON.back + '</button>' +
      '<div class="cal-title"><h2>' + esc(monthName) + ' ' + esc(I.num(m0.getFullYear())) + '</h2><span>' + esc(bnMonthSpan(m0)) + '</span></div>' +
      '<button type="button" class="cal-nav cal-next" data-cal="next" aria-label="' + esc(t('cal.next')) + '">' + ICON.back + '</button></header>' +
      '<div class="cal-wd">' + S.DAYS.map(function (d) { return '<span class="' + (S.settings.holidays.indexOf(d) !== -1 ? 'is-hol' : '') + '">' + esc(I.dayShort(d)) + '</span>'; }).join('') + '</div>' +
      '<div class="cal-grid" id="calGrid">' + cells + '</div>' +
      '<p class="cal-legend"><span><b class="lg-star">★</b>' + esc(t('cal.legendObs')) + '</span><span><i class="lg-ev"></i>' + esc(t('cal.legendEvent')) + '</span></p>' +
      '</section>';

    // বাছাই করা দিনের কাজ
    const sel = S.parseIso(state.calSel);
    const selObs = observances(sel);
    const evs = S.eventsOn(state.calSel);
    html += '<section class="cal-day" style="--m1:' + col[0] + ';--m2:' + col[1] + '">' +
      '<header class="cal-day-head"><div><h3>' + esc(I.formatDate(sel)) + '</h3>' +
      '<span>' + esc(banglaDateText(sel)) + '</span></div>' +
      '<button type="button" class="btn btn-primary btn-small cal-add" data-action="cal-add">' + ICON.plus + esc(t('cal.add')) + '</button></header>' +
      selObs.map(function (o) { return '<div class="cal-obs">★ ' + esc(o) + '</div>'; }).join('');
    if (evs.length) {
      html += '<div class="ev-list">' + evs.map(function (e) { return eventHtml(e, state.calSel); }).join('') + '</div>';
    } else {
      html += '<button type="button" class="ev-empty" data-action="cal-add">' + esc(t('cal.empty')) + '</button>';
    }
    html += '</section>';

    // সামনের কাজ
    const up = [];
    for (let d = 0; d < 30 && up.length < 6; d++) {
      const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + d);
      const iso = S.isoDate(date);
      S.eventsOn(iso).forEach(function (e) {
        if (up.length >= 6 || e.done.indexOf(iso) !== -1) return;
        if (d === 0 && S.toMin(e.time) < today.getHours() * 60 + today.getMinutes()) return;
        up.push({ e: e, iso: iso, date: date });
      });
    }
    if (up.length) {
      html += '<h3 class="cal-up-title">' + esc(t('cal.upcoming')) + '</h3><div class="ev-list">' +
        up.map(function (u) { return eventHtml(u.e, u.iso, true); }).join('') + '</div>';
    }
    $('#view').innerHTML = html;
    bindCalendar();
  }

  // মাসের নিচে বাংলা মাসের নাম: "কার্তিক–অগ্রহায়ণ ১৪৩৩"
  function bnMonthSpan(m0) {
    const a = banglaDate(m0);
    const b = banglaDate(new Date(m0.getFullYear(), m0.getMonth() + 1, 0));
    const names = t('bnMonths');
    return (a.m === b.m ? names[a.m] : names[a.m] + '–' + names[b.m]) + ' ' + I.num(b.y) + ' ' + t('cal.bnEra');
  }

  function eventHtml(e, iso, showDate) {
    const done = e.done.indexOf(iso) !== -1;
    const d = S.parseIso(iso);
    const when = (showDate ? I.formatDate(d).split(', ')[0] + ' ' + I.num(d.getDate()) + ' · ' : '') + (e.allDay ? t('cal.allDay') : fmtTime(e.time));
    return '<div class="ev-item' + (done ? ' is-done' : '') + '" style="' + colorVars(e.color) + '">' +
      '<button type="button" class="ev-check" data-ev-done="' + esc(e.id) + '" data-iso="' + iso + '" aria-label="' + esc(t('cal.markDone')) + '">' + ICON.check + '</button>' +
      '<button type="button" class="ev-main" data-ev="' + esc(e.id) + '" data-iso="' + iso + '">' +
      '<span class="ev-when">' + esc(when) + '</span>' +
      '<b class="ev-title">' + esc(e.title) + '</b>' +
      (e.note ? '<span class="ev-note">' + esc(e.note) + '</span>' : '') +
      '<span class="ev-tags">' + (e.remind >= 0 ? '<i>' + ICON.bell + esc(remindText(e.remind)) + '</i>' : '') +
      (e.repeat !== 'none' ? '<i>' + esc(t('cal.rep_' + e.repeat)) + '</i>' : '') + '</span>' +
      '</button></div>';
  }

  function bindCalendar() {
    const grid = $('#calGrid');
    $('.cal-card').addEventListener('click', function (e) {
      const nav = e.target.closest('[data-cal]');
      if (nav) { shiftMonth(nav.getAttribute('data-cal') === 'next' ? 1 : -1); return; }
      const cell = e.target.closest('.cal-cell[data-date]');
      if (!cell) return;
      if (state.calSel === cell.getAttribute('data-date')) { openEventSheet(null, state.calSel); return; }
      state.calSel = cell.getAttribute('data-date');
      renderCalendar();
    });
    // আঙুল দিয়ে ডানে-বামে টানলে মাস বদলায়
    let sx = null, sy = 0;
    grid.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
    grid.addEventListener('touchend', function (e) {
      if (sx === null) return;
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      sx = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) shiftMonth(dx < 0 ? 1 : -1);
    });
    $$('.ev-list').forEach(function (l) {
      l.addEventListener('click', function (e) {
        const dn = e.target.closest('[data-ev-done]');
        if (dn) {
          const nowDone = S.toggleEventDone(dn.getAttribute('data-ev-done'), dn.getAttribute('data-iso'));
          N.reschedule();
          toast(nowDone ? t('cal.doneToast') : t('cal.undoneToast'));
          renderCalendar();
          return;
        }
        const ev = e.target.closest('[data-ev]');
        if (ev) openEventSheet(S.getEvent(ev.getAttribute('data-ev')), ev.getAttribute('data-iso'));
      });
    });
  }

  function shiftMonth(n) {
    const m = state.calMonth;
    state.calMonth = new Date(m.getFullYear(), m.getMonth() + n, 1);
    const sel = S.parseIso(state.calSel);
    // বাছাই করা দিনও নতুন মাসে সরে (আজকের মাসে গেলে আজ)
    const today = new Date();
    if (state.calMonth.getFullYear() === today.getFullYear() && state.calMonth.getMonth() === today.getMonth()) state.calSel = S.isoDate(today);
    else state.calSel = S.isoDate(new Date(state.calMonth.getFullYear(), state.calMonth.getMonth(), Math.min(sel.getDate(), new Date(state.calMonth.getFullYear(), state.calMonth.getMonth() + 1, 0).getDate())));
    renderCalendar();
    const card = $('.cal-card');
    if (card) card.classList.add(n > 0 ? 'slide-l' : 'slide-r');
  }

  // কাজ যোগ বা সম্পাদনা
  function openEventSheet(ev, iso) {
    const editing = !!ev;
    const e = ev || { title: '', note: '', date: iso || S.isoDate(new Date()), time: '09:00', color: S.PALETTE[(S.events.length * 3 + 9) % S.PALETTE.length], remind: 15, repeat: 'none' };
    const entry = openOverlay('sheet',
      '<div class="sheet-handle"></div><h2 class="sheet-title">' + esc(editing ? t('cal.editTitle') : t('cal.addTitle')) + '</h2>' +
      '<label class="field"><span class="field-label">' + esc(t('cal.fTitle')) + '</span><input id="evTitle" maxlength="120" placeholder="' + esc(t('cal.fTitlePh')) + '"/></label>' +
      '<div class="row-2"><label class="field"><span class="field-label">' + esc(t('cal.fDate')) + '</span><input id="evDate" type="date"/></label>' +
      '<label class="field"><span class="field-label">' + esc(t('cal.fTime')) + '</span><input id="evTime" type="time"/></label></div>' +
      '<label class="check-row ev-allday"><input type="checkbox" id="evAllDay"/><span>' + esc(t('cal.allDayHelp')) + '</span></label>' +
      '<div class="field-label">' + esc(t('cal.fRemind')) + '</div><div class="chips" id="evRemind">' +
      REMIND_OPTS.map(function (m) { return '<button type="button" class="chip-btn' + (m === e.remind ? ' on' : '') + '" data-val="' + m + '">' + esc(remindText(m)) + '</button>'; }).join('') + '</div>' +
      '<div class="field-label ev-gap">' + esc(t('cal.fRepeat')) + '</div><div class="chips" id="evRepeat">' +
      REPEAT_OPTS.map(function (r) { return '<button type="button" class="chip-btn' + (r === e.repeat ? ' on' : '') + '" data-val="' + r + '">' + esc(t('cal.rep_' + r)) + '</button>'; }).join('') + '</div>' +
      '<div class="field-label ev-gap">' + esc(t('form.color')) + '</div><div class="swatches" id="evColors">' +
      S.PALETTE.map(function (c) { return '<button type="button" class="swatch' + (c === e.color ? ' on' : '') + '" data-color="' + c + '" style="--sw:' + c + '" aria-label="' + c + '"></button>'; }).join('') + '</div>' +
      '<label class="field ev-gap"><span class="field-label">' + esc(t('cal.fNote')) + '</span><textarea id="evNote" rows="2" maxlength="500" placeholder="' + esc(t('cal.fNotePh')) + '"></textarea></label>' +
      '<p class="field-error" id="evErr"></p>' +
      '<div class="sheet-actions">' +
      (editing ? '<button type="button" class="btn btn-text danger-text" data-act="del">' + esc(t('cal.delete')) + '</button><span class="flex-1"></span>' : '') +
      '<button type="button" class="btn btn-text" data-act="cancel">' + esc(t('common.cancel')) + '</button>' +
      '<button type="button" class="btn btn-primary" data-act="ok">' + esc(t('common.save')) + '</button></div>');
    const el = entry.el;
    $('#evTitle', el).value = e.title;
    $('#evDate', el).value = editing ? e.date : (iso || e.date);
    $('#evTime', el).value = e.time;
    $('#evNote', el).value = e.note;
    const allDay = $('#evAllDay', el);
    allDay.checked = !!e.allDay;
    function syncAllDay() {
      $('#evTime', el).disabled = allDay.checked;
      if (allDay.checked) $('#evTime', el).value = '08:00';
    }
    allDay.addEventListener('change', syncAllDay);
    syncAllDay();
    let color = e.color;
    ['#evRemind', '#evRepeat'].forEach(function (id) {
      $(id, el).addEventListener('click', function (x) {
        const b = x.target.closest('.chip-btn');
        if (!b) return;
        $$(id + ' .chip-btn', el).forEach(function (c) { c.classList.remove('on'); });
        b.classList.add('on');
      });
    });
    $('#evColors', el).addEventListener('click', function (x) {
      const b = x.target.closest('.swatch');
      if (!b) return;
      color = b.getAttribute('data-color');
      $$('#evColors .swatch', el).forEach(function (c) { c.classList.toggle('on', c === b); });
    });
    $('[data-act="cancel"]', el).onclick = function () { closeOverlay(entry, true); };
    if (editing) {
      $('[data-act="del"]', el).onclick = function () {
        confirmDialog({ title: t('cal.delTitle'), message: t('cal.delText', { title: e.title }), okText: t('cal.delete'), danger: true }).then(function (ok) {
          if (!ok) return;
          S.deleteEvent(e.id);
          N.reschedule();
          closeOverlay(entry, true);
          toast(t('cal.deleted'));
          renderCalendar();
        });
      };
    }
    $('[data-act="ok"]', el).onclick = function () {
      const title = $('#evTitle', el).value.trim();
      const date = $('#evDate', el).value;
      const time = $('#evTime', el).value;
      const err = $('#evErr', el);
      if (!title) { err.textContent = t('cal.errTitle'); $('#evTitle', el).focus(); return; }
      if (!date || !time) { err.textContent = t('cal.errWhen'); return; }
      const saved = S.saveEvent({
        id: editing ? e.id : undefined, title: title, date: date, time: time, note: $('#evNote', el).value,
        color: color, remind: parseInt($('#evRemind .on', el).getAttribute('data-val'), 10),
        repeat: $('#evRepeat .on', el).getAttribute('data-val'), done: editing ? e.done : [], allDay: allDay.checked
      });
      if (!saved) { infoDialog(t('error.title'), t('settings.saveFail')); return; }
      N.reschedule();
      closeOverlay(entry, true);
      const d = S.parseIso(date);
      state.calSel = date;
      state.calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      toast(saved.remind >= 0 && S.settings.notifEnabled ? t('cal.savedRemind', { when: remindText(saved.remind) }) : t('cal.saved'));
      if (state.view === 'calendar') renderCalendar();
    };
    if (!editing) setTimeout(function () { $('#evTitle', el).focus(); }, 250);
  }

  /* ---------------- ক্লাস যোগ / সম্পাদনা (Form) ---------------- */

  function defaultTimes(day) {
    const list = S.classesForDay(day);
    const after = list.length ? S.toMin(list[list.length - 1].end) : 0;
    // সেই দিনের শেষ ক্লাসের পরের প্রথম খালি পিরিয়ড
    const p = S.periods().filter(function (x) {
      return S.toMin(x.start) >= after && !list.some(function (c) { return c.start === x.start; });
    })[0];
    if (p) return { start: p.start, end: p.end };
    const start = list.length ? list[list.length - 1].end : '10:00';
    return { start: start, end: addMinutes(start, 45) };
  }

  function periodChipsHtml(start, end) {
    return S.periods().map(function (p, i) {
      return '<button type="button" class="chip-btn period-chip' + (p.start === start && p.end === end ? ' on' : '') + '" data-ps="' + p.start + '" data-pe="' + p.end + '">' +
        '<b>' + esc(t('period.n', { n: I.num(i + 1) })) + '</b><small>' + esc(fmtTime(p.start)) + '</small></button>';
    }).join('') +
      '<button type="button" class="chip-btn chip-edit" data-action="edit-periods">' + ICON.periods + esc(t('period.edit')) + '</button>';
  }

  /* পিরিয়ড সাজানো: যোগ, সময় বদল, মুছে ফেলা। সময় বদলালে ওই পিরিয়ডের ক্লাসগুলোর সময়ও বদলায়। */
  function openPeriodSheet() {
    let rows = S.periods().map(function (p, i) { return { id: 'p' + i, start: p.start, end: p.end, orig: { start: p.start, end: p.end } }; });
    let seq = rows.length;
    const entry = openOverlay('sheet',
      '<div class="sheet-handle"></div><h2 class="sheet-title">' + esc(t('period.title')) + '</h2>' +
      '<p class="sheet-sub">' + esc(t('period.help')) + '</p>' +
      '<div class="pd-list" id="pdList"></div>' +
      '<button type="button" class="btn btn-tonal btn-block pd-add" data-pd="add">' + ICON.plus + esc(t('period.add')) + '</button>' +
      '<label class="check-row"><input type="checkbox" id="pdShift" checked/><span>' + esc(t('period.shift')) + '</span></label>' +
      '<p class="field-error" id="pdErr"></p>' +
      '<div class="sheet-actions"><button type="button" class="btn btn-text" data-pd="cancel">' + esc(t('common.cancel')) + '</button>' +
      '<button type="button" class="btn btn-primary" data-pd="ok">' + esc(t('common.save')) + '</button></div>');
    const el = entry.el;
    const listEl = $('#pdList', el);
    function readInputs() {
      $$('.pd-row', listEl).forEach(function (r) {
        const row = rows.filter(function (x) { return x.id === r.getAttribute('data-id'); })[0];
        if (!row) return;
        row.start = $('.pd-s', r).value;
        row.end = $('.pd-e', r).value;
      });
    }
    function draw() {
      listEl.innerHTML = rows.length ? rows.map(function (r, i) {
        return '<div class="pd-row" data-id="' + r.id + '"><span class="pd-n">' + esc(t('period.n', { n: I.num(i + 1) })) + '</span>' +
          '<input type="time" class="pd-s" value="' + esc(r.start) + '" aria-label="' + esc(t('form.start')) + '"/><span class="pd-dash">–</span>' +
          '<input type="time" class="pd-e" value="' + esc(r.end) + '" aria-label="' + esc(t('form.end')) + '"/>' +
          '<button type="button" class="icon-btn small pd-del" data-pd="del" aria-label="' + esc(t('period.del')) + '">' + ICON.trash + '</button></div>';
      }).join('') : '<p class="group-help">' + esc(t('period.empty')) + '</p>';
    }
    draw();
    el.addEventListener('click', function (e) {
      const b = e.target.closest('[data-pd]');
      if (!b) return;
      const act = b.getAttribute('data-pd');
      readInputs();
      if (act === 'cancel') { closeOverlay(entry, true); return; }
      if (act === 'add') {
        const last = rows[rows.length - 1];
        const len = last && last.start && last.end ? Math.max(20, S.toMin(last.end) - S.toMin(last.start)) : 40;
        const st = last && last.end ? last.end : '08:00';
        rows.push({ id: 'n' + (seq++), start: st, end: addMinutes(st, len), orig: null });
        draw();
        const inputs = $$('.pd-s', listEl);
        if (inputs.length) inputs[inputs.length - 1].scrollIntoView({ block: 'nearest' });
        return;
      }
      if (act === 'del') {
        const id = b.closest('.pd-row').getAttribute('data-id');
        const idx = rows.findIndex(function (x) { return x.id === id; });
        confirmDialog({
          title: t('period.delTitle', { n: I.num(idx + 1) }),
          message: t('period.delText'),
          okText: t('period.del'),
          danger: true
        }).then(function (ok) {
          if (!ok) return;
          rows = rows.filter(function (x) { return x.id !== id; });
          draw();
        });
        return;
      }
      if (act === 'ok') {
        const err = $('#pdErr', el);
        err.textContent = '';
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          if (!r.start || !r.end || S.toMin(r.end) <= S.toMin(r.start)) { err.textContent = t('period.invalid', { n: I.num(i + 1) }); return; }
        }
        const sorted = rows.slice().sort(function (a, b) { return S.toMin(a.start) - S.toMin(b.start); });
        for (let i = 0; i + 1 < sorted.length; i++) {
          if (S.toMin(sorted[i + 1].start) < S.toMin(sorted[i].end)) {
            err.textContent = t('period.overlap', { a: fmtTime(sorted[i].start), b: fmtTime(sorted[i + 1].start) });
            return;
          }
        }
        const changes = $('#pdShift', el).checked ? rows.filter(function (r) {
          return r.orig && (r.orig.start !== r.start || r.orig.end !== r.end);
        }).map(function (r) { return { from: r.orig, to: { start: r.start, end: r.end } }; }) : [];
        const moved = S.setPeriods(sorted.map(function (r) { return { start: r.start, end: r.end }; }), changes);
        if (moved < 0) { infoDialog(t('error.title'), t('settings.saveFail')); return; }
        if (state.draft) state.draft.periods = S.settings.periods.slice();
        closeOverlay(entry, true);
        if (moved) N.reschedule();
        toast(moved ? t('period.savedShift', { n: I.num(moved) }) : t('period.saved'));
        const chips = $('#f-periods');
        if (state.view === 'form' && chips) {
          chips.innerHTML = periodChipsHtml($('#f-start').value, $('#f-end').value);
        } else {
          render();
        }
      }
    });
  }

  function datalist(id, values) {
    const uniq = {};
    values.forEach(function (v) { if (v) uniq[v] = true; });
    return '<datalist id="' + id + '">' + Object.keys(uniq).sort(S.collator().compare).map(function (v) { return '<option value="' + esc(v) + '"></option>'; }).join('') + '</datalist>';
  }

  function renderForm() {
    const editing = state.editId ? S.getClass(state.editId) : null;
    if (state.editId && !editing) { navigate('today'); return; }
    const today = S.dayKeyOf(new Date());
    const day = editing ? editing.day : (state.presetDay || (S.settings.holidays.indexOf(today) === -1 ? today : 'sat'));
    const times = editing ? { start: editing.start, end: editing.end } : (state.presetTimes || defaultTimes(day));
    const c = editing || {
      subject: '', grade: '', section: '', room: '', note: '',
      color: S.PALETTE[S.data.classes.length % S.PALETTE.length], remind: 'default'
    };
    const isCustomColor = S.PALETTE.indexOf(c.color) === -1;
    const remindMode = c.remind === 'default' || c.remind === 'off' ? c.remind : ([5, 10, 15].indexOf(c.remind) !== -1 ? String(c.remind) : 'custom');

    setTop(editing ? t('form.editTitle') : t('form.addTitle'), editing ? I.dayName(editing.day) : t('form.addSub'), '', true);

    const all = S.data.classes;
    let html = '<form id="classForm" class="form" novalidate autocomplete="off">';

    html += '<div class="form-card">' +
      field('subject', t('form.subject'), '<input id="f-subject" name="subject" list="dl-subject" maxlength="80" required value="' + esc(c.subject) + '" placeholder="' + esc(t('form.subjectPh')) + '"/>' + datalist('dl-subject', S.subjects())) +
      '<div class="row-2">' +
      field('grade', t('form.grade'), '<input id="f-grade" name="grade" list="dl-grade" maxlength="40" value="' + esc(c.grade) + '" placeholder="' + esc(t('form.gradePh')) + '"/>' + datalist('dl-grade', all.map(function (x) { return x.grade; }))) +
      field('section', t('form.section'), '<input id="f-section" name="section" list="dl-section" maxlength="40" value="' + esc(c.section) + '" placeholder="' + esc(t('form.sectionPh')) + '"/>' + datalist('dl-section', all.map(function (x) { return x.section; }))) +
      '</div>' +
      field('room', t('form.room'), '<input id="f-room" name="room" list="dl-room" maxlength="40" value="' + esc(c.room) + '" placeholder="' + esc(t('form.roomPh')) + '"/>' + datalist('dl-room', all.map(function (x) { return x.room; }))) +
      '</div>';

    // দিন
    html += '<div class="form-card"><div class="field-label">' + esc(editing ? t('form.day') : t('form.days')) + '</div>' +
      '<div class="chips day-chips" id="f-days" data-multi="' + (editing ? '0' : '1') + '">' +
      S.DAYS.map(function (d) {
        const hol = S.settings.holidays.indexOf(d) !== -1;
        return '<button type="button" class="chip-btn' + (d === day ? ' on' : '') + (hol ? ' is-holiday' : '') + '" data-day="' + d + '">' + esc(I.dayShort(d)) + '</button>';
      }).join('') + '</div>' +
      (!editing ? '<p class="field-help">' + esc(t('form.daysHelp')) + '</p>' : '') +
      '<div class="field-label period-label">' + esc(t('period.pick')) + '</div>' +
      '<div class="chips period-chips" id="f-periods">' + periodChipsHtml(times.start, times.end) + '</div>' +
      '<div class="row-2">' +
      field('start', t('form.start'), '<input id="f-start" type="time" name="start" required value="' + esc(times.start) + '"/>') +
      field('end', t('form.end'), '<input id="f-end" type="time" name="end" required value="' + esc(times.end) + '"/>') +
      '</div><p class="field-help" id="f-duration"></p></div>';

    // রং
    html += '<div class="form-card"><div class="field-label">' + esc(t('form.color')) + '</div>' +
      '<div class="swatches" id="f-colors">' +
      S.PALETTE.map(function (p) {
        return '<button type="button" class="swatch' + (p === c.color ? ' on' : '') + '" data-color="' + p + '" style="--sw:' + p + '" aria-label="' + p + '"></button>';
      }).join('') +
      '<button type="button" class="swatch swatch-custom' + (isCustomColor ? ' on' : '') + '" data-action="custom-color" style="--sw:' + (isCustomColor ? c.color : 'transparent') + '" aria-label="' + esc(t('form.customColor')) + '">' + ICON.palette + '</button>' +
      '</div><input type="hidden" id="f-color" value="' + esc(c.color) + '"/>' +
      '<label class="check-row"><input type="checkbox" id="f-colorAll"/><span>' + esc(t('form.colorAll')) + '</span></label></div>';

    // রিমাইন্ডার
    html += '<div class="form-card"><div class="field-label">' + esc(t('form.reminder')) + '</div>' +
      '<div class="chips" id="f-remind">' +
      [['default', t('form.remindDefault', { m: S.settings.leadMinutes })], ['5', t('form.minN', { m: 5 })], ['10', t('form.minN', { m: 10 })], ['15', t('form.minN', { m: 15 })], ['custom', t('form.custom')], ['off', t('form.off')]]
        .map(function (o) { return '<button type="button" class="chip-btn' + (o[0] === remindMode ? ' on' : '') + '" data-val="' + o[0] + '">' + esc(o[1]) + '</button>'; }).join('') +
      '</div>' +
      '<div class="custom-min" id="f-remindCustomWrap"' + (remindMode === 'custom' ? '' : ' hidden') + '>' +
      '<input id="f-remindCustom" type="number" inputmode="numeric" min="0" max="720" value="' + esc(remindMode === 'custom' ? c.remind : 20) + '"/><span>' + esc(t('form.minBefore')) + '</span></div></div>';

    // নোট
    html += '<div class="form-card">' + field('note', t('form.note'), '<textarea id="f-note" name="note" rows="3" maxlength="500" placeholder="' + esc(t('form.notePh')) + '">' + esc(c.note) + '</textarea>') + '</div>';

    html += '<div class="form-actions">' +
      '<button type="submit" class="btn btn-primary btn-block">' + ICON.check + esc(editing ? t('form.saveChanges') : t('form.save')) + '</button>';
    if (editing) {
      html += '<div class="row-2">' +
        '<button type="button" class="btn btn-tonal" data-action="copy-class">' + ICON.copy + esc(t('form.copy')) + '</button>' +
        '<button type="button" class="btn btn-danger-soft" data-action="delete-class">' + ICON.trash + esc(t('form.delete')) + '</button></div>';
    }
    html += '</div></form>';

    $('#view').innerHTML = html;
    bindForm(editing);
  }

  function field(name, label, control) {
    return '<label class="field" for="f-' + name + '"><span class="field-label">' + esc(label) + '</span>' + control + '<span class="field-error" id="err-' + name + '"></span></label>';
  }

  function bindForm(editing) {
    const form = $('#classForm');
    const start = $('#f-start');
    const end = $('#f-end');
    let colorTouched = !!editing;

    function updateDuration() {
      const el = $('#f-duration');
      if (!start.value || !end.value) { el.textContent = ''; return; }
      const d = S.toMin(end.value) - S.toMin(start.value);
      el.textContent = d > 0 ? t('form.duration', { d: I.duration(d) }) : t('form.endBeforeStart');
      el.classList.toggle('is-error', d <= 0);
    }
    start.addEventListener('change', function () {
      if (start.value && (!end.value || S.toMin(end.value) <= S.toMin(start.value))) end.value = addMinutes(start.value, 45);
      updateDuration();
    });
    end.addEventListener('change', updateDuration);
    start.addEventListener('input', updateDuration);
    end.addEventListener('input', updateDuration);
    updateDuration();

    // পিরিয়ড বাছলে শুরু-শেষের সময় নিজে থেকে বসে যায়
    function markPeriod() {
      $$('#f-periods .period-chip').forEach(function (b) {
        b.classList.toggle('on', b.getAttribute('data-ps') === start.value && b.getAttribute('data-pe') === end.value);
      });
    }
    $('#f-periods').addEventListener('click', function (e) {
      const b = e.target.closest('.period-chip');
      if (!b) return;
      start.value = b.getAttribute('data-ps');
      end.value = b.getAttribute('data-pe');
      updateDuration();
      markPeriod();
    });
    start.addEventListener('change', markPeriod);
    end.addEventListener('change', markPeriod);

    // দিনের চিপ
    const daysWrap = $('#f-days');
    const multi = daysWrap.getAttribute('data-multi') === '1';
    daysWrap.addEventListener('click', function (e) {
      const b = e.target.closest('.chip-btn');
      if (!b) return;
      if (multi) {
        b.classList.toggle('on');
      } else {
        $$('.chip-btn', daysWrap).forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
      }
    });

    // রং
    function setColor(hex, custom) {
      $('#f-color').value = hex;
      $$('#f-colors .swatch').forEach(function (s) { s.classList.remove('on'); });
      if (custom) {
        const cb = $('#f-colors .swatch-custom');
        cb.classList.add('on');
        cb.style.setProperty('--sw', hex);
      } else {
        const sw = $('#f-colors .swatch[data-color="' + hex + '"]');
        if (sw) sw.classList.add('on');
        else setColor(hex, true);
      }
    }
    $('#f-colors').addEventListener('click', function (e) {
      const b = e.target.closest('.swatch');
      if (!b) return;
      if (b.getAttribute('data-action') === 'custom-color') {
        openColorPicker($('#f-color').value, function (hex) { colorTouched = true; setColor(hex, S.PALETTE.indexOf(hex) === -1); });
        return;
      }
      colorTouched = true;
      setColor(b.getAttribute('data-color'), false);
    });

    // নতুন ক্লাসে আগের বিষয়ের রং নিজে থেকে বসানো
    $('#f-subject').addEventListener('change', function () {
      if (colorTouched) return;
      const existing = S.colorForSubject($('#f-subject').value);
      if (existing) setColor(existing, S.PALETTE.indexOf(existing) === -1);
    });

    // রিমাইন্ডার
    $('#f-remind').addEventListener('click', function (e) {
      const b = e.target.closest('.chip-btn');
      if (!b) return;
      $$('#f-remind .chip-btn').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      $('#f-remindCustomWrap').hidden = b.getAttribute('data-val') !== 'custom';
      if (b.getAttribute('data-val') === 'custom') $('#f-remindCustom').focus();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      saveForm(editing);
    });
  }

  function showError(name, msg) {
    const el = $('#err-' + name);
    if (el) el.textContent = msg || '';
    const input = $('#f-' + name);
    if (input) input.classList.toggle('invalid', !!msg);
  }

  async function saveForm(editing) {
    ['subject', 'start', 'end'].forEach(function (n) { showError(n, ''); });
    const subject = $('#f-subject').value.trim();
    const start = $('#f-start').value;
    const end = $('#f-end').value;
    const days = $$('#f-days .chip-btn.on').map(function (b) { return b.getAttribute('data-day'); });
    let ok = true;
    if (!subject) { showError('subject', t('form.errSubject')); ok = false; }
    if (!start) { showError('start', t('form.errTime')); ok = false; }
    if (!end) { showError('end', t('form.errTime')); ok = false; }
    if (start && end && S.toMin(end) <= S.toMin(start)) { showError('end', t('form.endBeforeStart')); ok = false; }
    if (!days.length) { toast(t('form.errDay')); ok = false; }
    if (!ok) {
      const first = $('.invalid');
      if (first) first.focus();
      return;
    }

    const rb = $('#f-remind .chip-btn.on');
    const rv = rb ? rb.getAttribute('data-val') : 'default';
    let remind = rv;
    if (rv === 'custom') {
      const n = parseInt(I.toAsciiDigits($('#f-remindCustom').value), 10);
      remind = isNaN(n) || n < 0 ? S.settings.leadMinutes : Math.min(720, n);
    } else if (rv !== 'default' && rv !== 'off') {
      remind = parseInt(rv, 10);
    }

    const payload = {
      subject: subject,
      grade: $('#f-grade').value,
      section: $('#f-section').value,
      room: $('#f-room').value,
      start: start,
      end: end,
      note: $('#f-note').value,
      color: $('#f-color').value,
      remind: remind
    };

    // সময়ের সংঘর্ষ
    const clashes = days.map(function (d) { return S.findOverlap(d, start, end, editing ? editing.id : null); }).filter(Boolean);
    if (clashes.length) {
      const cl = clashes[0];
      const go = await confirmDialog({
        title: t('form.clashTitle'),
        message: t('form.clashText', { subject: cl.subject || t('form.untitled'), day: I.dayName(cl.day), start: fmtTime(cl.start), end: fmtTime(cl.end) }),
        okText: t('form.saveAnyway')
      });
      if (!go) return;
    }

    if (editing) {
      S.updateClass(editing.id, Object.assign({ day: days[0] }, payload));
    } else {
      days.forEach(function (d) { S.addClass(Object.assign({ day: d }, payload)); });
    }
    if ($('#f-colorAll').checked) S.setSubjectColor(subject, payload.color);
    N.reschedule();
    toast(editing ? t('form.updated') : (days.length > 1 ? t('form.addedMany', { n: days.length }) : t('form.added')));
    navigate(state.prevView === 'settings' ? 'week' : state.prevView || 'today');
  }

  function openCopySheet(id) {
    const c = S.getClass(id);
    if (!c) return;
    const entry = openOverlay('sheet',
      '<div class="sheet-handle"></div><h2 class="sheet-title">' + esc(t('copy.title')) + '</h2>' +
      '<p class="sheet-sub">' + esc(t('copy.sub', { subject: c.subject, time: fmtTime(c.start) })) + '</p>' +
      '<div class="chips day-chips" id="copyDays">' +
      S.DAYS.map(function (d) {
        return '<button type="button" class="chip-btn' + (d === c.day ? ' is-source' : '') + '" data-day="' + d + '"' + (d === c.day ? ' disabled' : '') + '>' + esc(I.dayShort(d)) + '</button>';
      }).join('') + '</div>' +
      '<div class="sheet-actions"><button type="button" class="btn btn-text" data-act="cancel">' + esc(t('common.cancel')) + '</button>' +
      '<button type="button" class="btn btn-primary" data-act="ok">' + esc(t('copy.do')) + '</button></div>');
    $('#copyDays', entry.el).addEventListener('click', function (e) {
      const b = e.target.closest('.chip-btn');
      if (b && !b.disabled) b.classList.toggle('on');
    });
    $('[data-act="cancel"]', entry.el).onclick = function () { closeOverlay(entry, true); };
    $('[data-act="ok"]', entry.el).onclick = function () {
      const days = $$('#copyDays .chip-btn.on', entry.el).map(function (b) { return b.getAttribute('data-day'); });
      if (!days.length) { toast(t('form.errDay')); return; }
      const n = S.copyClass(id, days);
      closeOverlay(entry, true);
      N.reschedule();
      toast(t('copy.done', { n: n }));
    };
  }

  /* ---------------- কাস্টম রং বাছাই ---------------- */

  function hexToHsl(hex) {
    const rgb = hexToRgb(hex).map(function (v) { return v / 255; });
    const max = Math.max.apply(null, rgb), min = Math.min.apply(null, rgb);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === rgb[0]) h = (rgb[1] - rgb[2]) / d + (rgb[1] < rgb[2] ? 6 : 0);
      else if (max === rgb[1]) h = (rgb[2] - rgb[0]) / d + 2;
      else h = (rgb[0] - rgb[1]) / d + 4;
      h *= 60;
    }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }

  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = function (n) { return (n + h / 30) % 12; };
    const a = s * Math.min(l, 1 - l);
    const f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return '#' + [f(0), f(8), f(4)].map(function (x) { return Math.round(x * 255).toString(16).padStart(2, '0'); }).join('').toUpperCase();
  }

  function openColorPicker(initial, onPick) {
    let hsl = hexToHsl(S.isColor(initial) ? initial : '#4F46E5');
    const entry = openOverlay('sheet',
      '<div class="sheet-handle"></div><h2 class="sheet-title">' + esc(t('color.title')) + '</h2>' +
      '<div class="cp-preview" id="cpPreview"><span id="cpHex"></span></div>' +
      '<label class="cp-row"><span>' + esc(t('color.hue')) + '</span><input type="range" min="0" max="360" id="cpH" class="cp-hue"/></label>' +
      '<label class="cp-row"><span>' + esc(t('color.sat')) + '</span><input type="range" min="20" max="100" id="cpS"/></label>' +
      '<label class="cp-row"><span>' + esc(t('color.light')) + '</span><input type="range" min="20" max="70" id="cpL"/></label>' +
      '<label class="field"><span class="field-label">HEX</span><input id="cpInput" maxlength="7" autocapitalize="characters"/></label>' +
      '<div class="sheet-actions"><button type="button" class="btn btn-text" data-act="cancel">' + esc(t('common.cancel')) + '</button>' +
      '<button type="button" class="btn btn-primary" data-act="ok">' + esc(t('color.use')) + '</button></div>');
    const h = $('#cpH', entry.el), s = $('#cpS', entry.el), l = $('#cpL', entry.el), inp = $('#cpInput', entry.el);
    function paint(fromInput) {
      const hex = hslToHex(hsl[0], hsl[1], hsl[2]);
      $('#cpPreview', entry.el).style.background = hex;
      $('#cpHex', entry.el).textContent = hex;
      s.style.background = 'linear-gradient(90deg,' + hslToHex(hsl[0], 20, hsl[2]) + ',' + hslToHex(hsl[0], 100, hsl[2]) + ')';
      l.style.background = 'linear-gradient(90deg,' + hslToHex(hsl[0], hsl[1], 20) + ',' + hslToHex(hsl[0], hsl[1], 70) + ')';
      if (!fromInput) inp.value = hex;
      return hex;
    }
    h.value = hsl[0]; s.value = Math.max(20, hsl[1]); l.value = Math.min(70, Math.max(20, hsl[2]));
    hsl = [+h.value, +s.value, +l.value];
    [h, s, l].forEach(function (r) {
      r.addEventListener('input', function () { hsl = [+h.value, +s.value, +l.value]; paint(); });
    });
    inp.addEventListener('input', function () {
      let v = inp.value.trim();
      if (v[0] !== '#') v = '#' + v;
      if (S.isColor(v)) {
        hsl = hexToHsl(v);
        h.value = hsl[0]; s.value = hsl[1]; l.value = hsl[2];
        paint(true);
        $('#cpPreview', entry.el).style.background = v;
        $('#cpHex', entry.el).textContent = v.toUpperCase();
      }
    });
    paint();
    $('[data-act="cancel"]', entry.el).onclick = function () { closeOverlay(entry, true); };
    $('[data-act="ok"]', entry.el).onclick = function () {
      let v = inp.value.trim();
      if (v[0] !== '#') v = '#' + v;
      const hex = S.isColor(v) ? v.toUpperCase() : hslToHex(hsl[0], hsl[1], hsl[2]);
      closeOverlay(entry, true);
      onPick(hex);
    };
  }

  /* ---------------- সেটিংস ---------------- */

  function cloneSettings(src) {
    return JSON.parse(JSON.stringify(src));
  }

  function renderSettings() {
    if (!state.draft) { state.draft = cloneSettings(S.settings); state.dirty = false; }
    const st = state.draft;
    setTop(t('settings.title'), t('settings.sub'), '');
    const leadOpts = [5, 10, 15, 30];
    const leadCustom = leadOpts.indexOf(st.leadMinutes) === -1;

    let html = '';

    html += group(t('settings.appearance'),
      row(t('settings.language'), null,
        '<div class="seg" data-setting="lang">' +
        '<button type="button" data-val="bn" class="' + (st.lang === 'bn' ? 'on' : '') + '">বাংলা</button>' +
        '<button type="button" data-val="en" class="' + (st.lang === 'en' ? 'on' : '') + '">English</button></div>') +
      row(t('settings.theme'), null,
        '<div class="seg" data-setting="theme">' +
        ['system', 'light', 'dark'].map(function (v) { return '<button type="button" data-val="' + v + '" class="' + (st.theme === v ? 'on' : '') + '">' + esc(t('settings.theme_' + v)) + '</button>'; }).join('') + '</div>') +
      row(t('settings.timeFormat'), null,
        '<div class="seg" data-setting="timeFormat">' +
        '<button type="button" data-val="12" class="' + (st.timeFormat === '12' ? 'on' : '') + '">' + esc(t('settings.h12')) + '</button>' +
        '<button type="button" data-val="24" class="' + (st.timeFormat === '24' ? 'on' : '') + '">' + esc(t('settings.h24')) + '</button></div>'));

    html += group(t('settings.holidays'),
      '<p class="group-help">' + esc(t('settings.holidaysHelp')) + '</p>' +
      '<div class="chips day-chips" data-daylist="holidays">' +
      S.DAYS.map(function (d) { return '<button type="button" class="chip-btn' + (st.holidays.indexOf(d) !== -1 ? ' on danger' : '') + '" data-day="' + d + '">' + esc(I.dayShort(d)) + '</button>'; }).join('') + '</div>');

    html += group(t('settings.break'),
      row(t('settings.breakOn'), t('settings.breakHelp'),
        '<label class="switch"><input type="checkbox" id="s-break"' + (st.breakEnabled ? ' checked' : '') + '/><span></span></label>') +
      '<div class="sub-block break-times' + (st.breakEnabled ? '' : ' is-disabled') + '">' +
      '<label class="field"><span class="field-label">' + esc(t('form.start')) + '</span><input id="s-breakStart" type="time" value="' + esc(st.breakStart) + '"/></label>' +
      '<label class="field"><span class="field-label">' + esc(t('form.end')) + '</span><input id="s-breakEnd" type="time" value="' + esc(st.breakEnd) + '"/></label>' +
      '</div>');

    html += group(t('hg.title'),
      '<p class="group-help">' + esc(t('hg.help')) + '</p>' +
      '<div class="hg-options" id="s-hg">' +
      HG_STYLES.map(function (k) {
        return '<button type="button" class="hg-option' + (st.hgStyle === k ? ' on' : '') + '" data-val="' + k + '" style="' + colorVars('#0D9488') + '">' +
          '<span class="hg-preview">' + (k === 'off' ? '<span class="hg-off-line"></span>' : hourglassHtml('pv-' + k, k)) + '</span>' +
          '<span class="hg-name">' + esc(t('hg.' + k)) + '</span></button>';
      }).join('') + '</div>');

    const SC_LIST = (window.Scenes ? window.Scenes.LIST : []).concat(['none']);
    const scDay = state.sceneDay || 'fri';
    const scSel = (st.scenes || {})[scDay] || 'sea';
    html += group(t('scene.title'),
      '<p class="group-help">' + esc(t('scene.help')) + '</p>' +
      '<div class="scene-days" id="s-sceneDay">' + ['fri', 'sat', 'other'].map(function (d) {
        return '<button type="button" data-day="' + d + '" class="' + (d === scDay ? 'on' : '') + '">' + esc(t('scene.day_' + d)) + '</button>';
      }).join('') + '</div>' +
      '<div class="hg-options scene-options" id="s-scene">' + SC_LIST.map(function (k) {
        return '<button type="button" class="hg-option' + (scSel === k ? ' on' : '') + '" data-val="' + k + '">' +
          (k === 'none' ? '<span class="scene-pv none"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg></span>' : '<span class="scene-pv">' + window.Scenes.html(k) + '</span>') +
          '<span class="hg-name">' + esc(t('scene.' + k)) + '</span></button>';
      }).join('') + '</div>');

    html += group(t('dayEnd.title'),
      '<p class="group-help">' + esc(t('dayEnd.help')) + '</p>' +
      '<div class="hg-options de-options" id="s-dayend">' +
      DAYEND_STYLES.map(function (k) {
        return '<button type="button" class="hg-option' + (st.dayEndStyle === k ? ' on' : '') + '" data-val="' + k + '">' +
          '<span class="de-preview">' + bigHourglassHtml(k, 'pv' + k) + '</span>' +
          '<span class="hg-name">' + esc(t('hg.' + k)) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="field-label mq-label">' + esc(t('marquee.color')) + '</div>' +
      '<p class="group-help">' + esc(t('marquee.colorHelp')) + '</p>' +
      '<div class="mq-preview" style="--mq:' + esc(st.marqueeColor) + '"><span>' + esc(t('marquee.sample')) + '</span></div>' +
      '<div class="swatches" id="s-mq">' +
      ['#DC2626', '#111827', '#FFFFFF'].concat(S.PALETTE.filter(function (c) { return c !== '#DC2626'; })).map(function (c) {
        return '<button type="button" class="swatch' + (c === st.marqueeColor ? ' on' : '') + '" data-color="' + c + '" style="--sw:' + c + '" aria-label="' + c + '"></button>';
      }).join('') +
      '<button type="button" class="swatch swatch-custom" data-action="mq-custom" style="--sw:transparent" aria-label="' + esc(t('form.customColor')) + '">' + ICON.palette + '</button></div>');

    html += group(t('settings.reminders'),
      row(t('settings.notifEnabled'), t('settings.notifEnabledHelp'),
        '<label class="switch"><input type="checkbox" id="s-notif"' + (st.notifEnabled ? ' checked' : '') + '/><span></span></label>') +
      '<div class="sub-block' + (st.notifEnabled ? '' : ' is-disabled') + '">' +
      '<div class="field-label">' + esc(t('settings.leadTime')) + '</div>' +
      '<div class="chips" id="s-lead">' +
      leadOpts.map(function (m) { return '<button type="button" class="chip-btn' + (st.leadMinutes === m ? ' on' : '') + '" data-val="' + m + '">' + esc(t('form.minN', { m: m })) + '</button>'; }).join('') +
      '<button type="button" class="chip-btn' + (leadCustom ? ' on' : '') + '" data-val="custom">' + esc(t('form.custom')) + '</button></div>' +
      '<div class="custom-min" id="s-leadCustomWrap"' + (leadCustom || state.leadCustomOpen ? '' : ' hidden') + '><input id="s-leadCustom" type="number" inputmode="numeric" min="0" max="720" value="' + esc(st.leadMinutes) + '"/><span>' + esc(t('form.minBefore')) + '</span></div>' +
      '<div class="field-label">' + esc(t('settings.mutedDays')) + '</div>' +
      '<p class="group-help">' + esc(t('settings.mutedDaysHelp')) + '</p>' +
      '<div class="chips day-chips" data-daylist="mutedDays">' +
      S.DAYS.map(function (d) { return '<button type="button" class="chip-btn' + (st.mutedDays.indexOf(d) !== -1 ? ' on warn' : '') + '" data-day="' + d + '">' + esc(I.dayShort(d)) + '</button>'; }).join('') + '</div>' +
      '<div class="field-label">' + esc(t('sound.title')) + '</div>' +
      (N.isNative() ? '<div class="sound-box"><div class="sound-name">' + ICON.bell + '<span id="soundName">' + esc(t('sound.default')) + '</span></div>' +
        '<div class="sound-btns"><button type="button" class="btn btn-tonal" data-action="sound-pick">' + esc(t('sound.pick')) + '</button>' +
        '<button type="button" class="btn btn-text" data-action="sound-preview">' + esc(t('sound.preview')) + '</button>' +
        '<button type="button" class="btn btn-text" data-action="sound-reset" id="soundReset" hidden>' + esc(t('sound.reset')) + '</button></div>' +
        '<p class="group-help">' + esc(t('sound.help')) + '</p></div>'
        : '<p class="group-help">' + esc(t('perm.webOnly')) + '</p>') +
      '</div>' +
      '<div id="permBlock" class="perm-block">' + (N.isNative() ? '<div class="loading-line"></div>' : '<p class="group-help">' + esc(t('perm.webOnly')) + '</p>') + '</div>');

    html += group(t('words.title'),
      '<p class="group-help">' + esc(t('words.help')) + '</p>' +
      '<textarea id="s-words" class="words-box" rows="4" maxlength="4000" placeholder="' + esc(t('words.ph')) + '">' + esc(st.wordMap || '') + '</textarea>');

    html += group(t('att.hubTitle'),
      actionRow('students', t('att.hubRow'), t('att.hubHelp')));

    html += group(t('period.title'),
      actionRow('edit-periods', t('period.edit'), t('period.settingsHelp')));

    html += group(t('profile.title'),
      actionRow('edit-profile', t('profile.settingsRow'), t('profile.settingsHelp')));

    html += group(t('settings.data'),
      actionRow('backup', t('settings.backup'), t('settings.backupHelp')) +
      actionRow('restore', t('settings.restore'), t('settings.restoreHelp')) +
      actionRow('save-image', t('settings.saveImage'), t('settings.saveImageHelp')) +
      actionRow('save-pdf', t('settings.savePdf'), t('settings.savePdfHelp')) +
      actionRow('clear-all', t('settings.clearAll'), t('settings.clearAllHelp'), true));

    html += group(t('settings.about'),
      '<div class="about"><div class="about-logo"></div><div><strong>' + esc(t('app.name')) + '</strong>' +
      '<span id="appVersion">' + esc(t('settings.version', { v: '1.0' })) + '</span></div></div>' +
      '<p class="group-help">' + esc(t('settings.privacy')) + '</p>' +
      '<p class="group-help small">' + esc(t('settings.fontCredit')) + '</p>');

    html += '<div class="save-bar' + (state.dirty ? ' is-dirty' : '') + '">' +
      '<span>' + esc(state.dirty ? t('settings.unsaved') : t('settings.allSaved')) + '</span>' +
      '<button type="button" class="btn btn-primary" data-action="save-settings"' + (state.dirty ? '' : ' disabled') + '>' + ICON.check + esc(t('settings.saveBtn')) + '</button></div>';

    $('#view').innerHTML = html;
    bindSettings();
    if (N.isNative()) fillPermBlock();
    fillVersion();
  }

  function group(title, inner) {
    return '<section class="settings-group"><h2>' + esc(title) + '</h2><div class="settings-card">' + inner + '</div></section>';
  }

  function row(label, help, control) {
    return '<div class="set-row"><div class="set-text"><span>' + esc(label) + '</span>' + (help ? '<small>' + esc(help) + '</small>' : '') + '</div>' + control + '</div>';
  }

  function actionRow(action, label, help, danger) {
    return '<button type="button" class="set-row set-action' + (danger ? ' danger' : '') + '" data-action="' + action + '"><div class="set-text"><span>' + esc(label) + '</span><small>' + esc(help) + '</small></div><span class="chev">›</span></button>';
  }

  async function fillVersion() {
    const P = window.Capacitor && window.Capacitor.Plugins;
    if (!N.isNative() || !P || !P.App) return;
    try {
      const info = await P.App.getInfo();
      const el = $('#appVersion');
      if (el) el.textContent = t('settings.version', { v: I.digits(info.version + ' (' + info.build + ')') });
    } catch (e) { /* ignore */ }
  }

  async function fillPermBlock() {
    const el = $('#permBlock');
    if (!el) return;
    const perm = await N.permission();
    const exact = await N.exactAlarm();
    const st = await N.status();
    const pending = st ? st.count : null;
    if (!$('#permBlock')) return;

    function statusChip(ok) {
      return '<span class="status-chip ' + (ok ? 'ok' : 'bad') + '">' + esc(ok ? t('perm.on') : t('perm.off')) + '</span>';
    }
    let html = '<div class="field-label">' + esc(t('perm.title')) + '</div>';
    html += '<div class="perm-row"><div class="set-text"><span>' + esc(t('perm.notif')) + '</span><small>' + esc(t('perm.notifHelp')) + '</small></div>' + statusChip(perm === 'granted') + '</div>';
    if (perm !== 'granted') {
      html += '<button type="button" class="btn btn-tonal btn-block" data-action="ask-perm">' + esc(t('perm.allow')) + '</button>';
      if (perm === 'denied') html += '<p class="group-help warn-text">' + esc(t('perm.deniedHelp')) + '</p>';
    }
    if (exact !== 'unsupported') {
      html += '<div class="perm-row"><div class="set-text"><span>' + esc(t('perm.exact')) + '</span><small>' + esc(t('perm.exactHelp')) + '</small></div>' + statusChip(exact === 'granted') + '</div>';
      if (exact !== 'granted') html += '<button type="button" class="btn btn-tonal btn-block" data-action="ask-exact">' + esc(t('perm.openExact')) + '</button>';
    }
    if (pending !== null) html += '<p class="group-help">' + esc(t('perm.pending', { n: pending })) + '</p>';
    if (st && st.next > 0) {
      const nd = new Date(st.next);
      const hm = String(nd.getHours()).padStart(2, '0') + ':' + String(nd.getMinutes()).padStart(2, '0');
      html += '<p class="group-help next-alarm">' + ICON.bell + esc(t('perm.nextAlarm', { day: I.dayName(S.dayKeyOf(nd)), date: I.formatDate(nd), time: I.formatTime(hm, S.settings.timeFormat) })) + '</p>';
    }
    if (st && st.channelImportance === 0) html += '<p class="group-help warn-text">' + esc(t('perm.channelOff')) + '</p>';
    html += '<p class="group-help">' + esc(t('perm.batteryTip')) + '</p>';
    html += '<button type="button" class="btn btn-text btn-block" data-action="test-notif">' + ICON.bell + esc(t('perm.test')) + '</button>';
    el.innerHTML = html;
  }

  // সেটিংসে কিছু বদলালে তা খসড়ায় থাকে; "সংরক্ষণ করুন" চাপলে তবেই কাজে লাগে
  function updateSoundLabel(r) {
    const el = $('#soundName');
    if (!el || !r) return;
    el.textContent = r.uri ? (r.title || t('sound.custom')) : t('sound.default');
    const reset = $('#soundReset');
    if (reset) reset.hidden = !r.uri;
  }

  function changeDraft(fn) {
    fn(state.draft);
    state.dirty = true;
    const y = window.scrollY;
    renderSettings();
    window.scrollTo(0, y);
  }

  function bindSettings() {
    const view = $('#view');
    if (N.isNative()) N.sound('get').then(updateSoundLabel);
    $$('.seg[data-setting]', view).forEach(function (seg) {
      seg.addEventListener('click', function (e) {
        const b = e.target.closest('button');
        if (!b) return;
        const key = seg.getAttribute('data-setting');
        const val = b.getAttribute('data-val');
        if (state.draft[key] === val) return;
        changeDraft(function (d) { d[key] = val; });
      });
    });

    $$('[data-daylist]', view).forEach(function (wrap) {
      wrap.addEventListener('click', function (e) {
        const b = e.target.closest('.chip-btn');
        if (!b) return;
        const key = wrap.getAttribute('data-daylist');
        const d = b.getAttribute('data-day');
        changeDraft(function (dr) {
          const i = dr[key].indexOf(d);
          if (i === -1) dr[key].push(d); else dr[key].splice(i, 1);
        });
      });
    });

    $('#s-notif').addEventListener('change', function (e) {
      const on = e.target.checked;
      changeDraft(function (d) { d.notifEnabled = on; });
    });

    $('#s-sceneDay').addEventListener('click', function (e) {
      const b = e.target.closest('button[data-day]');
      if (!b || state.sceneDay === b.getAttribute('data-day')) return;
      state.sceneDay = b.getAttribute('data-day');
      const y = window.scrollY; renderSettings(); window.scrollTo(0, y);
    });
    $('#s-scene').addEventListener('click', function (e) {
      const b = e.target.closest('.hg-option');
      if (!b) return;
      const v = b.getAttribute('data-val'), day = state.sceneDay || 'fri';
      if ((state.draft.scenes || {})[day] === v) return;
      changeDraft(function (d) { d.scenes = Object.assign({ fri: 'sea', sat: 'hill', other: 'river' }, d.scenes); d.scenes[day] = v; });
    });

    $('#s-dayend').addEventListener('click', function (e) {
      const b = e.target.closest('.hg-option');
      if (!b) return;
      const v = b.getAttribute('data-val');
      if (state.draft.dayEndStyle === v) return;
      changeDraft(function (d) { d.dayEndStyle = v; });
    });

    $('#s-words').addEventListener('input', function (e) {
      state.draft.wordMap = e.target.value;
      if (!state.dirty) {
        state.dirty = true;
        const bar = $('.save-bar');
        bar.classList.add('is-dirty');
        $('span', bar).textContent = t('settings.unsaved');
        $('button', bar).disabled = false;
      }
    });

    $('#s-mq').addEventListener('click', function (e) {
      const b = e.target.closest('.swatch');
      if (!b) return;
      if (b.getAttribute('data-action') === 'mq-custom') {
        openColorPicker(state.draft.marqueeColor, function (hex) { changeDraft(function (d) { d.marqueeColor = hex; }); });
        return;
      }
      const v = b.getAttribute('data-color');
      if (state.draft.marqueeColor === v) return;
      changeDraft(function (d) { d.marqueeColor = v; });
    });

    $('#s-hg').addEventListener('click', function (e) {
      const b = e.target.closest('.hg-option');
      if (!b) return;
      const v = b.getAttribute('data-val');
      if (state.draft.hgStyle === v) return;
      changeDraft(function (d) { d.hgStyle = v; });
    });

    $('#s-break').addEventListener('change', function (e) {
      const on = e.target.checked;
      changeDraft(function (d) { d.breakEnabled = on; });
    });
    ['#s-breakStart', '#s-breakEnd'].forEach(function (sel) {
      $(sel).addEventListener('change', function () {
        const a = $('#s-breakStart').value, b = $('#s-breakEnd').value;
        if (!a || !b) return;
        if (S.toMin(b) <= S.toMin(a)) { toast(t('form.endBeforeStart')); return; }
        changeDraft(function (d) { d.breakStart = a; d.breakEnd = b; });
      });
    });

    $('#s-lead').addEventListener('click', function (e) {
      const b = e.target.closest('.chip-btn');
      if (!b) return;
      const v = b.getAttribute('data-val');
      if (v === 'custom') {
        state.leadCustomOpen = true;
        $$('#s-lead .chip-btn').forEach(function (x) { x.classList.toggle('on', x === b); });
        $('#s-leadCustomWrap').hidden = false;
        $('#s-leadCustom').focus();
        return;
      }
      state.leadCustomOpen = false;
      changeDraft(function (d) { d.leadMinutes = parseInt(v, 10); });
    });

    $('#s-leadCustom').addEventListener('input', function (e) {
      const n = parseInt(I.toAsciiDigits(e.target.value), 10);
      if (isNaN(n) || n < 0 || n > 720) return;
      state.draft.leadMinutes = n;
      if (!state.dirty) {
        state.dirty = true;
        const bar = $('.save-bar');
        bar.classList.add('is-dirty');
        $('span', bar).textContent = t('settings.unsaved');
        $('button', bar).disabled = false;
      }
    });
  }

  async function saveSettings() {
    const d = state.draft;
    if (!d) return;
    const custom = $('#s-leadCustom');
    if (custom && !$('#s-leadCustomWrap').hidden) {
      const n = parseInt(I.toAsciiDigits(custom.value), 10);
      if (isNaN(n) || n < 0 || n > 720) { toast(t('settings.leadInvalid')); custom.focus(); return; }
      d.leadMinutes = n;
    }
    const prev = S.settings;
    const next = Object.assign({}, d, {
      profile: prev.profile,
      mutedDates: prev.mutedDates,
      periods: prev.periods,
      weekMode: prev.weekMode
    });
    S.data.settings = next;
    if (!S.save()) { infoDialog(t('error.title'), t('settings.saveFail')); return; }
    if (next.lang !== prev.lang) {
      await I.setLang(next.lang);
      I.apply();
      await N.createChannel();
    }
    applyTheme();
    if (next.notifEnabled && !prev.notifEnabled && N.isNative()) {
      const p = await N.permission();
      if (p !== 'granted') await N.requestPermission();
    }
    N.reschedule();
    state.draft = null;
    state.dirty = false;
    state.leadCustomOpen = false;
    const y = window.scrollY;
    renderSettings();
    window.scrollTo(0, y);
    toast(t('settings.saved'));
  }

  // সেটিংসে সেভ না করা পরিবর্তন থাকলে বের হওয়ার আগে জিজ্ঞেস করা
  async function canLeaveSettings() {
    if (state.view !== 'settings' || !state.dirty) return true;
    const discard = await confirmDialog({
      title: t('settings.leaveTitle'),
      message: t('settings.leaveText'),
      okText: t('settings.leaveOk'),
      cancelText: t('settings.leaveStay')
    });
    if (discard) { state.draft = null; state.dirty = false; state.leadCustomOpen = false; }
    return discard;
  }

  /* ---------------- বোতামের কাজ (event delegation) ---------------- */

  async function handleAction(action, el) {
    switch (action) {
      case 'add':
        navigate('add', { day: el.getAttribute('data-day'), start: el.getAttribute('data-start'), end: el.getAttribute('data-end') });
        break;
      case 'edit-periods':
        openPeriodSheet();
        break;
      case 'cal-today': {
        const d = new Date();
        state.calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
        state.calSel = S.isoDate(d);
        renderCalendar();
        break;
      }
      case 'cal-add':
        openEventSheet(null, state.calSel);
        break;
      case 'toggle-mute-today': {
        const iso = S.isoDate(new Date());
        const dayKey = S.dayKeyOf(new Date());
        const arr = S.settings.mutedDates;
        const i = arr.indexOf(iso);
        if (S.settings.mutedDays.indexOf(dayKey) !== -1) {
          toast(t('today.mutedByDay'));
          break;
        }
        if (i === -1) arr.push(iso); else arr.splice(i, 1);
        S.save();
        N.reschedule();
        toast(i === -1 ? t('today.mutedOn') : t('today.mutedOff'));
        renderToday();
        break;
      }
      case 'week-mode':
        S.settings.weekMode = el.getAttribute('data-mode');
        S.save();
        renderWeek();
        break;
      case 'copy-class':
        openCopySheet(state.editId);
        break;
      case 'delete-class': {
        const c = S.getClass(state.editId);
        if (!c) break;
        const yes = await confirmDialog({
          title: t('delete.title'),
          message: t('delete.text', { subject: c.subject || t('form.untitled'), day: I.dayName(c.day), time: fmtTime(c.start) }),
          okText: t('delete.ok'),
          danger: true
        });
        if (!yes) break;
        S.deleteClass(c.id);
        N.reschedule();
        toast(t('delete.done'));
        navigate(state.prevView || 'week');
        break;
      }
      case 'save-lead': {
        const n = parseInt(I.toAsciiDigits($('#s-leadCustom').value), 10);
        if (isNaN(n) || n < 0 || n > 720) { toast(t('settings.leadInvalid')); break; }
        S.settings.leadMinutes = n;
        S.save();
        N.reschedule();
        toast(t('settings.leadSaved', { m: n }));
        break;
      }
      case 'ask-perm': {
        const r = await N.requestPermission();
        if (r === 'granted') { await N.reschedule(); toast(t('perm.granted')); }
        else infoDialog(t('perm.deniedTitle'), t('perm.deniedHelp'));
        fillPermBlock();
        break;
      }
      case 'ask-exact':
        await N.openExactAlarmSettings();
        setTimeout(function () { N.reschedule(); fillPermBlock(); }, 800);
        break;
      case 'attendance':
        openAttendanceSheet(el.getAttribute('data-id'));
        break;
      case 'students':
        openStudentsHub();
        break;
      case 'sound-pick': {
        const r = await N.sound('pick', t('sound.pickTitle'));
        updateSoundLabel(r);
        if (r && !r.cancelled) { toast(t('sound.changed')); N.reschedule(); }
        break;
      }
      case 'sound-reset': {
        const r = await N.sound('reset');
        updateSoundLabel(r);
        toast(t('sound.resetDone'));
        N.reschedule();
        break;
      }
      case 'sound-preview':
        await N.sound('preview');
        break;
      case 'test-notif': {
        const r = await N.test();
        if (r === 'granted') toast(t('perm.testSent'));
        else if (r === 'unsupported') toast(t('perm.webOnly'));
        else infoDialog(t('perm.deniedTitle'), t('perm.deniedHelp'));
        break;
      }
      case 'backup':
        await runExport(E.backup, t('settings.backup'));
        break;
      case 'save-image':
        await runExport(E.saveImage, t('settings.saveImage'));
        break;
      case 'save-pdf':
        await runExport(E.savePdf, t('settings.savePdf'));
        break;
      case 'save-settings':
        await saveSettings();
        break;
      case 'edit-profile':
        openProfileSheet();
        break;
      case 'restore':
        $('#restoreInput').value = '';
        $('#restoreInput').click();
        break;
      case 'clear-all': {
        const yes = await confirmDialog({ title: t('clear.title'), message: t('clear.text'), okText: t('clear.ok'), danger: true });
        if (!yes) break;
        S.clearAll();
        N.reschedule();
        toast(t('clear.done'));
        renderSettings();
        break;
      }
      default:
        break;
    }
  }

  async function runExport(fn, label) {
    if (S.data.classes.length === 0 && fn !== E.backup) { toast(t('week.empty')); return; }
    toast(t('export.working'));
    try {
      const r = await fn();
      if (r.where === 'download') { toast(t('export.downloaded')); return; }
      const msg = r.where === 'documents' ? t('export.savedDocs', { name: r.name }) : t('export.savedCache');
      toast(msg, { label: t('export.share'), run: function () { E.share(r, label); } });
      if (r.where === 'cache') E.share(r, label);
    } catch (e) {
      console.error(e);
      infoDialog(t('error.title'), t('export.failed'));
    }
  }

  async function handleRestoreFile(file) {
    if (!file) return;
    let text = '';
    try {
      text = await file.text();
    } catch (e) {
      infoDialog(t('error.title'), t('restore.readFail'));
      return;
    }
    const parsed = E.parseBackup(text);
    if (!parsed) {
      infoDialog(t('error.title'), t('restore.invalid'));
      return;
    }
    const yes = await confirmDialog({
      title: t('restore.title'),
      message: t('restore.text', { n: parsed.classes.length }),
      okText: t('restore.ok'),
      danger: true
    });
    if (!yes) return;
    S.replaceAll(parsed);
    state.loadError = false;
    await I.setLang(S.settings.lang);
    I.apply();
    applyTheme();
    await N.createChannel();
    N.reschedule();
    toast(t('restore.done', { n: parsed.classes.length }));
    navigate('today');
  }

  /* ---------------- শুরু ---------------- */

  function bindGlobal() {
    $('#bottomNav').addEventListener('click', async function (e) {
      const b = e.target.closest('.nav-btn');
      if (!b) return;
      const v = b.getAttribute('data-nav');
      if (v === 'settings' && state.view === 'settings') return;
      if (!(await canLeaveSettings())) return;
      if (v === 'add') navigate('add');
      else navigate(v);
    });

    document.addEventListener('click', function (e) {
      const a = e.target.closest('[data-action]');
      if (a && !a.closest('.seg[data-setting]')) {
        handleAction(a.getAttribute('data-action'), a);
        return;
      }
      const prep = e.target.closest('[data-prep]');
      if (prep) {
        openPrepSheet(prep.getAttribute('data-prep'), prep.getAttribute('data-label'));
        return;
      }
      const card = e.target.closest('.class-card, .grid-cell');
      if (card && !e.target.closest('.drag-handle') && $('#view').contains(card)) {
        navigate('form', { id: card.getAttribute('data-id') });
      }
    });

    // কিবোর্ড খুললে যে ঘরে লেখা হচ্ছে সেটা মাঝখানে এনে দেখানো
    const isTextInput = function (el) {
      if (!el) return false;
      if (el.tagName === 'TEXTAREA') return true;
      return el.tagName === 'INPUT' && ['text', 'search', 'number', 'tel', 'email', 'url'].indexOf(el.type) !== -1;
    };
    document.addEventListener('focusin', function (e) {
      if (!isTextInput(e.target)) return;
      document.body.classList.add('kb-open');
      const target = e.target;
      [150, 450].forEach(function (ms) {
        setTimeout(function () {
          if (document.activeElement === target) target.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }, ms);
      });
    });
    document.addEventListener('focusout', function (e) {
      if (!isTextInput(e.target)) return;
      setTimeout(function () { if (!isTextInput(document.activeElement)) document.body.classList.remove('kb-open'); }, 100);
    });
    if (window.visualViewport) {
      const vv = window.visualViewport;
      const upd = function () {
        const kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
        document.documentElement.style.setProperty('--kb', kb + 'px');
        const a = document.activeElement;
        if (kb > 0 && isTextInput(a)) a.scrollIntoView({ block: 'center' });
      };
      vv.addEventListener('resize', upd);
    }
    // কিবোর্ড খুললে (Android 15+ এ নেটিভ কোড WebView ছোট করে দেয়) পেজের আকার বদলায়;
    // তখন আবার লেখার ঘরটাকে দৃশ্যমান জায়গার মাঝখানে আনা হয়
    let resizeTimer = null;
    window.addEventListener('resize', function () {
      if (state.view === 'today') setTimeout(fitDayEnd, 80);
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        const a = document.activeElement;
        if (isTextInput(a)) a.scrollIntoView({ block: 'center' });
      }, 60);
    });

    $('#restoreInput').addEventListener('change', function (e) {
      handleRestoreFile(e.target.files && e.target.files[0]);
    });

    if (darkQuery) {
      const onChange = function () { if (S.settings.theme === 'system') applyTheme(); };
      if (darkQuery.addEventListener) darkQuery.addEventListener('change', onChange);
      else if (darkQuery.addListener) darkQuery.addListener(onChange);
    }

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) onResume();
    });

    const P = window.Capacitor && window.Capacitor.Plugins;
    if (N.isNative() && P && P.App) {
      P.App.addListener('backButton', function () {
        if (!goBack()) P.App.exitApp();
      });
      P.App.addListener('appStateChange', function (s) {
        if (s.isActive) onResume();
      });
    }
    if (N.isNative() && P && P.LocalNotifications) {
      // নোটিফিকেশনে চাপ দিলে সেই ক্লাসটা খুলবে
      P.LocalNotifications.addListener('localNotificationActionPerformed', function (ev) {
        const id = ev && ev.notification && ev.notification.extra && ev.notification.extra.classId;
        if (id && S.getClass(id)) navigate('today');
      });
    }
  }

  let lastResume = 0;
  function onResume() {
    const now = Date.now();
    if (now - lastResume < 1500) return;
    lastResume = now;
    if (state.view === 'today') updateLive();
    // সামনের দিনগুলোর রিমাইন্ডার আবার এগিয়ে নেওয়া
    N.reschedule();
    if (state.view === 'settings') fillPermBlock();
  }

  /* ---------------- শিক্ষকের প্রোফাইল ---------------- */

  // বর্তমান ভাষার প্রোফাইল; কোনো ঘর ফাঁকা থাকলে অন্য ভাষার লেখা দেখায়
  function profileFor(lang) {
    const p = S.settings.profile;
    const main = p[lang === 'en' ? 'en' : 'bn'];
    const other = p[lang === 'en' ? 'bn' : 'en'];
    const out = { photo: p.photo };
    ['name', 'designation', 'subject', 'institution', 'city'].forEach(function (k) {
      out[k] = main[k] || other[k] || '';
    });
    return out;
  }

  function profileCardHtml() {
    const p = profileFor(I.getLang());
    const has = p.photo || p.name || p.designation || p.subject || p.institution || p.city;
    if (!has) {
      return '<div class="profile-card profile-empty">' +
        '<span class="profile-photo placeholder">' + ICON.people + '</span>' +
        '<span class="profile-text"><strong>' + esc(t('profile.addPrompt')) + '</strong><small>' + esc(t('profile.addPromptHelp')) + '</small></span></div>';
    }
    const line2 = [p.designation, p.subject].filter(Boolean).join(', ');
    // শুধু দেখার জন্য; সম্পাদনা কেবল সেটিংস থেকে
    return '<div class="profile-card">' +
      (p.photo ? '<img class="profile-photo" src="' + esc(p.photo) + '" alt="' + esc(p.name) + '"/>' :
        '<span class="profile-photo placeholder">' + ICON.people + '</span>') +
      '<span class="profile-text">' +
      (p.name ? '<strong>' + esc(p.name) + '</strong>' : '') +
      (line2 ? '<span class="profile-role">' + esc(line2) + '</span>' : '') +
      (p.institution ? '<span class="profile-inst one-line">' + esc(p.institution) + '</span>' : '') +
      (p.city ? '<small>' + esc(p.city) + '</small>' : '') +
      '</span></div>';
  }

  // প্রতিষ্ঠানের নাম এক লাইনে রাখতে লেখা ছোট করে আনা
  function fitOneLine(root) {
    $$('.one-line', root).forEach(function (el) {
      el.style.fontSize = '';
      let size = parseFloat(getComputedStyle(el).fontSize);
      while (el.scrollWidth > el.clientWidth + 1 && size > 10) {
        size -= 0.5;
        el.style.fontSize = size + 'px';
      }
    });
  }

  // ছবি কেটে পাসপোর্ট মাপে (৩৫×৪৫ অনুপাত) ছোট JPEG বানানো
  function makePassportPhoto(file) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () {
        const W = 350, H = 450, ratio = W / H;
        let sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
        if (sw / sh > ratio) { const nw = sh * ratio; sx = (sw - nw) / 2; sw = nw; }
        else { const nh = sw / ratio; sy = Math.max(0, (sh - nh) * 0.3); sh = nh; }
        const c = document.createElement('canvas');
        c.width = W; c.height = H;
        const ctx = c.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, W, H);
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, H);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  }

  function openProfileSheet() {
    const p = S.settings.profile;
    let photo = p.photo;
    let tab = I.getLang() === 'en' ? 'en' : 'bn';
    const draft = { bn: Object.assign({}, p.bn), en: Object.assign({}, p.en) };
    const fields = [
      ['name', 'profile.name', 'profile.namePh'],
      ['designation', 'profile.designation', 'profile.designationPh'],
      ['subject', 'profile.subject', 'profile.subjectPh'],
      ['institution', 'profile.institution', 'profile.institutionPh'],
      ['city', 'profile.city', 'profile.cityPh']
    ];
    const entry = openOverlay('sheet',
      '<div class="sheet-handle"></div><h2 class="sheet-title">' + esc(t('profile.title')) + '</h2>' +
      '<p class="sheet-sub">' + esc(t('profile.sub')) + '</p>' +
      '<div class="profile-edit-photo">' +
      '<div class="profile-photo big" id="pfPreview"></div>' +
      '<div class="profile-photo-btns">' +
      '<button type="button" class="btn btn-tonal" id="pfPick">' + esc(t('profile.pickPhoto')) + '</button>' +
      '<button type="button" class="btn btn-text" id="pfRemove">' + esc(t('profile.removePhoto')) + '</button>' +
      '<small>' + esc(t('profile.photoHelp')) + '</small></div>' +
      '<input type="file" id="pfFile" accept="image/*" hidden/></div>' +
      '<div class="seg seg-wide" id="pfTabs"><button type="button" data-val="bn">বাংলায় তথ্য</button><button type="button" data-val="en">In English</button></div>' +
      '<p class="field-help" id="pfTabHelp"></p>' +
      '<div id="pfFields">' + fields.map(function (f) {
        return '<label class="field"><span class="field-label">' + esc(t(f[1])) + '</span><input data-k="' + f[0] + '" maxlength="120"/></label>';
      }).join('') + '</div>' +
      '<div class="sheet-actions"><button type="button" class="btn btn-text" data-act="cancel">' + esc(t('common.cancel')) + '</button>' +
      '<button type="button" class="btn btn-primary" data-act="ok">' + esc(t('common.save')) + '</button></div>');
    const el = entry.el;
    const phByLang = {
      bn: { name: 'যেমন: মোঃ পলাশ মিয়া', designation: 'যেমন: প্রভাষক', subject: 'যেমন: অর্থনীতি', institution: 'প্রতিষ্ঠানের পূর্ণ নাম', city: 'যেমন: ঢাকা' },
      en: { name: 'e.g. MD. PALASH MIA', designation: 'e.g. Lecturer', subject: 'e.g. Economics', institution: 'Full name of the institution', city: 'e.g. Dhaka' }
    };
    function readFields() {
      $$('#pfFields input', el).forEach(function (inp) { draft[tab][inp.getAttribute('data-k')] = inp.value.trim(); });
    }
    function showTab() {
      $$('#pfTabs button', el).forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-val') === tab); });
      $$('#pfFields input', el).forEach(function (inp) {
        const k = inp.getAttribute('data-k');
        inp.value = draft[tab][k] || '';
        inp.placeholder = phByLang[tab][k];
        inp.lang = tab;
      });
      $('#pfTabHelp', el).textContent = t(tab === 'bn' ? 'profile.tabHelpBn' : 'profile.tabHelpEn');
    }
    $('#pfTabs', el).addEventListener('click', function (e) {
      const b = e.target.closest('button');
      if (!b) return;
      readFields();
      tab = b.getAttribute('data-val');
      showTab();
    });
    function paint() {
      $('#pfPreview', el).innerHTML = photo ? '<img src="' + esc(photo) + '" alt=""/>' : ICON.people;
      $('#pfPreview', el).classList.toggle('placeholder', !photo);
      $('#pfRemove', el).hidden = !photo;
      $('#pfPick', el).textContent = photo ? t('profile.changePhoto') : t('profile.pickPhoto');
    }
    paint();
    showTab();
    $('#pfPick', el).onclick = function () { $('#pfFile', el).value = ''; $('#pfFile', el).click(); };
    $('#pfFile', el).addEventListener('change', async function (e) {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      try { photo = await makePassportPhoto(f); paint(); }
      catch (err) { toast(t('profile.photoFail')); }
    });
    $('#pfRemove', el).onclick = function () { photo = ''; paint(); };
    $('[data-act="cancel"]', el).onclick = function () { closeOverlay(entry, true); };
    $('[data-act="ok"]', el).onclick = function () {
      readFields();
      S.settings.profile = { photo: photo || '', bn: draft.bn, en: draft.en };
      if (!S.save()) { toast(t('profile.saveFail')); return; }
      closeOverlay(entry, true);
      toast(t('profile.saved'));
      if (state.view === 'today') renderToday();
    };
  }

  /* প্রথমবার অ্যাপ খুললে আপনার রুটিন (www/data/default-routine.json) নিজে থেকে বসে যায়।
     একবার বসানোর পর আর কখনো আসবে না, তাই সব ক্লাস মুছে ফেললেও আবার ফিরে আসবে না। */
  const SEED_FLAG = 'classRoutine.defaultSeeded';
  async function seedDefaultRoutine() {
    try {
      if (localStorage.getItem(SEED_FLAG)) return;
      if (S.data.classes.length) { localStorage.setItem(SEED_FLAG, '1'); return; }
      const r = await fetch('data/default-routine.json', { cache: 'no-cache' });
      if (!r.ok) return;
      const parsed = S.sanitize(await r.json());
      if (!parsed || !parsed.classes.length) return;
      const settings = Object.assign({}, S.settings, { holidays: parsed.settings.holidays });
      S.replaceAll({ version: 1, classes: parsed.classes, settings: settings });
      localStorage.setItem(SEED_FLAG, '1');
      state.justSeeded = true;
    } catch (e) {
      console.warn('default routine not loaded', e);
    }
  }

  /* আপনার প্রোফাইল (ছবি ও বাংলা/ইংরেজি তথ্য) অ্যাপের ভেতরেই আছে: www/data/default-profile.json।
     নতুন করে ইনস্টল করলে প্রথমবার জিজ্ঞেস করে: আপনি নিজে হলে সব তথ্য বসে যায়,
     অন্য কেউ হলে ফাঁকা অ্যাপ থেকে নিজের মতো সাজিয়ে নিতে পারেন। */
  const OWNER_FLAG = 'classRoutine.ownerChoice';
  async function ownerProfile() {
    try {
      const r = await fetch('data/default-profile.json', { cache: 'no-cache' });
      return r.ok ? await r.json() : null;
    } catch (e) { return null; }
  }
  function profileEmpty(p) {
    return !p.photo && ['bn', 'en'].every(function (lg) { return !Object.keys(p[lg] || {}).some(function (k) { return p[lg][k]; }); });
  }
  // নিজের তথ্য: যে ঘর ফাঁকা, শুধু সেগুলো ভরে দেওয়া (আপনি নিজে কিছু বদলে থাকলে সেটাই থাকে)
  function applyOwnerProfile(own) {
    const cur = S.settings.profile;
    const next = { photo: cur.photo || own.photo || '', bn: Object.assign({}, cur.bn), en: Object.assign({}, cur.en) };
    ['bn', 'en'].forEach(function (lg) {
      Object.keys(own[lg] || {}).forEach(function (k) { if (!next[lg][k]) next[lg][k] = own[lg][k]; });
    });
    S.data.settings.profile = next;
    S.save();
  }
  async function askOwner() {
    if (localStorage.getItem(OWNER_FLAG)) return;
    const own = await ownerProfile();
    if (!own) return;
    const name = (I.getLang() === 'bn' ? own.bn.name : own.en.name) || own.bn.name;
    const entry = openOverlay('sheet',
      '<div class="sheet-handle"></div>' +
      '<div class="owner-pic"><img src="' + own.photo + '" alt=""/></div>' +
      '<h2 class="sheet-title owner-title">' + esc(t('owner.title')) + '</h2>' +
      '<p class="sheet-sub">' + esc(t('owner.text', { name: name })) + '</p>' +
      '<button type="button" class="btn btn-primary btn-block" data-owner="me">' + ICON.check + esc(t('owner.me', { name: name })) + '</button>' +
      '<button type="button" class="btn btn-tonal btn-block owner-other" data-owner="other">' + esc(t('owner.other')) + '</button>' +
      (N.isNative() ? '<button type="button" class="btn btn-text btn-block owner-other" data-owner="restore">' + esc(t('owner.restore')) + '</button>' : '') +
      '<p class="field-help owner-help">' + esc(state.justSeeded ? t('owner.otherHelpFresh') : t('owner.otherHelp')) + '</p>');
    entry.el.addEventListener('click', function (e) {
      const b = e.target.closest('[data-owner]');
      if (!b) return;
      if (b.getAttribute('data-owner') === 'restore') {
        // অ্যাপ মুছে আবার বসালে: Documents/ClassRoutine/auto-backup.json বেছে নিলেই সব ফিরে আসে
        localStorage.setItem(OWNER_FLAG, 'restored');
        closeOverlay(entry, true);
        $('#restoreInput').value = '';
        $('#restoreInput').click();
        return;
      }
      if (b.getAttribute('data-owner') === 'me') {
        applyOwnerProfile(own);
        localStorage.setItem(OWNER_FLAG, 'owner');
        toast(t('owner.meDone'));
      } else {
        localStorage.setItem(OWNER_FLAG, 'other');
        // সদ্য বসানো নমুনা রুটিন সরিয়ে ফাঁকা অ্যাপ (আগে থেকে থাকা নিজের তথ্য মোছা হয় না)
        if (state.justSeeded) {
          S.data.classes = [];
          S.data.settings.periods = [];
          S.save();
          N.reschedule();
        }
        toast(t('owner.otherDone'));
      }
      closeOverlay(entry, true);
      render();
    });
  }

  // কিছু বদলালেই কয়েক সেকেন্ড পরে চুপচাপ ব্যাকআপ ফাইল হালনাগাদ
  let autoBackupT = null;
  window.onStoreSaved = function () {
    if (!N.isNative()) return;
    clearTimeout(autoBackupT);
    autoBackupT = setTimeout(function () { E.autoBackup(); }, 3000);
  };

  async function boot() {
    const res = S.load();
    state.loadError = !res.ok;
    if (res.ok) await seedDefaultRoutine();
    try {
      await I.init(S.settings.lang);
    } catch (e) {
      console.error(e);
      document.getElementById('boot').innerHTML = '<p class="boot-error">Could not load app text. Please reinstall the app.<br>অ্যাপের লেখা লোড হয়নি। অ্যাপটি আবার ইনস্টল করুন।</p>';
      return;
    }
    applyTheme();
    I.apply();
    bindGlobal();
    render();
    const boot = document.getElementById('boot');
    $('#app').hidden = false;
    boot.classList.add('hide');
    setTimeout(function () { boot.remove(); }, 400);
    setTimeout(askOwner, 700);
    // প্রতি মিনিটের শুরুতে হালনাগাদ, যাতে ক্লাস শুরু/শেষের সাথে সাথেই হাইলাইট বদলায়
    const tickMinute = function () {
      updateLive();
      setTimeout(tickMinute, 60000 - (Date.now() % 60000) + 200);
    };
    setTimeout(tickMinute, 60000 - (Date.now() % 60000) + 200);
    setInterval(updateLive, 15000);
    setInterval(checkAttendanceSheet, 3000);
    setInterval(function () {
      if (state.view !== 'today' || document.hidden || (!$('#deClock') && !$('#nowClock'))) return;
      // রাত ১২টা পার হলে নতুন দিনের ক্লাস দেখানো
      if (S.isoDate(new Date()) !== state.renderedDay) { renderToday(); return; }
      tickDayEndClock();
      tickNowClock();
      tickCardTimer();
    }, 1000);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { updateLive(); fitDayEnd(); });
    try {
      await N.init();
    } catch (e) {
      console.error('notify init', e);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
