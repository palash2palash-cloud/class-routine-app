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

  /* নিজে থেকে ব্যাকআপ: প্রতিবার কিছু বদলালে Documents/ClassRoutine/auto-backup.json এ চুপচাপ লেখা হয়।
     অ্যাপ মুছে আবার ইনস্টল করলে এই ফাইল থেকে সব ফিরিয়ে আনা যায়।
     আগের ইনস্টলের ফাইলে লেখার অনুমতি না থাকলে নতুন নামে লেখা হয়। */
  async function autoBackup() {
    const P = plugins();
    if (!window.Notify.isNative() || !P.Filesystem) return null;
    const text = JSON.stringify({ app: 'class-routine', format: 1, exportedAt: new Date().toISOString(), data: window.Store.data });
    const KEYN = 'classRoutine.autoBackupName';
    let name = null;
    try { name = localStorage.getItem(KEYN); } catch (e) { /* ignore */ }
    const tryWrite = async function (n) {
      await P.Filesystem.writeFile({ directory: 'DOCUMENTS', path: 'ClassRoutine/' + n, data: text, encoding: 'utf8', recursive: true });
      try { localStorage.setItem(KEYN, n); } catch (e) { /* ignore */ }
      return n;
    };
    try {
      return await tryWrite(name || 'auto-backup.json');
    } catch (e) {
      try {
        return await tryWrite('auto-backup-' + stamp() + '.json');
      } catch (e2) {
        console.warn('auto backup failed', e2);
        return null;
      }
    }
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

  const FONT = '"Montserrat", "Kalpurush", "Noto Sans Bengali", sans-serif';

  async function ensureFonts() {
    if (!document.fonts || !document.fonts.load) return;
    try {
      await Promise.all([
        document.fonts.load('400 24px \"Montserrat\"', 'Aa1'),
        document.fonts.load('500 24px \"Montserrat\"', 'Aa1'),
        document.fonts.load('600 24px \"Montserrat\"', 'Aa1'),
        document.fonts.load('700 24px \"Montserrat\"', 'Aa1'),
        document.fonts.load('400 24px \"Kalpurush\"', 'অআ Aa'),
        document.fonts.load('600 24px \"Kalpurush\"', 'অআ Aa'),
        document.fonts.load('700 24px \"Kalpurush\"', 'অআ Aa')
      ]);
    } catch (e) { /* ফন্ট না পেলে সাধারণ ফন্টে আঁকবে */ }
  }

  /* রুটিনের কলামগুলো সাজানো: ক্লাসের সময়গুলো, মাঝে বড় ফাঁক থাকলে খালি পিরিয়ড,
     আর সেটিংসে চালু থাকলে টিফিন বিরতি। */
  function buildColumns(slots, S) {
    const st = S.settings;
    const cols = slots.map(function (sl) { return { kind: 'class', start: sl.start, end: sl.end }; });
    const lens = slots.map(function (sl) { return S.toMin(sl.end) - S.toMin(sl.start); }).sort(function (a, b) { return a - b; });
    const typical = lens.length ? lens[Math.floor(lens.length / 2)] : 45;
    const brk = st.breakEnabled && slots.length ? { kind: 'break', start: st.breakStart, end: st.breakEnd } : null;
    const bs = brk ? S.toMin(brk.start) : 0, be = brk ? S.toMin(brk.end) : 0;
    // দুই ক্লাসের মাঝের ফাঁকা সময় (বিরতি বাদে) যদি প্রায় এক পিরিয়ডের সমান হয়, সেখানে খালি পিরিয়ড
    const extra = [];
    function addEmpty(a, b) {
      if (b - a >= Math.max(25, typical * 0.66)) extra.push({ kind: 'empty', start: S.fromMin(a), end: S.fromMin(b) });
    }
    for (let i = 0; i + 1 < slots.length; i++) {
      const a = S.toMin(slots[i].end), b = S.toMin(slots[i + 1].start);
      if (b <= a) continue;
      if (brk && bs < b && be > a) {
        addEmpty(a, Math.min(bs, b));
        addEmpty(Math.max(be, a), b);
      } else {
        addEmpty(a, b);
      }
    }
    let all = cols.concat(extra);
    if (brk) {
      // কোনো ক্লাস যদি বিরতির সময়ের ভেতরে পড়ে, তবুও বিরতির ঘর থাকবে, সময় অনুযায়ী জায়গায়
      all.push(brk);
    }
    all.sort(function (x, y) { return S.toMin(x.start) - S.toMin(y.start) || (x.kind === 'break' ? 1 : -1); });
    return all;
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

    const slots = S.mergedSlots(rows.map(function (r) { return r.classes; }));
    const cols = buildColumns(slots, S);
    const slotIndex = {};
    cols.forEach(function (col, i) { if (col.kind === 'class') slotIndex[col.start] = i; });
    const scale = 2;
    const M = 32, dayW = 180, cellW = 210, breakW = 110, cellH = 128, gap = 10, headH = 110, colH = 54;
    // প্রতিটি কলামের x অবস্থান (বিরতির কলাম সরু)
    const colX = [];
    let cx = M + dayW;
    cols.forEach(function (col) { colX.push(cx); col.w = col.kind === 'break' ? breakW : cellW; cx += col.w + gap; });
    const width = Math.max(900, cx - gap + M);
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
    // কলামের মাথায় পিরিয়ড আর সময় (বিরতির কলাম পিরিয়ড হিসেবে গোনা হয় না)
    let pn = 0;
    cols.forEach(function (col, i) {
      const hx = colX[i] + 12;
      const isBreak = col.kind === 'break';
      if (!isBreak) pn++;
      ctx.fillStyle = isBreak ? '#B45309' : '#1E1B4B';
      ctx.font = '700 17px ' + FONT;
      ctx.fillText(fitText(ctx, isBreak ? t('export.break') : t('week.period', { n: pn }), col.w - 16), hx, y + 20);
      ctx.fillStyle = '#64748B';
      ctx.font = '400 ' + (isBreak ? 12 : 15) + 'px ' + FONT;
      if (isBreak) {
        ctx.fillText(fitText(ctx, I.formatTime(col.start, fmt), col.w - 16), hx, y + 35);
        ctx.fillText(fitText(ctx, I.formatTime(col.end, fmt), col.w - 16), hx, y + 48);
      } else {
        ctx.fillText(fitText(ctx, I.formatTime(col.start, fmt) + ' – ' + I.formatTime(col.end, fmt), col.w - 16), hx, y + 42);
      }
    });
    y += colH;

    // বিরতির ঘর: সব দিনের সারি জুড়ে একটা লম্বা ফাঁকা ঘর, মাঝখানে "বিরতি" / "TIFFIN"
    if (rows.length) {
      const allH = rows.length * (cellH + gap) - gap;
      cols.forEach(function (col, i) {
        if (col.kind !== 'break') return;
        ctx.fillStyle = '#FEF3C7';
        roundRect(ctx, colX[i], y, col.w, allH, 14);
        ctx.fill();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 5]);
        roundRect(ctx, colX[i] + 1, y + 1, col.w - 2, allH - 2, 13);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.save();
        ctx.fillStyle = '#B45309';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = t('export.break');
        let size = 28;
        ctx.font = '700 ' + size + 'px ' + FONT;
        while (size > 14 && ctx.measureText(label).width > col.w - 16) {
          size -= 1;
          ctx.font = '700 ' + size + 'px ' + FONT;
        }
        ctx.fillText(label, colX[i] + col.w / 2, y + allH / 2);
        ctx.restore();
      });
    }
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
        const x = colX[si];
        ctx.fillStyle = tint(c.color, 0.16);
        roundRect(ctx, x, y, cellW, cellH, 14);
        ctx.fill();
        ctx.fillStyle = c.color;
        roundRect(ctx, x, y, 8, cellH, 4);
        ctx.fill();
        const tx = x + 20, tw = cellW - 32;
        ctx.fillStyle = '#0F172A';
        ctx.font = '700 21px ' + FONT;
        const L = window.Localize.loc;
        ctx.fillText(fitText(ctx, L(c.subject) || t('form.untitled'), tw), tx, y + 34);
        ctx.fillStyle = '#334155';
        ctx.font = '500 16px ' + FONT;
        ctx.fillText(fitText(ctx, I.formatTime(c.start, fmt) + ' – ' + I.formatTime(c.end, fmt), tw), tx, y + 62);
        const cls = window.Localize.classLabel(c);
        const line3 = [cls ? t('card.class') + ' ' + cls : '', c.room ? t('card.room') + ' ' + L(c.room) : ''].filter(Boolean).join(' · ');
        ctx.font = '400 16px ' + FONT;
        ctx.fillText(fitText(ctx, line3, tw), tx, y + 88);
        if (c.note) {
          ctx.fillStyle = '#64748B';
          ctx.font = '400 14px ' + FONT;
          ctx.fillText(fitText(ctx, L(c.note), tw), tx, y + 112);
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


  /* ---------- হাজিরার খাতা: এক্সেল (.xlsx) ও পিডিএফ ----------
     কোনো বাইরের লাইব্রেরি নেই: xlsx আসলে কয়েকটা XML ফাইলের zip, সেটা এখানেই বানানো হয়। */

  const CRC_TABLE = (function () {
    const tb = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      tb[n] = c >>> 0;
    }
    return tb;
  })();

  function crc32(bytes) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  // সংকোচন ছাড়া (store) zip
  function zipStore(files) {
    const enc = new TextEncoder();
    const chunks = [];
    const central = [];
    let offset = 0;
    const u16 = function (v) { return [v & 0xFF, (v >>> 8) & 0xFF]; };
    const u32 = function (v) { return [v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF]; };
    files.forEach(function (f) {
      const name = enc.encode(f.name);
      const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
      const crc = crc32(data);
      const head = [].concat([0x50, 0x4B, 0x03, 0x04], u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      chunks.push(new Uint8Array(head), name, data);
      central.push({ name: name, crc: crc, size: data.length, offset: offset });
      offset += head.length + name.length + data.length;
    });
    const cdStart = offset;
    central.forEach(function (c) {
      const h = [].concat([0x50, 0x4B, 0x01, 0x02], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c.crc), u32(c.size), u32(c.size), u16(c.name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(c.offset));
      chunks.push(new Uint8Array(h), c.name);
      offset += h.length + c.name.length;
    });
    const end = [].concat([0x50, 0x4B, 0x05, 0x06], u16(0), u16(0), u16(central.length), u16(central.length), u32(offset - cdStart), u32(cdStart), u16(0));
    chunks.push(new Uint8Array(end));
    const total = chunks.reduce(function (a, b) { return a + b.length; }, 0);
    const out = new Uint8Array(total);
    let pos = 0;
    chunks.forEach(function (b) { out.set(b, pos); pos += b.length; });
    return out;
  }

  function xmlEsc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function colName(i) {
    let s = '';
    i += 1;
    while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); }
    return s;
  }

  // খাতার তথ্য: শিক্ষার্থী, প্রতিটা ক্লাসের দিন, মোট হিসাব
  function attendanceTable(info) {
    const S = window.Store, I = window.I18N;
    const students = S.studentsOf(info.group);
    const records = S.attendanceFor(info.group, info.month);
    const sameDay = {};
    const cols = records.map(function (r) {
      sameDay[r.date] = (sameDay[r.date] || 0) + 1;
      const d = r.date.split('-');
      return { r: r, label: I.num(d[2] + '/' + d[1]), n: sameDay[r.date] };
    });
    cols.forEach(function (c) { if (sameDay[c.r.date] > 1) c.label += I.num(' (' + c.n + ')'); });
    const rows = students.map(function (st) {
      let p = 0, a = 0, l = 0;
      const marks = cols.map(function (c) {
        const m = c.r.marks[st.id] || '';
        if (m === 'P') p++; else if (m === 'A') a++; else if (m === 'L') l++;
        return m;
      });
      const taken = p + a + l;
      return { st: st, marks: marks, p: p, a: a, l: l, pct: taken ? Math.round((p + l) * 100 / taken) : null };
    });
    const dayTotals = cols.map(function (c, i) {
      return rows.filter(function (r) { return r.marks[i] === 'P' || r.marks[i] === 'L'; }).length;
    });
    return { students: students, cols: cols, rows: rows, dayTotals: dayTotals };
  }

  function attHeaderLines(info) {
    const S = window.Store;
    const lang = window.I18N.getLang();
    const prof = (S.settings.profile && S.settings.profile[lang]) || {};
    const teacher = [prof.name, [prof.designation, prof.subject].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
    return {
      title: t('att.sheetTitle') + ' · ' + info.label + (info.subject ? ' · ' + info.subject : ''),
      teacher: teacher,
      inst: [prof.institution, prof.city].filter(Boolean).join(', '),
      month: t('att.monthLine', { month: info.monthLabel })
    };
  }

  async function saveAttendanceXlsx(info) {
    const I = window.I18N;
    const tb = attendanceTable(info);
    const hl = attHeaderLines(info);
    const rows = [];
    // স্টাইল: 1 মোটা, 2 P সবুজ, 3 A লাল, 4 L হলুদ, 5 শিরোনামের ঘর, 6 মাঝ বরাবর, 7 বড় শিরোনাম
    const cell = function (r, c, v, style) {
      const ref = colName(c) + r;
      if (typeof v === 'number') return '<c r="' + ref + '"' + (style ? ' s="' + style + '"' : '') + '><v>' + v + '</v></c>';
      return '<c r="' + ref + '" t="inlineStr"' + (style ? ' s="' + style + '"' : '') + '><is><t xml:space="preserve">' + xmlEsc(v) + '</t></is></c>';
    };
    const addRow = function (cells) { rows.push('<row r="' + (rows.length + 1) + '">' + cells.join('') + '</row>'); };
    let r = 1;
    addRow([cell(r++, 0, hl.title, 7)]);
    if (hl.teacher) addRow([cell(r++, 0, hl.teacher, 1)]);
    if (hl.inst) addRow([cell(r++, 0, hl.inst)]);
    addRow([cell(r++, 0, hl.month)]);
    addRow([]); r++;
    const head = [t('att.colId'), t('att.colRoll'), t('att.colName')].concat(tb.cols.map(function (c) { return c.label; }), ['P', 'A', 'L', t('att.colPct')]);
    addRow(head.map(function (h, i) { return cell(r, i, h, 5); })); r++;
    tb.rows.forEach(function (row) {
      const cs = [cell(r, 0, row.st.sid), cell(r, 1, row.st.roll, 6), cell(r, 2, row.st.name)];
      row.marks.forEach(function (m, i) { cs.push(cell(r, 3 + i, m, m === 'P' ? 2 : m === 'A' ? 3 : m === 'L' ? 4 : 6)); });
      const k = 3 + tb.cols.length;
      cs.push(cell(r, k, row.p, 6), cell(r, k + 1, row.a, 6), cell(r, k + 2, row.l, 6), cell(r, k + 3, row.pct == null ? '' : row.pct + '%', 6));
      addRow(cs); r++;
    });
    const tot = [cell(r, 2, t('att.dayTotal'), 1)];
    tb.dayTotals.forEach(function (n, i) { tot.push(cell(r, 3 + i, n, 1)); });
    addRow(tot);
    let colsXml = '<cols><col min="1" max="1" width="14" customWidth="1"/><col min="2" max="2" width="7" customWidth="1"/><col min="3" max="3" width="26" customWidth="1"/>';
    if (tb.cols.length) colsXml += '<col min="4" max="' + (3 + tb.cols.length) + '" width="7.5" customWidth="1"/>';
    colsXml += '<col min="' + (4 + tb.cols.length) + '" max="' + (7 + tb.cols.length) + '" width="7" customWidth="1"/></cols>';
    const sheet = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
      colsXml + '<sheetData>' + rows.join('') + '</sheetData></worksheet>';
    const border = '<border><left style="thin"><color rgb="FFCBD5E1"/></left><right style="thin"><color rgb="FFCBD5E1"/></right><top style="thin"><color rgb="FFCBD5E1"/></top><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border>';
    const fill = function (rgb) { return '<fill><patternFill patternType="solid"><fgColor rgb="' + rgb + '"/><bgColor indexed="64"/></patternFill></fill>'; };
    const center = '<alignment horizontal="center" vertical="center"/>';
    const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="3"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font></fonts>' +
      '<fills count="6"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>' + fill('FFDCFCE7') + fill('FFFEE2E2') + fill('FFFEF3C7') + fill('FFE0E7FF') + '</fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border>' + border + '</borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="8">' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">' + center + '</xf>' +
      '<xf numFmtId="0" fontId="1" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">' + center + '</xf>' +
      '<xf numFmtId="0" fontId="1" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">' + center + '</xf>' +
      '<xf numFmtId="0" fontId="1" fillId="5" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1">' + center + '</xf>' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1">' + center + '</xf>' +
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '</cellXfs></styleSheet>';
    const files = [
      { name: '[Content_Types].xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>' },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Attendance" sheetId="1" r:id="rId1"/></sheets></workbook>' },
      { name: 'xl/_rels/workbook.xml.rels', data: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { name: 'xl/worksheets/sheet1.xml', data: sheet },
      { name: 'xl/styles.xml', data: styles }
    ];
    const bytes = zipStore(files);
    return saveFile(attFileName(info, 'xlsx'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', bytes, false);
  }

  function attFileName(info, ext) {
    const safe = String(info.group || 'class').replace(/[^\wঀ-৿-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'class';
    return 'attendance-' + safe + '-' + info.month + '.' + ext;
  }

  // পিডিএফ: প্রতি পাতায় কিছু শিক্ষার্থী, প্রতিটা পাতা একটা ছবি
  async function renderAttendancePages(info) {
    await ensureFonts();
    const tb = attendanceTable(info);
    const hl = attHeaderLines(info);
    const perPage = 26;
    const rowH = 30, headH = 34, top = 128;
    const wId = 120, wRoll = 54, wName = 230, wMark = 38, wTot = 44;
    const W = 24 + wId + wRoll + wName + Math.max(1, tb.cols.length) * wMark + 4 * wTot + 24;
    const pages = [];
    const chunks = [];
    for (let i = 0; i < Math.max(1, tb.rows.length); i += perPage) chunks.push(tb.rows.slice(i, i + perPage));
    chunks.forEach(function (chunk, pi) {
      const last = pi === chunks.length - 1;
      const H = top + headH + chunk.length * rowH + (last ? rowH + 20 : 20) + 40;
      const scale = 2;
      const cv = document.createElement('canvas');
      cv.width = W * scale; cv.height = H * scale;
      const ctx = cv.getContext('2d');
      ctx.scale(scale, scale);
      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#0F172A'; ctx.font = '700 22px ' + FONT; ctx.textBaseline = 'middle';
      ctx.fillText(fitText(ctx, hl.title, W - 48), 24, 34);
      ctx.font = '400 15px ' + FONT; ctx.fillStyle = '#334155';
      ctx.fillText(fitText(ctx, [hl.teacher, hl.inst].filter(Boolean).join(' · '), W - 48), 24, 64);
      ctx.fillText(fitText(ctx, hl.month + (chunks.length > 1 ? '   ·   ' + t('att.page', { n: window.I18N.num(pi + 1), total: window.I18N.num(chunks.length) }) : ''), W - 48), 24, 90);
      // শিরোনামের সারি
      const xs = [24];
      const widths = [wId, wRoll, wName].concat(tb.cols.map(function () { return wMark; }), [wTot, wTot, wTot, wTot + 10]);
      widths.forEach(function (w, i) { xs.push(xs[i] + w); });
      const heads = [t('att.colId'), t('att.colRoll'), t('att.colName')].concat(tb.cols.map(function (c) { return c.label; }), ['P', 'A', 'L', '%']);
      ctx.fillStyle = '#E0E7FF'; ctx.fillRect(24, top, xs[xs.length - 1] - 24, headH);
      ctx.fillStyle = '#1E1B4B'; ctx.font = '700 13px ' + FONT; ctx.textAlign = 'center';
      heads.forEach(function (h, i) {
        const w = widths[i];
        if (i >= 3 && i < 3 + tb.cols.length) {
          // তারিখ দুই লাইনে
          const parts = h.split(' ');
          ctx.font = '700 11px ' + FONT;
          ctx.fillText(parts[0], xs[i] + w / 2, top + (parts[1] ? 11 : headH / 2));
          if (parts[1]) ctx.fillText(parts[1], xs[i] + w / 2, top + 25);
          ctx.font = '700 13px ' + FONT;
        } else {
          ctx.fillText(fitText(ctx, h, w - 6), xs[i] + w / 2, top + headH / 2);
        }
      });
      let y = top + headH;
      chunk.forEach(function (row, ri) {
        if (ri % 2) { ctx.fillStyle = '#F8FAFC'; ctx.fillRect(24, y, xs[xs.length - 1] - 24, rowH); }
        ctx.font = '400 13px ' + FONT; ctx.fillStyle = '#0F172A';
        ctx.textAlign = 'left';
        ctx.fillText(fitText(ctx, window.I18N.num(row.st.sid), wId - 10), xs[0] + 6, y + rowH / 2);
        ctx.textAlign = 'center';
        ctx.fillText(fitText(ctx, window.I18N.num(row.st.roll), wRoll - 6), xs[1] + wRoll / 2, y + rowH / 2);
        ctx.textAlign = 'left';
        ctx.font = '400 14px ' + FONT;
        ctx.fillText(fitText(ctx, row.st.name, wName - 10), xs[2] + 6, y + rowH / 2);
        ctx.textAlign = 'center';
        row.marks.forEach(function (m, i) {
          const x = xs[3 + i];
          if (m) {
            ctx.fillStyle = m === 'P' ? '#DCFCE7' : m === 'A' ? '#FEE2E2' : '#FEF3C7';
            ctx.fillRect(x + 3, y + 4, wMark - 6, rowH - 8);
            ctx.fillStyle = m === 'P' ? '#166534' : m === 'A' ? '#B91C1C' : '#92400E';
            ctx.font = '700 13px ' + FONT;
            ctx.fillText(m, x + wMark / 2, y + rowH / 2);
          }
        });
        const k = 3 + tb.cols.length;
        ctx.fillStyle = '#0F172A'; ctx.font = '600 13px ' + FONT;
        [row.p, row.a, row.l].forEach(function (v, i) { ctx.fillText(window.I18N.num(v), xs[k + i] + wTot / 2, y + rowH / 2); });
        ctx.fillText(row.pct == null ? '-' : window.I18N.num(row.pct) + '%', xs[k + 3] + (wTot + 10) / 2, y + rowH / 2);
        y += rowH;
      });
      if (last && tb.cols.length) {
        ctx.fillStyle = '#EEF2FF'; ctx.fillRect(24, y, xs[xs.length - 1] - 24, rowH);
        ctx.fillStyle = '#1E1B4B'; ctx.font = '700 13px ' + FONT; ctx.textAlign = 'left';
        ctx.fillText(t('att.dayTotal'), xs[2] + 6, y + rowH / 2);
        ctx.textAlign = 'center';
        tb.dayTotals.forEach(function (n, i) { ctx.fillText(window.I18N.num(n), xs[3 + i] + wMark / 2, y + rowH / 2); });
        y += rowH;
      }
      // ঘরের রেখা
      ctx.strokeStyle = '#CBD5E1'; ctx.lineWidth = 1;
      ctx.strokeRect(24, top, xs[xs.length - 1] - 24, y - top);
      xs.forEach(function (x) { ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, y); ctx.stroke(); });
      for (let yy = top + headH; yy < y; yy += rowH) { ctx.beginPath(); ctx.moveTo(24, yy); ctx.lineTo(xs[xs.length - 1], yy); ctx.stroke(); }
      ctx.textAlign = 'left'; ctx.fillStyle = '#64748B'; ctx.font = '400 12px ' + FONT;
      ctx.fillText(t('att.legend'), 24, y + 22);
      pages.push(cv);
    });
    return pages;
  }

  async function saveAttendancePdf(info) {
    const pages = await renderAttendancePages(info);
    const imgs = pages.map(function (cv) { return { jpeg: canvasBytes(cv, 'image/jpeg', 0.9), w: cv.width, h: cv.height }; });
    const pdf = buildPdfPages(imgs);
    return saveFile(attFileName(info, 'pdf'), 'application/pdf', pdf, false);
  }

  /* কয়েক পাতার PDF: প্রতিটা পাতায় একটা JPEG ছবি, A4 আকারে */
  function buildPdfPages(imgs) {
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
    const n = imgs.length;
    push('%PDF-1.4\n');
    push(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]));
    obj(1, ['<< /Type /Catalog /Pages 2 0 R >>']);
    const kids = imgs.map(function (_, i) { return (3 + i * 3) + ' 0 R'; }).join(' ');
    obj(2, ['<< /Type /Pages /Kids [' + kids + '] /Count ' + n + ' >>']);
    imgs.forEach(function (im, i) {
      const pid = 3 + i * 3, iid = pid + 1, cid = pid + 2;
      const landscape = im.w >= im.h * 0.9;
      const pageW = landscape ? 842 : 595, pageH = landscape ? 595 : 842, margin = 20;
      const s = Math.min((pageW - margin * 2) / im.w, (pageH - margin * 2) / im.h);
      const dw = (im.w * s).toFixed(2), dh = (im.h * s).toFixed(2);
      const dx = ((pageW - im.w * s) / 2).toFixed(2);
      const dy = (pageH - margin - im.h * s).toFixed(2); // উপর থেকে শুরু
      obj(pid, ['<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pageW + ' ' + pageH + '] /Resources << /XObject << /Im' + i + ' ' + iid + ' 0 R >> >> /Contents ' + cid + ' 0 R >>']);
      obj(iid, ['<< /Type /XObject /Subtype /Image /Width ' + im.w + ' /Height ' + im.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + im.jpeg.length + ' >>\nstream\n', im.jpeg, '\nendstream']);
      const content = 'q\n' + dw + ' 0 0 ' + dh + ' ' + dx + ' ' + dy + ' cm\n/Im' + i + ' Do\nQ\n';
      obj(cid, ['<< /Length ' + content.length + ' >>\nstream\n' + content + 'endstream']);
    });
    const total = 3 + n * 3;
    const xrefPos = length;
    let xref = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (let i = 1; i < total; i++) xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
    push(xref);
    push('trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xrefPos + '\n%%EOF\n');
    const out = new Uint8Array(length);
    let pos = 0;
    parts.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }

  window.Exporter = {
    saveAttendanceXlsx: saveAttendanceXlsx,
    saveAttendancePdf: saveAttendancePdf,
    attendanceTable: attendanceTable,
    backup: backup,
    autoBackup: autoBackup,
    parseBackup: parseBackup,
    saveImage: saveImage,
    savePdf: savePdf,
    share: share,
    renderCanvas: renderCanvas
  };
})();
