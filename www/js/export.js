/* Backup (JSON), Restore, রুটিনকে ছবি (PNG) বা PDF হিসেবে সেভ করা। */
(function () {
  'use strict';

  const t = function (k, p) { return window.I18N.t(k, p); };

  function plugins() {
    const c = window.Capacitor;
    return c && c.Plugins ? c.Plugins : {};
  }

  function stamp() {
    const d = new Date();
    const p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes());
  }

  function bytesToBase64(bytes) {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }

  function base64ToBytes(b64) {
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  /* ফাইল সেভ করা।
     ফোনে: Documents/ClassRoutine ফোল্ডারে রাখে, না পারলে অ্যাপের cache-এ রেখে শেয়ার মেনু খোলে।
     ব্রাউজারে: সাধারণ download। */
  async function saveFile(name, mime, payload, isText) {
    const native = window.Notify.isNative();
    const P = plugins();
    if (native && P.Filesystem) {
      const data = isText ? payload : bytesToBase64(payload);
      const opts = { path: 'ClassRoutine/' + name, data: data, recursive: true };
      if (isText) opts.encoding = 'utf8';
      let uri = null;
      let where = 'documents';
      try {
        const r = await P.Filesystem.writeFile(Object.assign({ directory: 'DOCUMENTS' }, opts));
        uri = r.uri;
      } catch (e) {
        console.warn('Documents write failed, using cache', e);
        const r = await P.Filesystem.writeFile(Object.assign({ directory: 'CACHE' }, opts));
        uri = r.uri;
        where = 'cache';
      }
      return { uri: uri, where: where, name: name };
    }
    // ব্রাউজার
    const blob = isText ? new Blob([payload], { type: mime }) : new Blob([payload], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
    return { uri: null, where: 'download', name: name };
  }

  async function share(result, title) {
    const P = plugins();
    if (!result || !result.uri || !P.Share) return false;
    try {
      await P.Share.share({ title: title, files: [result.uri], dialogTitle: title });
      return true;
    } catch (e) {
      return false; // ব্যবহারকারী শেয়ার বাতিল করলে এখানে আসে
    }
  }

  async function backup() {
    const payload = {
      app: 'class-routine',
      format: 1,
      exportedAt: new Date().toISOString(),
      data: window.Store.data
    };
    const text = JSON.stringify(payload, null, 2);
    return saveFile('routine-backup-' + stamp() + '.json', 'application/json', text, true);
  }

  // JSON লেখা পড়ে যাচাই করা। সফল হলে পরিষ্কার ডেটা দেয়, না হলে null।
  function parseBackup(text) {
    try {
      const raw = JSON.parse(String(text).replace(/^﻿/, ''));
      return window.Store.sanitize(raw);
    } catch (e) {
      return null;
    }
  }

  /* ---------- রুটিনের ছবি আঁকা ---------- */

  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function tint(hex, alpha) {
    const c = hexToRgb(hex);
    // সাদার সাথে মিশিয়ে হালকা রং
    const mix = function (v) { return Math.round(v * alpha + 255 * (1 - alpha)); };
    return 'rgb(' + mix(c.r) + ',' + mix(c.g) + ',' + mix(c.b) + ')';
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fitText(ctx, text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    let s = text;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
    return s + '…';
  }

  const FONT = '"Kalpurush", "Noto Sans Bengali", sans-serif';

  async function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.all([
        document.fonts.load('400 24px \"Kalpurush\"', 'অআ Aa'),
        document.fonts.load('600 24px \"Kalpurush\"', 'অআ Aa'),
        document.fonts.load('700 24px \"Kalpurush\"', 'অআ Aa')
      ]);
    } catch (e) { /* ফন্ট না পেলে সাধারণ ফন্টে আঁকবে */ }
  }

  async function renderCanvas() {
    await ensureFonts();
    const S = window.Store;
    const I = window.I18N;
    const fmt = S.settings.timeFormat;
    const days = S.DAYS;
    const rows = days.map(function (d) {
      return { day: d, holiday: S.settings.holidays.indexOf(d) !== -1, classes: S.classesForDay(d) };
    }).filter(function (r) { return !r.holiday || r.classes.length; });

    const slots = S.timeSlots(rows.map(function (r) { return r.classes; }));
    const maxCols = Math.max(1, slots.length);
    const slotIndex = {};
    slots.forEach(function (sl, i) { slotIndex[sl.start] = i; });
    const scale = 2;
    const M = 32, dayW = 180, cellW = 210, cellH = 128, gap = 10, headH = 110, colH = 54;
    const width = Math.max(900, M * 2 + dayW + maxCols * (cellW + gap));
    const height = M * 2 + headH + colH + Math.max(1, rows.length) * (cellH + gap) + 30;

    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    ctx.textBaseline = 'alphabetic';

    // পটভূমি
    ctx.fillStyle = '#F6F7FB';
    ctx.fillRect(0, 0, width, height);

    // শিরোনাম
    ctx.fillStyle = '#4F46E5';
    roundRect(ctx, M, M, width - M * 2, headH - 20, 18);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '700 32px ' + FONT;
    ctx.fillText(t('export.title'), M + 24, M + 46);
    ctx.font = '400 18px ' + FONT;
    ctx.fillText(I.formatDate(new Date()), M + 24, M + 74);

    // শিক্ষকের নাম, পদবী ও প্রতিষ্ঠান (শিরোনামের ডান পাশে)
    const pr = S.settings.profile || {};
    const lg = I.getLang() === 'en' ? 'en' : 'bn';
    const og = lg === 'en' ? 'bn' : 'en';
    const prof = { photo: pr.photo };
    ['name', 'designation', 'subject', 'institution', 'city'].forEach(function (k) {
      prof[k] = (pr[lg] && pr[lg][k]) || (pr[og] && pr[og][k]) || '';
    });
    let px = width - M - 24;
    if (prof.photo) {
      const img = await new Promise(function (res) {
        const im = new Image();
        im.onload = function () { res(im); };
        im.onerror = function () { res(null); };
        im.src = prof.photo;
      });
      if (img) {
        ctx.save();
        roundRect(ctx, px - 56, M + 9, 56, 72, 8);
        ctx.clip();
        ctx.drawImage(img, px - 56, M + 9, 56, 72);
        ctx.restore();
        px -= 72;
      }
    }
    ctx.textAlign = 'right';
    const role = [prof.designation, prof.subject].filter(Boolean).join(', ');
    const lines = [[prof.name, '700 20px '], [role, '400 16px '], [prof.institution, '400 15px '], [prof.city, '400 14px ']].filter(function (l) { return l[0]; });
    lines.forEach(function (l, i) {
      ctx.font = l[1] + FONT;
      ctx.fillStyle = i === 0 ? '#FFFFFF' : 'rgba(255,255,255,.88)';
      ctx.fillText(fitText(ctx, l[0], 560), px, M + 22 + i * 19);
    });
    ctx.textAlign = 'left';

    let y = M + headH;
    // কলামের মাথায় পিরিয়ড আর সময়
    slots.forEach(function (sl, i) {
      const hx = M + dayW + i * (cellW + gap) + 12;
      ctx.fillStyle = '#1E1B4B';
      ctx.font = '700 17px ' + FONT;
      ctx.fillText(t('week.period', { n: i + 1 }), hx, y + 20);
      ctx.fillStyle = '#64748B';
      ctx.font = '400 15px ' + FONT;
      ctx.fillText(fitText(ctx, I.formatTime(sl.start, fmt) + ' – ' + I.formatTime(sl.end, fmt), cellW - 16), hx, y + 42);
    });
    y += colH;
    if (!rows.length) {
      ctx.fillStyle = '#64748B';
      ctx.font = '500 22px ' + FONT;
      ctx.fillText(t('week.empty'), M + 24, y + 60);
    }

    rows.forEach(function (r) {
      // দিনের নাম
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, M, y, dayW - gap, cellH, 14);
      ctx.fill();
      ctx.fillStyle = '#1E1B4B';
      ctx.font = '700 22px ' + FONT;
      ctx.fillText(fitText(ctx, I.dayName(r.day), dayW - 34), M + 14, y + 52);
      ctx.font = '400 16px ' + FONT;
      ctx.fillStyle = r.holiday ? '#DC2626' : '#64748B';
      ctx.fillText(r.holiday ? t('week.holiday') : t('week.count', { n: r.classes.length }), M + 14, y + 80);

      const x0 = M + dayW;
      if (!r.classes.length) {
        ctx.fillStyle = '#94A3B8';
        ctx.font = '400 18px ' + FONT;
        ctx.fillText(r.holiday ? t('week.holiday') : t('week.noClass'), x0 + 12, y + 70);
      }
      const used = {};
      r.classes.forEach(function (c) {
        const si = slotIndex[c.start];
        if (used[si]) return; // একই সময়ে দুটি ক্লাস থাকলে প্রথমটিই দেখানো হয়
        used[si] = true;
        const x = M + dayW + si * (cellW + gap);
        ctx.fillStyle = tint(c.color, 0.16);
        roundRect(ctx, x, y, cellW, cellH, 14);
        ctx.fill();
        ctx.fillStyle = c.color;
        roundRect(ctx, x, y, 8, cellH, 4);
        ctx.fill();
        const tx = x + 20, tw = cellW - 32;
        ctx.fillStyle = '#0F172A';
        ctx.font = '700 21px ' + FONT;
        ctx.fillText(fitText(ctx, c.subject || t('form.untitled'), tw), tx, y + 34);
        ctx.fillStyle = '#334155';
        ctx.font = '500 16px ' + FONT;
        ctx.fillText(fitText(ctx, I.formatTime(c.start, fmt) + ' – ' + I.formatTime(c.end, fmt), tw), tx, y + 62);
        const cls = [c.grade, c.section].filter(Boolean).join('-');
        const line3 = [cls ? t('card.class') + ' ' + cls : '', c.room ? t('card.room') + ' ' + c.room : ''].filter(Boolean).join(' · ');
        ctx.font = '400 16px ' + FONT;
        ctx.fillText(fitText(ctx, line3, tw), tx, y + 88);
        if (c.note) {
          ctx.fillStyle = '#64748B';
          ctx.font = '400 14px ' + FONT;
          ctx.fillText(fitText(ctx, c.note, tw), tx, y + 112);
        }
      });
      y += cellH + gap;
    });

    ctx.fillStyle = '#94A3B8';
    ctx.font = '400 13px ' + FONT;
    ctx.fillText(t('app.name'), M, height - M + 6);
    return canvas;
  }

  function canvasBytes(canvas, mime, quality) {
    const url = canvas.toDataURL(mime, quality);
    return base64ToBytes(url.split(',')[1]);
  }

  async function saveImage() {
    const canvas = await renderCanvas();
    const bytes = canvasBytes(canvas, 'image/png');
    return saveFile('routine-' + stamp() + '.png', 'image/png', bytes, false);
  }

  /* ছোট্ট একটা PDF বানানো: একটি পাতায় রুটিনের JPEG ছবি। কোনো বাইরের লাইব্রেরি লাগে না। */
  function buildPdf(jpeg, imgW, imgH) {
    const landscape = imgW >= imgH;
    const pageW = landscape ? 842 : 595;
    const pageH = landscape ? 595 : 842;
    const margin = 24;
    const s = Math.min((pageW - margin * 2) / imgW, (pageH - margin * 2) / imgH);
    const dw = (imgW * s).toFixed(2);
    const dh = (imgH * s).toFixed(2);
    const dx = ((pageW - imgW * s) / 2).toFixed(2);
    const dy = ((pageH - imgH * s) / 2).toFixed(2);

    const enc = new TextEncoder();
    const parts = [];
    const offsets = [];
    let length = 0;
    function push(chunk) {
      const b = typeof chunk === 'string' ? enc.encode(chunk) : chunk;
      parts.push(b);
      length += b.length;
    }
    function obj(n, body) {
      offsets[n] = length;
      push(n + ' 0 obj\n');
      body.forEach(push);
      push('\nendobj\n');
    }

    push('%PDF-1.4\n');
    push(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
    obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
    obj(2, ['<< /Type /Pages /Kids [3 0 R] /Count 1 >>']);
    obj(3, ['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageW + ' ' + pageH + '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>']);
    obj(4, [
      '<< /Type /XObject /Subtype /Image /Width ' + imgW + ' /Height ' + imgH +
      ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n',
      jpeg,
      '\nendstream'
    ]);
    const content = 'q\n' + dw + ' 0 0 ' + dh + ' ' + dx + ' ' + dy + ' cm\n/Im0 Do\nQ\n';
    obj(5, ['<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream']);

    const xrefPos = length;
    let xref = 'xref\n0 6\n0000000000 65535 f \n';
    for (let i = 1; i <= 5; i++) xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    push(xref);
    push('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF\n');

    const out = new Uint8Array(length);
    let pos = 0;
    parts.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }

  async function savePdf() {
    const canvas = await renderCanvas();
    // JPEG-এ স্বচ্ছতা নেই, তাই আগে সাদা পটভূমিতে বসানো হয়েছে (renderCanvas নিজেই রং দিয়েছে)
    const jpeg = canvasBytes(canvas, 'image/jpeg', 0.92);
    const pdf = buildPdf(jpeg, canvas.width, canvas.height);
    return saveFile('routine-' + stamp() + '.pdf', 'application/pdf', pdf, false);
  }

  window.Exporter = {
    backup: backup,
    parseBackup: parseBackup,
    saveImage: saveImage,
    savePdf: savePdf,
    share: share
  };
})();
