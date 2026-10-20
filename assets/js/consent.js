/* AMEA cookie consent.
   Optional categories stay off until the visitor says yes:
   - maps: the Google Maps embed on the Contact page (Google may set cookies)
   - analytics: Google Analytics 4, only when AMEA_CONFIG.ANALYTICS_ID is set
   The choice is kept in this browser's localStorage (no cookie of our own).
   "Cookie settings" in the footer reopens the panel at any time. */
(function () {
  'use strict';
  var KEY = 'amea-consent', VERSION = 1;
  var cfg = window.AMEA_CONFIG || {};
  var GA_ID = /^G-[A-Z0-9]+$/.test(cfg.ANALYTICS_ID || '') ? cfg.ANALYTICS_ID : '';
  var listeners = [];

  function read() {
    try { var v = JSON.parse(localStorage.getItem(KEY)); return v && v.v === VERSION ? v : null; } catch (e) { return null; }
  }
  function write(c) {
    c.v = VERSION; c.ts = new Date().toISOString();
    try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {}
    state = c; apply(); listeners.forEach(function (fn) { try { fn(state); } catch (e) {} });
  }
  var state = read();

  /* ---------- what each category switches on ---------- */
  var gaLoaded = false;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  if (GA_ID) {
    gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  }
  function apply() {
    var c = state || {};
    document.querySelectorAll('iframe[data-consent="maps"]').forEach(function (f) {
      if (c.maps) showMap(f);
    });
    if (GA_ID) {
      gtag('consent', 'update', { analytics_storage: c.analytics ? 'granted' : 'denied' });
      if (c.analytics && !gaLoaded) {
        gaLoaded = true;
        var s = document.createElement('script');
        s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
        document.head.appendChild(s);
        gtag('js', new Date());
        gtag('config', GA_ID, { anonymize_ip: true });
      }
      if (!c.analytics) clearGaCookies();
    }
  }
  function clearGaCookies() {
    document.cookie.split(';').forEach(function (p) {
      var name = p.split('=')[0].trim();
      if (/^_ga/.test(name)) {
        var host = location.hostname.replace(/^www\./, '');
        ['', '; domain=' + host, '; domain=.' + host].forEach(function (d) {
          document.cookie = name + '=; Max-Age=0; path=/' + d;
        });
      }
    });
  }
  function showMap(f) {
    if (f.getAttribute('src')) return;
    f.setAttribute('src', f.getAttribute('data-src'));
    var gate = f.parentNode.querySelector('.map-consent');
    if (gate) gate.hidden = true;
  }

  /* ---------- Contact page: map placeholder ---------- */
  document.querySelectorAll('iframe[data-consent="maps"]').forEach(function (f) {
    var gate = f.parentNode.querySelector('.map-consent');
    if (!gate) return;
    gate.querySelector('[data-map-once]').addEventListener('click', function () { showMap(f); });
    gate.querySelector('[data-map-always]').addEventListener('click', function () {
      write({ maps: true, analytics: !!(state && state.analytics) });
      closeBanner();
    });
  });

  /* ---------- banner and settings panel ---------- */
  var banner;
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (html != null) n.innerHTML = html;
    return n;
  }
  function row(id, title, text, locked, on) {
    return '<label class="cc-row' + (locked ? ' is-locked' : '') + '"><span><strong>' + title + '</strong><small>' + text + '</small></span>' +
      '<input type="checkbox" class="cc-switch" data-cat="' + id + '"' + (on ? ' checked' : '') + (locked ? ' disabled' : '') + '></label>';
  }
  function buildBanner() {
    var c = state || {};
    banner = el('section', { class: 'cc', role: 'dialog', 'aria-live': 'polite', 'aria-labelledby': 'cc-title', 'aria-describedby': 'cc-text' });
    banner.innerHTML =
      '<h2 id="cc-title" class="cc-title">Cookies on this site</h2>' +
      '<p id="cc-text" class="cc-text">We only use what the site needs to work. With your permission we also load ' +
      (GA_ID ? 'Google Analytics, to understand how the site is used, and ' : '') +
      'Google Maps on the Contact page, which may set Google cookies. <a href="cookies.html">Cookie Policy</a></p>' +
      '<div class="cc-panel" hidden>' +
        row('necessary', 'Necessary', 'Keeps the site working and remembers this choice. Always on.', true, true) +
        row('maps', 'Maps', 'Shows the Google Maps view of our Kano office.', false, c.maps) +
        (GA_ID ? row('analytics', 'Analytics', 'Anonymous visit statistics through Google Analytics.', false, c.analytics) : '') +
      '</div>' +
      '<div class="cc-actions">' +
        '<button type="button" class="btn btn--gold btn--sm" data-cc="all">Accept all</button>' +
        '<button type="button" class="btn btn--sm cc-ghost" data-cc="none">Necessary only</button>' +
        '<button type="button" class="cc-link" data-cc="settings" aria-expanded="false">Settings</button>' +
      '</div>';
    document.body.appendChild(banner);
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]'); if (!b) return;
      var act = b.getAttribute('data-cc'), panel = banner.querySelector('.cc-panel');
      if (act === 'all') { write({ maps: true, analytics: !!GA_ID }); closeBanner(); }
      else if (act === 'none') { write({ maps: false, analytics: false }); closeBanner(); }
      else if (act === 'settings') {
        panel.hidden = false; b.hidden = true;
        var save = el('button', { type: 'button', class: 'btn btn--sm cc-ghost', 'data-cc': 'save' }, 'Save choices');
        banner.querySelector('.cc-actions').insertBefore(save, banner.querySelector('[data-cc="none"]'));
        panel.querySelector('input:not([disabled])').focus();
      } else if (act === 'save') {
        var pick = {};
        banner.querySelectorAll('.cc-switch[data-cat]').forEach(function (i) { pick[i.getAttribute('data-cat')] = i.checked; });
        write({ maps: !!pick.maps, analytics: !!pick.analytics }); closeBanner();
      }
    });
    requestAnimationFrame(function () { banner.classList.add('is-in'); });
  }
  function openBanner(withSettings) {
    if (banner) banner.remove();
    buildBanner();
    if (withSettings) banner.querySelector('[data-cc="settings"]').click();
  }
  function closeBanner() {
    if (!banner) return;
    var b = banner; banner = null;
    b.classList.remove('is-in');
    setTimeout(function () { b.remove(); }, 300);
  }

  /* Footer: "Cookie settings" next to the Cookie Policy link */
  document.querySelectorAll('.site-footer a[href="cookies.html"]').forEach(function (a) {
    var li = a.closest('li');
    var btn = el('button', { type: 'button', class: 'flink cc-open' }, 'Cookie settings');
    btn.addEventListener('click', function () { openBanner(true); });
    if (li) { var n = el('li'); n.appendChild(btn); li.parentNode.insertBefore(n, li.nextSibling); }
  });

  window.AMEAConsent = {
    get: function () { return state; },
    onChange: function (fn) { listeners.push(fn); },
    open: function () { openBanner(true); }
  };

  apply();
  if (!state) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { openBanner(false); });
    else openBanner(false);
  }
})();
