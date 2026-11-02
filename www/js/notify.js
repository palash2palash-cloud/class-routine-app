/* ক্লাসের আগে রিমাইন্ডার নোটিফিকেশন।
   @capacitor/local-notifications দিয়ে ফোনের ভেতরেই (অফলাইনে) সময় ঠিক করে রাখা হয়।
   সামনের ২৮ দিনের প্রতিটি ক্লাসের জন্য আলাদা এককালীন নোটিফিকেশন বসানো হয়,
   আর অ্যাপ খুললেই তালিকাটা আবার নতুন করে সামনে এগিয়ে নেওয়া হয়। */
(function () {
  'use strict';

  const CHANNEL_ID = 'class-reminders';
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

  let queue = Promise.resolve();
  function enqueue(fn) {
    queue = queue.then(fn, fn).catch(function (e) { console.error('notify', e); });
    return queue;
  }

  async function createChannel() {
    const ln = LN();
    if (!isNative() || !ln || !ln.createChannel) return;
    try {
      await ln.createChannel({
        id: CHANNEL_ID,
        name: t('notif.channelName'),
        description: t('notif.channelDesc'),
        importance: 5,
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#4F46E5'
      });
    } catch (e) {
      console.warn('channel', e);
    }
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
          title: txt.title,
          body: txt.body,
          largeBody: txt.largeBody,
          channelId: CHANNEL_ID,
          smallIcon: 'ic_stat_class',
          iconColor: c.color,
          autoCancel: true,
          schedule: { at: at, allowWhileIdle: true },
          extra: { classId: c.id }
        });
      });
    }
    return list;
  }

  async function cancelAll() {
    const ln = LN();
    const pending = await ln.getPending();
    const items = ((pending && pending.notifications) || []).filter(function (n) { return n.id !== 99999; });
    if (items.length) {
      await ln.cancel({ notifications: items.map(function (n) { return { id: n.id }; }) });
    }
  }

  // রুটিন বা সেটিংস বদলালেই এটা ডাকা হয়
  function reschedule() {
    return enqueue(async function () {
      const ln = LN();
      if (!isNative() || !ln) return;
      const perm = await permission();
      await cancelAll();
      if (perm !== 'granted') return;
      const list = buildList();
      for (let i = 0; i < list.length; i += 60) {
        await ln.schedule({ notifications: list.slice(i, i + 60) });
      }
    });
  }

  async function test() {
    const ln = LN();
    if (!isNative() || !ln) return 'unsupported';
    let perm = await permission();
    if (perm !== 'granted') perm = await requestPermission();
    if (perm !== 'granted') return perm;
    await ln.schedule({
      notifications: [{
        id: 99999,
        title: t('notif.testTitle'),
        body: t('notif.testBody'),
        channelId: CHANNEL_ID,
        smallIcon: 'ic_stat_class',
        iconColor: '#4F46E5',
        schedule: { at: new Date(Date.now() + 5000), allowWhileIdle: true }
      }]
    });
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
    leadFor: leadFor
  };
})();
