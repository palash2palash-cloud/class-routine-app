/* ক্লাসের আগে রিমাইন্ডার নোটিফিকেশন।
   সামনের ২৮ দিনের প্রতিটি ক্লাসের রিমাইন্ডারের তালিকা বানিয়ে অ্যাপের নিজস্ব নেটিভ অংশে
   (ClassAlarm, Java) পাঠানো হয়। সেটা ফোনের অ্যালার্ম ঘড়ির মতো করে (setAlarmClock) ঠিক সময়ে
   জোরে বিপসহ নোটিফিকেশন দেখায়, অ্যাপ বন্ধ থাকলেও। অ্যাপ খুললেই তালিকা আবার এগিয়ে নেওয়া হয়।
   @capacitor/local-notifications এখন শুধু অনুমতি চাওয়া/দেখার কাজে লাগে। */
(function () {
  'use strict';

  const CHANNEL_ID = 'class-alarm-v2'; // ClassAlarmScheduler.java এ তৈরি হয় (জোরে বিপ)
  const WINDOW_DAYS = 28;
  const MAX_NOTIFS = 400; // Android একটি অ্যাপকে প্রায় ৫০০ alarm পর্যন্ত রাখতে দেয়
  const t = function (k, p) { return window.I18N.t(k, p); };

  function cap() {
    return window.Capacitor;
  }

  function isNative() {
    const c = cap();
    return !!(c && c.isNativePlatform && c.isNativePlatform());
  }

  function LN() {
    const c = cap();
    return c && c.Plugins ? c.Plugins.LocalNotifications : null;
  }

  // অ্যাপের নিজস্ব নেটিভ রিমাইন্ডার (MainActivity-তে registerPlugin করা)
  let _alarm = null;
  function AL() {
    const c = cap();
    if (!c || !isNative()) return null;
    if (!_alarm) {
      try {
        _alarm = c.registerPlugin ? c.registerPlugin('ClassAlarm') : (c.Plugins && c.Plugins.ClassAlarm);
      } catch (e) {
        _alarm = c.Plugins && c.Plugins.ClassAlarm;
      }
    }
    return _alarm || null;
  }

  let queue = Promise.resolve();
  function enqueue(fn) {
    queue = queue.then(fn, fn).catch(function (e) { console.error('notify', e); });
    return queue;
  }

  // channel টি নেটিভ কোডে (MainActivity.java) জোরে বিপসহ তৈরি হয়।
  // এখানে আবার তৈরি করলে শব্দ ছাড়া channel বানানোর ঝুঁকি থাকে, তাই কিছু করা হয় না।
  async function createChannel() {
    return;
  }

  // সাধারণ অনুমতি (Android 13+ এ লাগে): 'granted' | 'denied' | 'prompt'
  async function permission() {
    const ln = LN();
    if (!isNative() || !ln) return 'unsupported';
    try {
      const r = await ln.checkPermissions();
      return r.display;
    } catch (e) {
      return 'unsupported';
    }
  }

  async function requestPermission() {
    const ln = LN();
    if (!isNative() || !ln) return 'unsupported';
    try {
      const r = await ln.requestPermissions();
      return r.display;
    } catch (e) {
      return 'denied';
    }
  }

  // ঠিক সময়ে নোটিফিকেশনের অনুমতি (Android 12+ এর "Alarms & reminders")
  async function exactAlarm() {
    const ln = LN();
    if (!isNative() || !ln || !ln.checkExactNotificationSetting) return 'unsupported';
    try {
      const r = await ln.checkExactNotificationSetting();
      return r.exact_alarm;
    } catch (e) {
      return 'unsupported';
    }
  }

  async function openExactAlarmSettings() {
    const ln = LN();
    if (!isNative() || !ln || !ln.changeExactNotificationSetting) return 'unsupported';
    try {
      const r = await ln.changeExactNotificationSetting();
      return r.exact_alarm;
    } catch (e) {
      return 'unsupported';
    }
  }

  function leadFor(c, settings) {
    if (c.remind === 'off') return null;
    if (c.remind === 'default' || c.remind === undefined || c.remind === null) return settings.leadMinutes;
    return parseInt(c.remind, 10);
  }

  function classLabel(c) {
    const parts = [];
    if (c.grade && c.section) parts.push(c.grade + '-' + c.section);
    else if (c.grade) parts.push(c.grade);
    else if (c.section) parts.push(c.section);
    return parts.join('');
  }

  function buildText(c, lead) {
    const I = window.I18N;
    const subject = c.subject || t('form.untitled');
    const title = lead > 0
      ? t('notif.title', { subject: subject, min: lead })
      : t('notif.titleNow', { subject: subject });
    const bits = [];
    const cls = classLabel(c);
    if (cls) bits.push(t('notif.section', { section: cls }));
    if (c.room) bits.push(t('notif.room', { room: c.room }));
    bits.push(t('notif.starts', { time: I.formatTime(c.start, window.Store.settings.timeFormat) }));
    let body = bits.join(' · ');
    const large = c.note ? body + '\n' + c.note : body;
    return { title: title, body: body, largeBody: large };
  }

  // সামনের দিনগুলোর জন্য নোটিফিকেশনের তালিকা তৈরি
  function buildList() {
    const S = window.Store;
    const settings = S.settings;
    if (!settings.notifEnabled) return [];
    const list = [];
    const now = Date.now();
    const base = new Date();
    base.setHours(0, 0, 0, 0);

    for (let d = 0; d <= WINDOW_DAYS && list.length < MAX_NOTIFS; d++) {
      const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d);
      const dayKey = S.dayKeyOf(date);
      if (settings.holidays.indexOf(dayKey) !== -1) continue;
      if (settings.mutedDays.indexOf(dayKey) !== -1) continue;
      if (settings.mutedDates.indexOf(S.isoDate(date)) !== -1) continue;

      S.classesForDay(dayKey).forEach(function (c) {
        if (list.length >= MAX_NOTIFS) return;
        const lead = leadFor(c, settings);
        if (lead === null || isNaN(lead)) return;
        const startMin = S.toMin(c.start);
        const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, startMin - lead, 0, 0);
        if (at.getTime() <= now + 5000) return;
        const txt = buildText(c, lead);
        list.push({
          id: list.length + 1,
          at: at.getTime(),
          title: txt.title,
          body: txt.largeBody,
          color: c.color
        });
      });
    }

    // ক্যালেন্ডারের কাজের রিমাইন্ডার (ছুটি বা ক্লাসের রিমাইন্ডার বন্ধ থাকলেও বাজবে)
    for (let d = 0; d <= WINDOW_DAYS && list.length < MAX_NOTIFS; d++) {
      const date = new Date(base.getFullYear(), base.getMonth(), base.getDate() + d);
      const iso = S.isoDate(date);
      S.eventsOn(iso).forEach(function (ev) {
        if (list.length >= MAX_NOTIFS || ev.remind < 0 || ev.done.indexOf(iso) !== -1) return;
        const at = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, S.toMin(ev.time) - ev.remind, 0, 0);
        if (at.getTime() <= now + 5000) return;
        const I = window.I18N;
        const when = I.formatTime(ev.time, settings.timeFormat);
        list.push({
          id: list.length + 1,
          at: at.getTime(),
          title: ev.remind > 0 ? t('cal.notifTitleLead', { title: ev.title, when: when }) : t('cal.notifTitle', { title: ev.title }),
          body: ev.note ? when + '\n' + ev.note : when,
          color: ev.color
        });
      });
    }
    return list;
  }

  // আগের সংস্করণে local-notifications দিয়ে বসানো রিমাইন্ডার থাকলে মুছে ফেলা (দুবার যেন না বাজে)
  async function clearOldPluginAlarms() {
    const ln = LN();
    if (!ln) return;
    try {
      const pending = await ln.getPending();
      const items = (pending && pending.notifications) || [];
      if (items.length) await ln.cancel({ notifications: items.map(function (n) { return { id: n.id }; }) });
    } catch (e) { /* ignore */ }
  }

  // রুটিন বা সেটিংস বদলালেই এটা ডাকা হয়
  function reschedule() {
    return enqueue(async function () {
      const al = AL();
      if (!isNative() || !al) return;
      await clearOldPluginAlarms();
      const perm = await permission();
      if (perm !== 'granted') { await al.cancelAll(); return; }
      await al.schedule({ alarms: buildList() });
    });
  }

  // নেটিভ অংশের অবস্থা: কতগুলো রিমাইন্ডার বসানো, পরেরটা কখন, ইত্যাদি
  async function status() {
    const al = AL();
    if (!isNative() || !al) return null;
    try { return await al.status(); } catch (e) { return null; }
  }

  async function test() {
    const al = AL();
    if (!isNative() || !al) return 'unsupported';
    let perm = await permission();
    if (perm !== 'granted') perm = await requestPermission();
    if (perm !== 'granted') return perm;
    await al.test({ title: t('notif.testTitle'), body: t('notif.testBody'), delay: 5000 });
    return 'granted';
  }

  async function init() {
    if (!isNative()) return;
    await createChannel();
    let perm = await permission();
    if (perm === 'prompt' || perm === 'prompt-with-rationale') {
      perm = await requestPermission();
    }
    await reschedule();
  }

  window.Notify = {
    isNative: isNative,
    init: init,
    createChannel: createChannel,
    permission: permission,
    requestPermission: requestPermission,
    exactAlarm: exactAlarm,
    openExactAlarmSettings: openExactAlarmSettings,
    reschedule: reschedule,
    test: test,
    status: status,
    buildList: buildList,
    leadFor: leadFor
  };
})();
