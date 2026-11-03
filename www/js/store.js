/* রুটিনের সব ডেটা এখানে রাখা হয়। ডেটা শুধু ফোনের ভেতরে (localStorage) থাকে। */
(function () {
  'use strict';

  const KEY = 'classRoutine.data.v1';
  const DAYS = ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'];
  const JS_DAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']; // Date.getDay() অনুযায়ী

  const PALETTE = [
    '#4F46E5', '#2563EB', '#0891B2', '#0D9488',
    '#16A34A', '#65A30D', '#CA8A04', '#EA580C',
    '#DC2626', '#DB2777', '#C026D3', '#7C3AED',
    '#475569', '#92400E'
  ];

  const DEFAULT_SETTINGS = {
    lang: 'bn',
    theme: 'system', // system | light | dark
    timeFormat: '12', // 12 | 24
    holidays: ['fri'],
    notifEnabled: true,
    leadMinutes: 10,
    mutedDays: [], // যে বারগুলোতে রিমাইন্ডার বন্ধ
    mutedDates: [], // নির্দিষ্ট তারিখে বন্ধ, যেমন "2026-11-02"
    weekMode: 'list', // list | grid
    hgStyle: 'classic', // চলমান ক্লাসের বালুঘড়ির নকশা
    dayEndStyle: 'classic', // দিনের সব ক্লাস শেষে রাত ১২টা পর্যন্ত চলা বড় বালুঘড়ির নকশা
    breakEnabled: true, // পিডিএফ/ছবির রুটিনে টিফিন বিরতির ঘর
    breakStart: '11:05',
    breakEnd: '11:40',
    profile: {
      photo: '', // পাসপোর্ট সাইজ ছবি (JPEG data URL)
      bn: { name: '', designation: '', subject: '', institution: '', city: '' },
      en: { name: '', designation: '', subject: '', institution: '', city: '' }
    }
  };

  let data = null;

  function uid() {
    return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function emptyData() {
    return { version: 1, classes: [], settings: Object.assign({}, DEFAULT_SETTINGS), prepNotes: {} };
  }

  function isTime(s) {
    return typeof s === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
  }

  function isColor(s) {
    return typeof s === 'string' && /^#[0-9a-fA-F]{6}$/.test(s);
  }

  function cleanText(s, max) {
    if (s === null || s === undefined) return '';
    return String(s).normalize('NFC').trim().slice(0, max || 200);
  }

  function cleanClass(c) {
    if (!c || typeof c !== 'object') return null;
    if (DAYS.indexOf(c.day) === -1) return null;
    if (!isTime(c.start) || !isTime(c.end)) return null;
    let remind = c.remind;
    if (remind !== 'off' && remind !== 'default') {
      const n = parseInt(remind, 10);
      remind = isNaN(n) || n < 0 || n > 720 ? 'default' : n;
    }
    return {
      id: typeof c.id === 'string' && c.id ? c.id : uid(),
      day: c.day,
      subject: cleanText(c.subject, 80),
      grade: cleanText(c.grade, 40),
      section: cleanText(c.section, 40),
      room: cleanText(c.room, 40),
      start: c.start,
      end: c.end,
      note: cleanText(c.note, 500),
      color: isColor(c.color) ? c.color.toUpperCase() : PALETTE[0],
      remind: remind
    };
  }

  function cleanSettings(s) {
    const out = Object.assign({}, DEFAULT_SETTINGS);
    if (!s || typeof s !== 'object') return out;
    if (s.lang === 'en' || s.lang === 'bn') out.lang = s.lang;
    if (['system', 'light', 'dark'].indexOf(s.theme) !== -1) out.theme = s.theme;
    if (s.timeFormat === '12' || s.timeFormat === '24') out.timeFormat = s.timeFormat;
    if (Array.isArray(s.holidays)) out.holidays = s.holidays.filter(function (d) { return DAYS.indexOf(d) !== -1; });
    if (typeof s.notifEnabled === 'boolean') out.notifEnabled = s.notifEnabled;
    const lead = parseInt(s.leadMinutes, 10);
    if (!isNaN(lead) && lead >= 0 && lead <= 720) out.leadMinutes = lead;
    if (Array.isArray(s.mutedDays)) out.mutedDays = s.mutedDays.filter(function (d) { return DAYS.indexOf(d) !== -1; });
    if (Array.isArray(s.mutedDates)) out.mutedDates = s.mutedDates.filter(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d); });
    if (s.weekMode === 'grid' || s.weekMode === 'list') out.weekMode = s.weekMode;
    if (['classic', 'wood', 'crystal', 'rose', 'night', 'classColor', 'minimal', 'off'].indexOf(s.hgStyle) !== -1) out.hgStyle = s.hgStyle;
    if (['classic', 'wood', 'crystal', 'rose', 'night', 'emerald', 'minimal'].indexOf(s.dayEndStyle) !== -1) out.dayEndStyle = s.dayEndStyle;
    if (typeof s.breakEnabled === 'boolean') out.breakEnabled = s.breakEnabled;
    if (isTime(s.breakStart) && isTime(s.breakEnd) && toMin(s.breakEnd) > toMin(s.breakStart)) {
      out.breakStart = s.breakStart;
      out.breakEnd = s.breakEnd;
    }
    out.profile = cleanProfile(s.profile);
    return out;
  }

  const PROFILE_FIELDS = ['name', 'designation', 'subject', 'institution', 'city'];
  // আগের সংস্করণে আগে থেকে বসানো লেখা, এগুলো আর রাখা হবে না
  const OLD_DEFAULTS = ['MD. PALASH MIA', 'Economics', 'Ispahani Cantonment Public School & College'];

  function emptyLangProfile() {
    return { name: '', designation: '', subject: '', institution: '', city: '' };
  }

  function cleanProfile(p) {
    const out = { photo: '', bn: emptyLangProfile(), en: emptyLangProfile() };
    if (!p || typeof p !== 'object') return out;
    const ph = p.photo;
    out.photo = typeof ph === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(ph) && ph.length < 600000 ? ph : '';
    ['bn', 'en'].forEach(function (lg) {
      const src = p[lg];
      if (!src || typeof src !== 'object') return;
      PROFILE_FIELDS.forEach(function (k) {
        if (typeof src[k] === 'string') out[lg][k] = cleanText(src[k], 120);
      });
    });
    // পুরোনো (এক ভাষার) প্রোফাইল থাকলে: বাংলা অক্ষর থাকলে বাংলায়, না হলে ইংরেজিতে রাখা
    PROFILE_FIELDS.forEach(function (k) {
      const v = typeof p[k] === 'string' ? cleanText(p[k], 120) : '';
      if (!v || OLD_DEFAULTS.indexOf(v) !== -1) return;
      const lg = /[\u0980-\u09FF]/.test(v) ? 'bn' : 'en';
      if (!out[lg][k]) out[lg][k] = v;
    });
    return out;
  }

  /* পরের ক্লাসের প্রস্তুতি নোট: প্রতিটি সেকশনের (যেমন Twelve-H2) জন্য একটি করে লেখা।
     key = সেকশনের নাম ছোট হাতের অক্ষরে, যাতে "twelve-h2" আর "Twelve-H2" একই ধরা হয়। */
  function sectionLabel(c) {
    const parts = [c.grade, c.section].filter(Boolean);
    return parts.length ? parts.join('-') : (c.subject || '');
  }

  function sectionKey(c) {
    return normalize(sectionLabel(c)).replace(/\s+/g, ' ');
  }

  function cleanNotes(n) {
    const out = {};
    if (!n || typeof n !== 'object') return out;
    Object.keys(n).forEach(function (k) {
      const v = n[k];
      if (!v || typeof v !== 'object') return;
      const text = cleanText(v.text, 400);
      if (!text) return;
      out[String(k).slice(0, 120)] = { text: text, at: typeof v.at === 'number' ? v.at : Date.now() };
    });
    return out;
  }

  function getNote(key) {
    const n = data.prepNotes && data.prepNotes[key];
    return n ? n.text : '';
  }

  function setNote(key, text) {
    if (!data.prepNotes) data.prepNotes = {};
    text = cleanText(text, 400);
    if (text) data.prepNotes[key] = { text: text, at: Date.now() };
    else delete data.prepNotes[key];
    return save();
  }

  // বাইরের (backup) ডেটা যাচাই করে পরিষ্কার করা। ভুল হলে null দেয়।
  function sanitize(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const src = raw.data && raw.data.classes ? raw.data : raw;
    if (!Array.isArray(src.classes)) return null;
    const classes = src.classes.map(cleanClass).filter(Boolean);
    return { version: 1, classes: classes, settings: cleanSettings(src.settings), prepNotes: cleanNotes(src.prepNotes) };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) {
        data = emptyData();
        return { ok: true, fresh: true };
      }
      const parsed = sanitize(JSON.parse(raw));
      if (!parsed) throw new Error('bad data');
      data = parsed;
      cleanupMutedDates();
      return { ok: true, fresh: false };
    } catch (e) {
      data = emptyData();
      return { ok: false, error: e };
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('save failed', e);
      return false;
    }
  }

  function cleanupMutedDates() {
    const today = isoDate(new Date());
    data.settings.mutedDates = data.settings.mutedDates.filter(function (d) { return d >= today; });
  }

  function isoDate(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function toMin(hhmm) {
    const p = hhmm.split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
  }

  function fromMin(m) {
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }

  function byTime(a, b) {
    return toMin(a.start) - toMin(b.start) || toMin(a.end) - toMin(b.end);
  }

  function dayKeyOf(date) {
    return JS_DAY[date.getDay()];
  }

  function classesForDay(day) {
    return data.classes.filter(function (c) { return c.day === day; }).sort(byTime);
  }

  function getClass(id) {
    return data.classes.find(function (c) { return c.id === id; }) || null;
  }

  function addClass(c) {
    const clean = cleanClass(Object.assign({}, c, { id: uid() }));
    if (!clean) return null;
    data.classes.push(clean);
    save();
    return clean;
  }

  function updateClass(id, patch) {
    const idx = data.classes.findIndex(function (c) { return c.id === id; });
    if (idx === -1) return null;
    const clean = cleanClass(Object.assign({}, data.classes[idx], patch, { id: id }));
    if (!clean) return null;
    data.classes[idx] = clean;
    save();
    return clean;
  }

  function deleteClass(id) {
    data.classes = data.classes.filter(function (c) { return c.id !== id; });
    save();
  }

  function copyClass(id, days) {
    const src = getClass(id);
    if (!src) return 0;
    let n = 0;
    days.forEach(function (d) {
      if (d === src.day) return;
      const copy = cleanClass(Object.assign({}, src, { id: uid(), day: d }));
      if (copy) {
        data.classes.push(copy);
        n++;
      }
    });
    save();
    return n;
  }

  // একই বিষয়ের সব ক্লাসে একই রং
  function setSubjectColor(subject, color) {
    const key = normalize(subject);
    if (!key) return;
    data.classes.forEach(function (c) {
      if (normalize(c.subject) === key) c.color = color;
    });
    save();
  }

  function colorForSubject(subject) {
    const key = normalize(subject);
    if (!key) return null;
    const found = data.classes.find(function (c) { return normalize(c.subject) === key; });
    return found ? found.color : null;
  }

  // একই দিনে অন্য ক্লাসের সাথে সময় মিলে যায় কিনা
  function findOverlap(day, start, end, ignoreId) {
    const s = toMin(start);
    const e = toMin(end);
    return data.classes.find(function (c) {
      if (c.day !== day || c.id === ignoreId) return false;
      return s < toMin(c.end) && toMin(c.start) < e;
    }) || null;
  }

  // ড্র্যাগ করে সাজানোর পর: সময়ের ঘরগুলো ঠিক থাকে, ক্লাসগুলো নতুন ক্রমে বসে
  function reorderDay(day, orderedIds) {
    const current = classesForDay(day);
    const slots = current.map(function (c) { return { start: c.start, end: c.end }; });
    orderedIds.forEach(function (id, i) {
      const c = getClass(id);
      if (c && slots[i]) {
        c.start = slots[i].start;
        c.end = slots[i].end;
      }
    });
    save();
  }

  function moveToDay(id, day) {
    const c = getClass(id);
    if (!c || DAYS.indexOf(day) === -1) return;
    c.day = day;
    save();
  }

  // কয়েকটি দিনের ক্লাস থেকে আলাদা আলাদা শুরুর সময় (গ্রিড ও ছবির কলামের জন্য)
  function timeSlots(lists) {
    const seen = {};
    const out = [];
    lists.forEach(function (list) {
      list.forEach(function (c) {
        if (seen[c.start]) {
          if (toMin(c.end) > toMin(seen[c.start].end)) seen[c.start].end = c.end;
          return;
        }
        seen[c.start] = { start: c.start, end: c.end };
        out.push(seen[c.start]);
      });
    });
    return out.sort(byTime);
  }

  function subjects() {
    const set = {};
    data.classes.forEach(function (c) { if (c.subject) set[c.subject] = true; });
    return Object.keys(set).sort(collator().compare);
  }

  let _collator = null;
  function collator() {
    if (!_collator) {
      try {
        _collator = new Intl.Collator(['bn', 'en'], { sensitivity: 'base', numeric: true });
      } catch (e) {
        _collator = { compare: function (a, b) { return a < b ? -1 : a > b ? 1 : 0; } };
      }
    }
    return _collator;
  }

  // খোঁজার জন্য লেখা এক রকম করা: NFC, ছোট হাতের অক্ষর, বাংলা অঙ্ক -> ইংরেজি অঙ্ক
  function normalize(s) {
    return window.I18N.toAsciiDigits(String(s || '').normalize('NFC').toLowerCase()).replace(/\s+/g, ' ').trim();
  }

  function matches(c, query) {
    const q = normalize(query);
    if (!q) return true;
    const hay = normalize([c.subject, c.grade, c.section, c.room, c.note].join(' '));
    return q.split(' ').every(function (part) { return hay.indexOf(part) !== -1; });
  }

  function replaceAll(newData) {
    data = newData;
    save();
  }

  function clearAll() {
    const keepSettings = data.settings;
    data = emptyData();
    data.settings = keepSettings;
    save();
  }

  window.Store = {
    DAYS: DAYS,
    PALETTE: PALETTE,
    get data() { return data; },
    get settings() { return data.settings; },
    load: load,
    save: save,
    sanitize: sanitize,
    isoDate: isoDate,
    toMin: toMin,
    fromMin: fromMin,
    byTime: byTime,
    dayKeyOf: dayKeyOf,
    classesForDay: classesForDay,
    getClass: getClass,
    addClass: addClass,
    updateClass: updateClass,
    deleteClass: deleteClass,
    copyClass: copyClass,
    setSubjectColor: setSubjectColor,
    colorForSubject: colorForSubject,
    findOverlap: findOverlap,
    reorderDay: reorderDay,
    moveToDay: moveToDay,
    subjects: subjects,
    timeSlots: timeSlots,
    collator: collator,
    normalize: normalize,
    matches: matches,
    replaceAll: replaceAll,
    sectionLabel: sectionLabel,
    sectionKey: sectionKey,
    getNote: getNote,
    setNote: setNote,
    clearAll: clearAll,
    isColor: isColor
  };
})();
