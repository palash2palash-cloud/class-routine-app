/* ভাষা (Bangla / English) সামলানোর কোড।
   সব লেখা www/i18n/bn.json আর www/i18n/en.json ফাইলে থাকে। */
(function () {
  'use strict';

  const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const dicts = {};
  let lang = 'bn';

  async function loadDict(code) {
    if (dicts[code]) return dicts[code];
    const res = await fetch('i18n/' + code + '.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('i18n load failed: ' + code);
    dicts[code] = await res.json();
    return dicts[code];
  }

  async function init(code) {
    // ইংরেজি ফাইলটা সবসময় লোড থাকে, কোনো key বাদ পড়লে সেখান থেকে নেবে
    await loadDict('en');
    await setLang(code);
  }

  async function setLang(code) {
    lang = code === 'en' ? 'en' : 'bn';
    await loadDict(lang);
    document.documentElement.lang = lang;
  }

  function getLang() {
    return lang;
  }

  function lookup(dict, key) {
    if (!dict) return undefined;
    if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    // "a.b.c" ধরনের nested key
    return key.split('.').reduce(function (o, k) {
      return o && typeof o === 'object' ? o[k] : undefined;
    }, dict);
  }

  function t(key, params) {
    let s = lookup(dicts[lang], key);
    if (s === undefined) s = lookup(dicts.en, key);
    if (s === undefined) return key;
    if (typeof s !== 'string') return s;
    if (params) {
      s = s.replace(/\{(\w+)\}/g, function (m, name) {
        if (!(name in params)) return m;
        const v = params[name];
        return typeof v === 'number' ? num(v) : String(v);
      });
    }
    return s;
  }

  // সংখ্যাকে বাংলা অঙ্কে রূপান্তর (ভাষা বাংলা হলে)
  function num(n) {
    const s = String(n);
    if (lang !== 'bn') return s;
    return s.replace(/[0-9]/g, function (d) {
      return BN_DIGITS[+d];
    });
  }

  // যেকোনো লেখার ভেতরের অঙ্ক ভাষা অনুযায়ী দেখানো
  function digits(s) {
    if (s === null || s === undefined) return '';
    return num(String(s));
  }

  // বাংলা অঙ্ককে ইংরেজি অঙ্কে (খোঁজার সময় কাজে লাগে)
  function toAsciiDigits(s) {
    return String(s || '').replace(/[০-৯]/g, function (d) {
      return String(BN_DIGITS.indexOf(d));
    });
  }

  function pad2(n) {
    return (n < 10 ? '0' : '') + n;
  }

  function bnPeriod(h) {
    if (h >= 4 && h < 6) return t('time.dawn');
    if (h >= 6 && h < 12) return t('time.morning');
    if (h >= 12 && h < 15) return t('time.noon');
    if (h >= 15 && h < 18) return t('time.afternoon');
    if (h >= 18 && h < 20) return t('time.evening');
    return t('time.night');
  }

  // "13:05" -> "দুপুর ১:০৫" অথবা "1:05 PM"
  function formatTime(hhmm, format) {
    if (!hhmm) return '';
    const parts = hhmm.split(':');
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (format === '24') {
      return num(pad2(h) + ':' + pad2(m));
    }
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const core = num(h12 + ':' + pad2(m));
    if (lang === 'bn') return bnPeriod(h) + ' ' + core;
    return core + ' ' + (h < 12 ? 'AM' : 'PM');
  }

  function dayName(key) {
    return t('days.' + key);
  }

  function dayShort(key) {
    return t('daysShort.' + key);
  }

  function formatDate(date) {
    const keys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const months = t('months');
    const m = Array.isArray(months) ? months[date.getMonth()] : date.getMonth() + 1;
    return t('date.full', {
      day: dayName(keys[date.getDay()]),
      date: date.getDate(),
      month: m,
      year: date.getFullYear()
    });
  }

  // ৮৫ মিনিট -> "১ ঘণ্টা ২৫ মিনিট"
  function duration(mins) {
    mins = Math.max(0, Math.round(mins));
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return t('dur.min', { m: m });
    if (m === 0) return t('dur.hour', { h: h });
    return t('dur.hourMin', { h: h, m: m });
  }

  // HTML-এ data-i18n লাগানো সব জায়গায় লেখা বসানো
  function apply(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    (root || document).querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
  }

  window.I18N = {
    init: init,
    setLang: setLang,
    getLang: getLang,
    t: t,
    num: num,
    digits: digits,
    toAsciiDigits: toAsciiDigits,
    formatTime: formatTime,
    dayName: dayName,
    dayShort: dayShort,
    formatDate: formatDate,
    duration: duration,
    apply: apply
  };
})();
