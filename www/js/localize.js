/* রুটিনের লেখা (বিষয়, শ্রেণি, শাখা, রুম, নোট) অ্যাপের ভাষা অনুযায়ী দেখানো।
   ব্যবহারকারী যা লিখেছেন সেটা বদলানো হয় না, শুধু দেখানোর সময় অনুবাদ হয়।
   আগে দেখা হয় সেটিংসের "শব্দের অনুবাদ" (নিজের যোগ করা), তারপর নিচের তালিকা। */
(function () {
  'use strict';

  // ইংরেজি (ছোট হাতের) -> বাংলা
  const BASE = {
    // বিষয়
    'economics': 'অর্থনীতি', 'bangla': 'বাংলা', 'bengali': 'বাংলা', 'english': 'ইংরেজি',
    'mathematics': 'গণিত', 'math': 'গণিত', 'maths': 'গণিত', 'higher mathematics': 'উচ্চতর গণিত',
    'physics': 'পদার্থবিজ্ঞান', 'chemistry': 'রসায়ন', 'biology': 'জীববিজ্ঞান', 'science': 'বিজ্ঞান',
    'general science': 'সাধারণ বিজ্ঞান', 'ict': 'তথ্য ও যোগাযোগ প্রযুক্তি',
    'accounting': 'হিসাববিজ্ঞান', 'finance': 'ফিন্যান্স', 'banking': 'ব্যাংকিং', 'marketing': 'মার্কেটিং',
    'management': 'ব্যবস্থাপনা', 'business studies': 'ব্যবসায় শিক্ষা', 'business organization': 'ব্যবসায় সংগঠন',
    'civics': 'পৌরনীতি', 'civics and good governance': 'পৌরনীতি ও সুশাসন', 'history': 'ইতিহাস',
    'islamic history': 'ইসলামের ইতিহাস', 'geography': 'ভূগোল', 'logic': 'যুক্তিবিদ্যা',
    'sociology': 'সমাজবিজ্ঞান', 'social work': 'সমাজকর্ম', 'psychology': 'মনোবিজ্ঞান', 'statistics': 'পরিসংখ্যান',
    'agriculture': 'কৃষিশিক্ষা', 'religion': 'ধর্ম', 'islam': 'ইসলাম শিক্ষা', 'philosophy': 'দর্শন',
    'political science': 'রাষ্ট্রবিজ্ঞান', 'home economics': 'গার্হস্থ্য বিজ্ঞান', 'arts': 'চারু ও কারুকলা',
    'physical education': 'শারীরিক শিক্ষা', 'career education': 'ক্যারিয়ার শিক্ষা',
    // শ্রেণি
    'class': 'শ্রেণি', 'section': 'শাখা', 'honours': 'অনার্স', 'honors': 'অনার্স', 'degree': 'ডিগ্রি', 'masters': 'মাস্টার্স',
    'first year': 'প্রথম বর্ষ', 'second year': 'দ্বিতীয় বর্ষ', 'third year': 'তৃতীয় বর্ষ', 'fourth year': 'চতুর্থ বর্ষ',
    // বিভাগ ও অন্যান্য
    'humanities': 'মানবিক', 'arts group': 'মানবিক', 'commerce': 'ব্যবসায় শিক্ষা', 'business': 'ব্যবসায়',
    'period': 'পিরিয়ড', 'room': 'রুম', 'lab': 'ল্যাব', 'library': 'লাইব্রেরি', 'hall': 'হল',
    'building': 'ভবন', 'floor': 'তলা', 'test': 'পরীক্ষা', 'exam': 'পরীক্ষা', 'practical': 'ব্যবহারিক',
    'tutorial': 'টিউটোরিয়াল', 'theory': 'তত্ত্ব', 'group': 'গ্রুপ', 'and': 'ও', 'paper': 'পত্র',
    '1st': '১ম', '2nd': '২য়', '3rd': '৩য়', '4th': '৪র্থ'
  };
  // শুধু "শ্রেণি" ঘরের জন্য (নোটের সাধারণ লেখায় "one", "ten" অনুবাদ হবে না)
  const GRADE = {
    'one': 'প্রথম', 'two': 'দ্বিতীয়', 'three': 'তৃতীয়', 'four': 'চতুর্থ', 'five': 'পঞ্চম',
    'six': 'ষষ্ঠ', 'seven': 'সপ্তম', 'eight': 'অষ্টম', 'nine': 'নবম', 'ten': 'দশম',
    'eleven': 'একাদশ', 'twelve': 'দ্বাদশ', 'xi': 'একাদশ', 'xii': 'দ্বাদশ', 'first': 'প্রথম', 'second': 'দ্বিতীয়'
  };
  // শাখার সংক্ষেপ: H1 = মানবিক-১, S2 = বিজ্ঞান-২, B1/C1 = ব্যবসায়-১
  const SEC = { h: 'মানবিক', s: 'বিজ্ঞান', b: 'ব্যবসায়', c: 'ব্যবসায়' };
  const SEC_BACK = { 'মানবিক': 'H', 'বিজ্ঞান': 'S', 'ব্যবসায়': 'B' };

  const BN_DIG = '০১২৩৪৫৬৭৮৯';
  function toBnDigits(s) { return s.replace(/[0-9]/g, function (d) { return BN_DIG[+d]; }); }
  function toEnDigits(s) { return s.replace(/[০-৯]/g, function (d) { return String(BN_DIG.indexOf(d)); }); }

  let cacheKey = null;
  let toBn = null, toEn = null, phrasesBn = null, phrasesEn = null;

  function build() {
    const S = window.Store;
    const custom = S && S.settings ? (S.settings.wordMap || '') : '';
    if (cacheKey === custom && toBn) return;
    cacheKey = custom;
    toBn = Object.assign({}, BASE, GRADE);
    // নিজের যোগ করা অনুবাদ: প্রতি লাইনে "English = বাংলা"
    custom.split(/\n/).forEach(function (line) {
      const m = line.split('=');
      if (m.length !== 2) return;
      const en = m[0].trim().toLowerCase(), bn = m[1].trim();
      if (en && bn) toBn[en] = bn;
    });
    toEn = {};
    Object.keys(toBn).forEach(function (en) {
      const bn = toBn[en];
      if (!toEn[bn] || en.length > toEn[bn].length) toEn[bn] = en.replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    });
    // লম্বা শব্দগুচ্ছ আগে মেলানো হয় ("Islamic History" আগে, তারপর "History")
    phrasesBn = Object.keys(toBn).filter(function (k) { return k.indexOf(' ') !== -1; }).sort(function (a, b) { return b.length - a.length; });
    phrasesEn = Object.keys(toEn).filter(function (k) { return k.indexOf(' ') !== -1; }).sort(function (a, b) { return b.length - a.length; });
  }

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function toBangla(text, grade) {
    let s = text;
    phrasesBn.forEach(function (p) {
      s = s.replace(new RegExp('\\b' + escRe(p) + '\\b', 'gi'), toBn[p]);
    });
    s = s.replace(/[A-Za-z][A-Za-z0-9]*/g, function (w) {
      const low = w.toLowerCase();
      if (!grade && GRADE[low] && !BASE[low] && toBn[low] === GRADE[low]) return w;
      if (toBn[low]) return toBn[low];
      const m = /^([hsbc])(\d{1,2})$/i.exec(w);
      if (m) return SEC[m[1].toLowerCase()] + '-' + m[2];
      return w;
    });
    return toBnDigits(s);
  }

  function toEnglish(text) {
    let s = toEnDigits(text);
    s = s.replace(/(মানবিক|বিজ্ঞান|ব্যবসায়)\s*-\s*(\d{1,2})/g, function (all, g, n) { return SEC_BACK[g] + n; });
    phrasesEn.forEach(function (p) { s = s.split(p).join(toEn[p]); });
    s = s.replace(/[ঀ-৿]+/g, function (w) { return toEn[w] || w; });
    return s;
  }

  // মূল কাজ: লেখাটা এখনকার ভাষায়
  function loc(text, kind) {
    if (!text) return text || '';
    build();
    const lang = window.I18N ? window.I18N.getLang() : 'bn';
    return lang === 'bn' ? toBangla(String(text), kind === 'grade') : toEnglish(String(text));
  }

  // শ্রেণি ও শাখা একসাথে: "দ্বাদশ মানবিক-২" / "Twelve-H2"
  function classLabel(c) {
    const bn = window.I18N && window.I18N.getLang() === 'bn';
    const g = loc(c.grade, 'grade'), s = loc(c.section);
    if (g && s) return g + (bn ? ' ' : '-') + s;
    return g || s || '';
  }

  window.Localize = { loc: loc, classLabel: classLabel };
})();
