/* AMEA site behaviour: glass header, navigation, 3D licence map, licence filters, enquiry form. */
(function () {
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: transparent bar -> glass pill on scroll ---------- */
  function onScroll() { root.classList.toggle('is-scrolled', window.scrollY > 24 || root.classList.contains('solid-header')); }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');
  function setNav(open) {
    nav.classList.toggle('open', open);
    root.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setNav(false); toggle.focus(); } });
  }

  /* ---------- "What we do" submenu ---------- */
  document.querySelectorAll('.has-menu > .navlink').forEach(function (btn) {
    var menu = document.getElementById(btn.getAttribute('aria-controls'));
    function close() { btn.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
    });
    document.addEventListener('click', function (e) { if (!btn.parentElement.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { close(); btn.focus(); } });
    btn.parentElement.addEventListener('focusout', function (e) { if (!btn.parentElement.contains(e.relatedTarget)) close(); });
  });

  /* ---------- 3D licence map ----------
     1. The flat map tilts into a landscape perspective.
     2. Once it has settled, the pins float down onto their sites in sequence.
     3. After that the map follows the pointer slightly. */
  document.querySelectorAll('[data-map]').forEach(function (map) {
    function start() {
      if (reduce) { map.classList.add('is-live', 'is-pinned', 'is-settled'); return; }
      map.classList.add('is-live');
      setTimeout(function () { map.classList.add('is-pinned'); }, 1500);
      setTimeout(function () { map.classList.add('is-settled'); enableTilt(); }, 2600);
    }
    function enableTilt() {
      if (!window.matchMedia('(pointer: fine)').matches) return;
      var area = map.closest('section') || map;
      var base = getComputedStyle(map);
      var rx0 = parseFloat(base.getPropertyValue('--rx')) || 54;
      var rz0 = parseFloat(base.getPropertyValue('--rz')) || -16;
      area.addEventListener('pointermove', function (e) {
        var r = map.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        map.style.setProperty('--rx', (rx0 - dy * 6).toFixed(2) + 'deg');
        map.style.setProperty('--rz', (rz0 + dx * 8).toFixed(2) + 'deg');
      });
      area.addEventListener('pointerleave', function () { map.style.removeProperty('--rx'); map.style.removeProperty('--rz'); });
    }
    if (!reduce && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { start(); io.disconnect(); } });
      }, { threshold: 0.25 });
      io.observe(map);
    } else { start(); }

    /* Select a marker to open its details (works for mouse, touch and keyboard) */
    function closeAll(except) {
      map.querySelectorAll('.pin.is-open').forEach(function (p) {
        if (p === except) return;
        p.classList.remove('is-open');
        p.querySelector('.pin-btn').setAttribute('aria-expanded', 'false');
      });
    }
    map.openPin = function (pin) {
      closeAll(pin);
      pin.classList.add('is-open');
      pin.querySelector('.pin-btn').setAttribute('aria-expanded', 'true');
    };
    map.querySelectorAll('.pin-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        var pin = b.closest('.pin');
        if (pin.classList.contains('is-open')) { closeAll(); } else { map.openPin(pin); }
      });
    });
    document.addEventListener('click', function (e) { if (!e.target.closest('.pin') && !e.target.closest('.site-link')) closeAll(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(); });
  });

  /* "Show on map" links in the site list and licence table */
  document.querySelectorAll('[data-pin]').forEach(function (link) {
    link.addEventListener('click', function () {
      var pin = document.getElementById(link.dataset.pin);
      if (!pin) return;
      var map = pin.closest('[data-map]');
      map.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      if (!map.classList.contains('is-pinned')) map.classList.add('is-live', 'is-pinned', 'is-settled');
      setTimeout(function () { map.openPin(pin); pin.querySelector('.pin-btn').focus({ preventScroll: true }); }, reduce ? 0 : 500);
    });
  });

  /* ---------- Licence filters ---------- */
  var filters = document.querySelector('[data-filters]');
  if (filters) {
    var rows = document.querySelectorAll('table.licences tbody tr');
    var status = document.getElementById('filter-status');
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      filters.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      var f = b.dataset.filter, shown = 0;
      rows.forEach(function (r) {
        var match = f === 'all' || (r.dataset.tags || '').split(' ').indexOf(f) > -1;
        r.hidden = !match; if (match) shown++;
      });
      if (status) status.textContent = 'Showing ' + shown + ' of ' + rows.length + ' licence titles';
    });
  }

  /* ---------- Enquiry forms ----------
     Every form marked data-enquiry posts to the Google Apps Script web app set in config.js.
     The script saves a row in the AMEA Google Sheet and emails info@amea.ng.
     A success message is shown only when the script confirms the row was saved. */
  document.querySelectorAll('form[data-enquiry]').forEach(function (form) {
    var select = form.querySelector('[name="enquiry_type"]');
    var mineralField = form.querySelector('.js-mineral');
    var submitBtn = form.querySelector('button[type="submit"]');
    var box = form.querySelector('.form-status');
    var type = new URLSearchParams(location.search).get('type');
    if (type && select && select.tagName === 'SELECT') Array.prototype.forEach.call(select.options, function (o) { if ((o.dataset.key || '').split(' ').indexOf(type) > -1) select.value = o.value; });
    function syncMineral() { if (mineralField && select) mineralField.hidden = select.value !== 'Mineral, trade and export'; }
    if (select) { select.addEventListener('change', syncMineral); syncMineral(); }

    function setError(input, msg) {
      var err = document.getElementById(input.id + '-error');
      input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) { err.textContent = msg || ''; err.hidden = !msg; }
    }
    function check(inp) {
      var msg = '';
      if (!inp.value.trim()) msg = 'Enter your ' + inp.dataset.name + '.';
      else if (inp.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(inp.value.trim())) msg = 'Enter an email address like name@company.com.';
      setError(inp, msg);
      return !msg;
    }
    function validate() {
      var first = null;
      form.querySelectorAll('[required]').forEach(function (inp) { if (!check(inp) && !first) first = inp; });
      if (first) first.focus();
      return !first;
    }
    /* Once a field has shown an error, re-check just that field as the visitor corrects it */
    form.querySelectorAll('[required]').forEach(function (inp) {
      ['input', 'change'].forEach(function (ev) {
        inp.addEventListener(ev, function () { if (inp.getAttribute('aria-invalid') === 'true') check(inp); });
      });
    });
    function show(kind, html) { box.className = 'form-status form-status--' + kind; box.innerHTML = html; box.hidden = false; box.focus(); }
    var sending = false;
    var t0 = form.querySelector('[name="t0"]'); if (t0) t0.value = String(Date.now());
    var ERR = 'Your enquiry was not sent. Check your connection and try again, or email <a href="mailto:info@amea.ng">info@amea.ng</a>.';
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (sending) return;
      if (!validate()) return;
      var endpoint = (window.AMEA_CONFIG && window.AMEA_CONFIG.FORM_ENDPOINT) || '';
      if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(endpoint)) { show('error', 'The enquiry form is not connected yet. Please email <a href="mailto:info@amea.ng">info@amea.ng</a>.'); return; }
      sending = true;
      submitBtn.disabled = true; submitBtn.setAttribute('aria-busy', 'true');
      var labelEl = submitBtn.querySelector('.btn-label') || submitBtn; var label = labelEl.textContent; labelEl.textContent = 'Sending…';
      box.hidden = true;
      /* Email subject names the enquiry type; "page" records where the enquiry was sent from */
      var subj = form.querySelector('[name="subject"]'), typ = form.querySelector('[name="enquiry_type"]'), pg = form.querySelector('[name="page"]');
      if (subj && typ && typ.value) subj.value = 'AMEA website enquiry: ' + typ.value;
      if (pg) pg.value = document.title + ' (' + location.pathname + ')';
      var body = new URLSearchParams(new FormData(form)).toString();
      /* A simple (no-preflight) POST to the Google Apps Script web app; success only when it confirms the row was saved */
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: body, redirect: 'follow' })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (data) {
          if (!data || data.result !== 'success') throw new Error((data && data.error) || 'Not saved');
          form.reset(); syncMineral(); if (t0) t0.value = String(Date.now());
          show('ok', 'Enquiry sent. Our team will reply to the email address you gave.');
        })
        .catch(function () { show('error', ERR); })
        .then(function () { sending = false; submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); labelEl.textContent = label; });
    });
  });

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
