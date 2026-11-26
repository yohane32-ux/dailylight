// Pamoja notifications (fasting reminders). Lives next to the launcher on GitHub Pages.
// The app's server sends a "nudge" with no text; we ask the app what to say, or work it out from the fast's end time.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

function cfg() {
  return caches.open('pamoja-cfg').then(function (c) { return c.match('cfg'); }).then(function (r) { return r ? r.json() : {}; }).catch(function () { return {}; });
}
function hm(ts) { var d = new Date(ts); return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
function local(c) {
  var sw = c.lang === 'sw', now = Date.now(), end = Number(c.end) || 0;
  if (end && now < end && end - now <= 75 * 60000) return { title: sw ? '⏰ Saa 1 imebaki!' : '⏰ About 1 hour to go!', body: (sw ? 'Mfungo wako unaisha saa ' : 'Your fast ends at ') + hm(end) + ' 💜' };
  if (end && now < end) return { title: sw ? '⏳ Unafunga' : '⏳ You\'re fasting', body: (sw ? 'Inaisha saa ' : 'Ends at ') + hm(end) };
  if (end && now - end < 3 * 3600000) return { title: sw ? '🎉 Mfungo umekamilika!' : '🎉 Fast complete!', body: sw ? 'Fungua Pamoja kuona jinsi ya kufungua mfungo taratibu 🌅' : 'Open Pamoja for your gentle break-fast plan 🌅' };
  return { title: '💚 Pamoja', body: sw ? 'Gusa kufungua' : 'Tap to open' };
}
function note() {
  return cfg().then(function (c) {
    if (!c.a || !c.t) return local(c);
    var timer, give = new Promise(function (res) { timer = setTimeout(function () { res(null); }, 6000); });
    var ask = fetch(c.a + '?api=note&t=' + encodeURIComponent(c.t)).then(function (r) { return r.json(); }).catch(function () { return null; });
    return Promise.race([ask, give]).then(function (n) { clearTimeout(timer); return n && n.title ? n : local(c); });
  });
}
self.addEventListener('push', function (e) {
  e.waitUntil(note().then(function (n) {
    return self.registration.showNotification(n.title, { body: n.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: 'pamoja', renotify: true, vibrate: [200, 100, 200], data: { url: self.registration.scope } });
  }));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (ws) {
    for (var i = 0; i < ws.length; i++) if ('focus' in ws[i]) return ws[i].focus();
    return self.clients.openWindow((e.notification.data && e.notification.data.url) || './');
  }));
});
