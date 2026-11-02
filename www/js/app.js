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
    search: '<svg viewBox="0 0 24 24"><path d="M10 3a7 7 0 0 1 5.6 11.2l4.6 4.6a1 1 0 0 1-1.4 1.4l-4.6-4.6A7 7 0 1 1 10 3Zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><path d="M8 3h11a2 2 0 0 1 2 2v11h-2V5H8V3ZM5 7h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M9 3h6l1 2h4v2H4V5h4l1-2Zm-3 6h12l-1 12H7L6 9Z"/></svg>',
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

  function classSec(c) {
    if (c.grade && c.section) return c.grade + '-' + c.section;
    return c.grade || c.section || '';
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

  function cardHtml(c, opts) {
    opts = opts || {};
    const cs = classSec(c);
    const lead = N.leadFor(c, S.settings);
    const meta = [];
    if (cs) meta.push('<span class="chip">' + ICON.people + esc(cs) + '</span>');
    if (c.room) meta.push('<span class="chip">' + ICON.room + esc(t('card.room')) + ' ' + esc(c.room) + '</span>');
    meta.push('<span class="chip chip-soft' + (lead === null || !S.settings.notifEnabled ? ' is-off' : '') + '">' +
      (lead === null || !S.settings.notifEnabled ? ICON.bellOff : ICON.bell) + esc(reminderLabel(c)) + '</span>');

    return '<article class="class-card" data-id="' + esc(c.id) + '" style="' + colorVars(c.color) + (opts.index !== undefined ? '--i:' + opts.index + ';' : '') + '">' +
      '<div class="card-time">' +
      '<span class="t-start">' + esc(fmtTime(c.start)) + '</span>' +
      '<span class="t-line"></span>' +
      '<span class="t-end">' + esc(fmtTime(c.end)) + '</span>' +
      '</div>' +
      '<div class="card-body">' +
      '<div class="card-head"><h3>' + esc(c.subject || t('form.untitled')) + '</h3>' +
      (opts.live ? '<span class="live-badge" hidden>' + esc(t('today.now')) + '</span>' : '') + '</div>' +
      '<div class="card-meta">' + meta.join('') + '</div>' +
      (c.note ? '<p class="card-note">' + ICON.note + '<span>' + esc(c.note) + '</span></p>' : '') +
      (opts.live ? '<div class="card-progress" hidden><span></span></div>' : '') +
      '</div>' +
      (opts.drag ? '<button type="button" class="drag-handle" aria-label="' + esc(t('week.drag')) + '">' + ICON.drag + '</button>' : '') +
      '</article>';
  }

  function emptyHtml(kind, title, text, btn) {
    const art = {
      empty: '<svg viewBox="0 0 120 100" class="empty-art"><rect x="18" y="16" width="84" height="70" rx="14" class="ea-1"/><rect x="18" y="16" width="84" height="20" rx="10" class="ea-2"/><rect x="32" y="48" width="44" height="8" rx="4" class="ea-3"/><rect x="32" y="64" width="30" height="8" rx="4" class="ea-4"/><circle cx="92" cy="78" r="16" class="ea-5"/><path d="M92 70v8l6 4" class="ea-6"/></svg>',
      holiday: '<svg viewBox="0 0 120 100" class="empty-art"><circle cx="60" cy="44" r="22" class="ea-5"/><g class="ea-6"><path d="M60 10v8M60 70v8M26 44h8M86 44h8M36 20l6 6M78 62l6 6M36 68l6-6M78 26l6-6"/></g><rect x="20" y="84" width="80" height="8" rx="4" class="ea-2"/></svg>',
      search: '<svg viewBox="0 0 120 100" class="empty-art"><circle cx="52" cy="44" r="24" class="ea-2"/><circle cx="52" cy="44" r="14" class="ea-1"/><path d="M70 62l20 20" class="ea-6" stroke-width="8"/></svg>'
    }[kind];
    return '<div class="empty">' + art + '<h3>' + esc(title) + '</h3><p>' + esc(text) + '</p>' +
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
  }

  function navigate(view, opts) {
    opts = opts || {};
    if (view === 'today' || view === 'week' || view === 'settings') state.prevView = view;
    if (view === 'add') {
      view = 'form';
      state.editId = null;
      state.presetDay = opts.day || null;
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
    setTop(greeting(), I.formatDate(info.now), actions);

    let html = '';
    if (state.loadError) {
      html += '<div class="banner banner-error"><strong>' + esc(t('error.loadTitle')) + '</strong><span>' + esc(t('error.loadText')) + '</span>' +
        '<button type="button" class="btn btn-small" data-action="restore">' + esc(t('settings.restore')) + '</button></div>';
    }
    html += profileCardHtml();

    if (info.holiday) {
      html += emptyHtml('holiday', t('today.holidayTitle'), info.classes.length ? t('today.holidayHasClasses') : t('today.holidayText'));
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
      html += '<div class="section-label">' + esc(t('today.classesCount', { n: info.classes.length })) + '</div>';
      html += '<div class="card-list">' + info.classes.map(function (c, i) { return cardHtml(c, { live: true, index: i }); }).join('') + '</div>';
    }
    $('#view').innerHTML = html;
    fitOneLine($('#view'));
    updateLive();
  }

  // প্রতি কয়েক সেকেন্ডে চলমান ক্লাস আর কাউন্টডাউন হালনাগাদ
  function updateLive() {
    if (state.view !== 'today') return;
    const info = todayInfo();
    if (info.iso !== state.renderedDay) { renderToday(); return; }
    const card = $('#statusCard');
    if (!card) return;
    const m = nowMin();
    let current = null;
    let next = null;
    info.classes.forEach(function (c) {
      const s = S.toMin(c.start);
      const e = S.toMin(c.end);
      if (s <= m && m < e && !current) current = c;
      if (s > m && !next) next = c;
    });

    $$('.class-card').forEach(function (el) {
      const c = S.getClass(el.getAttribute('data-id'));
      if (!c) return;
      const s = S.toMin(c.start);
      const e = S.toMin(c.end);
      const isNow = current && current.id === c.id;
      el.classList.toggle('is-now', !!isNow);
      el.classList.toggle('is-past', m >= e);
      const badge = $('.live-badge', el);
      const prog = $('.card-progress', el);
      if (badge) badge.hidden = !isNow;
      if (prog) {
        prog.hidden = !isNow;
        if (isNow) $('span', prog).style.width = Math.min(100, Math.max(0, ((m - s) / (e - s)) * 100)).toFixed(1) + '%';
      }
    });

    let html = '';
    if (current) {
      const left = Math.ceil(S.toMin(current.end) - m);
      html += '<div class="status-row status-now" style="' + colorVars(current.color) + '">' +
        '<span class="pulse"></span><div><small>' + esc(t('today.runningNow')) + '</small>' +
        '<strong>' + esc(current.subject || t('form.untitled')) + '</strong>' +
        '<span>' + esc(t('today.endsIn', { d: I.duration(left) })) + '</span></div></div>';
    }
    if (next) {
      const wait = Math.ceil(S.toMin(next.start) - m);
      const where = [classSec(next), next.room ? t('card.room') + ' ' + next.room : ''].filter(Boolean).join(' · ');
      html += '<div class="status-row status-next">' +
        '<div class="countdown"><b>' + esc(I.num(wait >= 60 ? Math.floor(wait / 60) : wait)) + '</b><small>' + esc(wait >= 60 ? t('today.hourShort') : t('today.minShort')) + '</small></div>' +
        '<div><small>' + esc(t('today.nextClass')) + '</small><strong>' + esc(next.subject || t('form.untitled')) + '</strong>' +
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
      (S.data.classes.length ? '<button type="button" class="icon-btn" data-action="save-pdf" aria-label="' + esc(t('settings.savePdf')) + '">' + ICON.pdf + '</button>' : '') +
      '<div class="seg seg-icons">' +
      '<button type="button" class="' + (mode === 'list' ? 'on' : '') + '" data-action="week-mode" data-mode="list" aria-label="' + esc(t('week.listView')) + '">' + ICON.list + '</button>' +
      '<button type="button" class="' + (mode === 'grid' ? 'on' : '') + '" data-action="week-mode" data-mode="grid" aria-label="' + esc(t('week.gridView')) + '">' + ICON.grid + '</button>' +
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
    const slots = S.timeSlots(rows.map(function (r) { return r.list; }));
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
          html += '<td class="empty-cell">' + (i === 0 && r.holiday && !r.list.length ? esc(t('week.holiday')) : '') + '</td>';
          return;
        }
        html += '<td>' + here.map(function (c) {
          return '<button type="button" class="grid-cell" data-id="' + esc(c.id) + '" style="' + colorVars(c.color) + '">' +
            '<b>' + esc(c.subject || t('form.untitled')) + '</b>' +
            '<span>' + esc(classSec(c)) + '</span>' +
            (c.room ? '<span>' + esc(t('card.room') + ' ' + c.room) + '</span>' : '') +
            '</button>';
        }).join('') + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div><p class="hint">' + esc(t('week.gridHint')) + '</p>';
    return html;
  }

  /* ---------------- ক্লাস যোগ / সম্পাদনা (Form) ---------------- */

  function defaultTimes(day) {
    const list = S.classesForDay(day);
    const start = list.length ? list[list.length - 1].end : '10:00';
    return { start: start, end: addMinutes(start, 45) };
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
    const times = editing ? { start: editing.start, end: editing.end } : defaultTimes(day);
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
      '</div>' +
      '<div id="permBlock" class="perm-block">' + (N.isNative() ? '<div class="loading-line"></div>' : '<p class="group-help">' + esc(t('perm.webOnly')) + '</p>') + '</div>');

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
    let pending = null;
    try {
      const r = await window.Capacitor.Plugins.LocalNotifications.getPending();
      pending = (r.notifications || []).length;
    } catch (e) { /* ignore */ }
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
    html += '<p class="group-help">' + esc(t('perm.batteryTip')) + '</p>';
    html += '<button type="button" class="btn btn-text btn-block" data-action="test-notif">' + ICON.bell + esc(t('perm.test')) + '</button>';
    el.innerHTML = html;
  }

  // সেটিংসে কিছু বদলালে তা খসড়ায় থাকে; "সংরক্ষণ করুন" চাপলে তবেই কাজে লাগে
  function changeDraft(fn) {
    fn(state.draft);
    state.dirty = true;
    const y = window.scrollY;
    renderSettings();
    window.scrollTo(0, y);
  }

  function bindSettings() {
    const view = $('#view');
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
        navigate('add', { day: el.getAttribute('data-day') });
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
    } catch (e) {
      console.warn('default routine not loaded', e);
    }
  }

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
    setInterval(updateLive, 15000);
    try {
      await N.init();
    } catch (e) {
      console.error('notify init', e);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
