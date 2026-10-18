/* AMEA motion layer.
   Reveal on scroll (word-by-word titles, fade-up blocks), count-up figures, rolling button labels,
   scroll-linked sections (expanding photo, process rail, stacking cards, card deck), carousel and FAQ.
   Everything is visible and usable without JavaScript, and all movement is skipped for visitors who
   prefer reduced motion. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) root.classList.add('motion');

  /* ---------- Rolling labels on buttons and menu links ---------- */
  document.querySelectorAll('.btn, a.navlink, a.flink').forEach(function (el) {
    if (el.querySelector('.roll') || el.querySelector('.btn-label')) return;
    if (el.closest('form')) {
      /* Form buttons keep a plain label (it changes to "Sending…") but get the same arrow tile */
      var t = Array.prototype.find.call(el.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
      if (!t) return;
      var lab = document.createElement('span'); lab.className = 'btn-label'; lab.textContent = t.textContent.trim();
      el.replaceChild(lab, t);
      if (el.classList.contains('btn--gold') || el.classList.contains('btn--ink')) {
        var tl = document.createElement('span'); tl.className = 'btn-tile'; tl.setAttribute('aria-hidden', 'true');
        tl.innerHTML = '<svg viewBox="0 0 16 16"><path d="M4 12L12 4M6 4h6v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
        el.appendChild(tl);
      }
      return;
    }
    var textNode = Array.prototype.find.call(el.childNodes, function (n) { return n.nodeType === 3 && n.textContent.trim(); });
    if (!textNode) return;
    var label = textNode.textContent.trim();
    var roll = document.createElement('span');
    roll.className = 'roll';
    roll.innerHTML = '<span class="roll-a"></span><span class="roll-b" aria-hidden="true"></span>';
    roll.firstChild.textContent = label; roll.lastChild.textContent = label;
    el.replaceChild(roll, textNode);
    if ((el.classList.contains('btn--gold') || el.classList.contains('btn--ink') || el.classList.contains('btn--tile')) && !el.querySelector('.btn-tile')) {
      var tile = document.createElement('span');
      tile.className = 'btn-tile'; tile.setAttribute('aria-hidden', 'true');
      tile.innerHTML = '<svg viewBox="0 0 16 16"><path d="M4 12L12 4M6 4h6v6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      el.appendChild(tile);
    }
  });

  if (reduce) { initStatic(); return; }

  /* ---------- Word-by-word titles ---------- */
  function splitWords(el) {
    if (el.dataset.split === 'done') return;
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = words.map(function (w, i) { return '<span class="w" aria-hidden="true"><span class="wi" style="--w:' + i + '">' + w.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</span></span>'; }).join(' ');
    el.dataset.split = 'done';
    el.classList.add('wsplit');
  }
  document.querySelectorAll('[data-split], .section-head h2, .page-head h1, .hero h1, .cta-inner h2, .feature-head h2').forEach(splitWords);

  /* ---------- Fade-up blocks, staggered within their group ---------- */
  var REVEAL = '[data-reveal], .svc-card, .theme-card, .mcard, .vm-card, .lic-types > div, .stats-row, .title-list li, .field-card, .standards-list li, .apply-card, .fact-list li, .section-head p, .badge, .area-card, .specimen, .mineral, .pro-list li, .pillar, .value, .person, .split-media, .gallery figure, .rule-list li, .ticks li, .goals li, .faq-item, .why-card, .stat-cell, .tag-key, .portfolio-more, .lead, .page-head .crumbs, .btn-row, .hero-activities, .hero-proof, .process-media, .stack-tabs, .area-row, .m3-legend, .feature-row, .cta-inner > div';
  document.querySelectorAll(REVEAL).forEach(function (el) {
    if (el.closest('.m3-stage')) return;
    el.classList.add('rv');
    var sib = Array.prototype.filter.call(el.parentElement.children, function (c) { return c.matches(REVEAL); });
    el.style.setProperty('--d', Math.min(sib.indexOf(el), 8));
  });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  document.querySelectorAll('.rv, .wsplit').forEach(function (el) { io.observe(el); });
  /* hero content plays on load */
  requestAnimationFrame(function () { document.querySelectorAll('.hero .rv, .hero .wsplit, .page-head .rv, .page-head .wsplit').forEach(function (el) { el.classList.add('is-in'); }); root.classList.add('loaded'); });

  /* ---------- Hero: looping services line ---------- */
  document.querySelectorAll('.hero-loop').forEach(function (box) {
    var win = box.querySelector('.hl-window'), track = box.querySelector('.hl-track');
    var items = Array.prototype.slice.call(track.children);
    if (items.length < 2) return;
    track.appendChild(items[0].cloneNode(true)); /* lets the last word roll on to the first */
    var i = 0, timer = null;
    function w(n) { return Math.ceil(items[n % items.length].firstChild.getBoundingClientRect().width) + 'px'; }
    function fit() { win.style.width = w(i); }
    function step() {
      i++;
      track.style.transform = 'translateY(' + (-i * 1.3) + 'em)';
      win.style.width = w(i);
      if (i === items.length) {
        setTimeout(function () { track.style.transition = 'none'; i = 0; track.style.transform = 'translateY(0)'; void track.offsetWidth; track.style.transition = ''; }, 750);
      }
    }
    function start() { if (!timer) timer = setInterval(step, 2400); }
    function stop() { clearInterval(timer); timer = null; }
    fit(); window.addEventListener('resize', fit);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    start();
  });

  /* ---------- Count-up figures ---------- */
  var cio = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target; cio.unobserve(el);
      var isYear = /^(19|20)\d\d$/.test(el.dataset.count); var to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length, t0 = null, dur = 1600;
      function step(t) {
        if (!t0) t0 = t;
        var k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        var from = isYear ? Math.floor(to / 100) * 100 : 0;
        el.textContent = (from + (to - from) * e).toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec, useGrouping: !isYear });
        if (k < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-count]').forEach(function (el) { el.style.minWidth = el.getBoundingClientRect().width + 'px'; el.style.display = 'inline-block'; el.textContent = /^(19|20)\d\d$/.test(el.dataset.count) ? String(Math.floor(parseFloat(el.dataset.count) / 100) * 100) : '0'; cio.observe(el); });

  /* ---------- Scroll-linked sections ---------- */
  var expands = Array.prototype.slice.call(document.querySelectorAll('[data-expand]'));
  var rails = Array.prototype.slice.call(document.querySelectorAll('[data-process]'));
  var stacks = Array.prototype.slice.call(document.querySelectorAll('[data-stack]'));
  var decks = Array.prototype.slice.call(document.querySelectorAll('[data-deck]'));
  var ticking = false;
  function clamp(v) { return Math.max(0, Math.min(1, v)); }
  function frame() {
    ticking = false;
    var vh = window.innerHeight;
    expands.forEach(function (sec) {
      var r = sec.getBoundingClientRect();
      var p = clamp(-r.top / Math.max(1, r.height - vh) * 1.6);
      sec.style.setProperty('--e', (1 - p).toFixed(4));
      /* Figures on the card follow the same scroll: up while the photo expands, down when it shrinks back */
      var span = (r.height - vh) / 1.6, q = clamp((vh * 0.9 - r.top) / Math.max(1, vh * 0.9 + span)), k = 1 - Math.pow(1 - q, 2);
      sec.querySelectorAll('[data-scroll-count]').forEach(function (el) {
        var to = parseFloat(el.dataset.scrollCount), dec = (el.dataset.scrollCount.split('.')[1] || '').length;
        el.textContent = (to * k).toLocaleString('en-GB', { minimumFractionDigits: dec, maximumFractionDigits: dec });
      });
    });
    rails.forEach(function (sec) {
      if (sec.classList.contains('is-pin')) return;
      var list = sec.querySelector('.steps'); var r = list.getBoundingClientRect();
      var line = vh * 0.62;
      list.style.setProperty('--fill', clamp((line - r.top) / r.height).toFixed(4));
      list.querySelectorAll('.step').forEach(function (s) {
        var on = s.getBoundingClientRect().top < line;
        s.classList.toggle('is-active', on);
      });
    });
    stacks.forEach(function (sec) {
      var cards = sec.querySelectorAll('.stack-card'); var active = 0;
      cards.forEach(function (c, i) { if (c.getBoundingClientRect().top < vh * 0.55) active = i; });
      sec.querySelectorAll('.stack-tab').forEach(function (t, i) { t.classList.toggle('is-active', i === active); t.setAttribute('aria-current', i === active ? 'true' : 'false'); });
    });
    decks.forEach(function (sec) {
      var cards = Array.prototype.slice.call(sec.querySelectorAll('.deck-card'));
      cards.forEach(function (c, i) {
        var depth = 0;
        for (var j = i + 1; j < cards.length; j++) {
          var nr = cards[j].getBoundingClientRect(); var stickTop = parseFloat(getComputedStyle(cards[j]).top);
          depth += clamp(1 - (nr.top - stickTop) / (vh * 0.6));
        }
        c.style.setProperty('--depth', depth.toFixed(3));
      });
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();

  initStatic();

  /* Pieces that work with or without motion */
  function initStatic() {
    /* Process: the photo beside the steps changes to match the step being read */
    document.querySelectorAll('[data-process]').forEach(function (sec) {
      var steps = sec.querySelectorAll('.step'), pics = sec.querySelectorAll('.process-media img'), cap = sec.querySelector('.process-media figcaption');
      if (!pics.length) return;
      var track = sec.querySelector('.process-track'), grid = sec.querySelector('.process-grid');
      var last = -1;
      /* Desktop with motion: the section pins and each step gets an equal share of the scroll. */
      function pinMode() {
        var on = !reduce && track && window.innerWidth > 860 && window.innerHeight >= 640;
        sec.classList.toggle('is-pin', on);
        return on;
      }
      var pinned = pinMode();
      window.addEventListener('resize', function () { pinned = pinMode(); last = -1; pick(); });
      function pick() {
        var idx = 0;
        if (pinned) {
          var r = track.getBoundingClientRect(), top = parseFloat(getComputedStyle(grid).top) || 0;
          var p = Math.max(0, Math.min(1, (top - r.top) / Math.max(1, r.height - grid.offsetHeight)));
          idx = Math.min(steps.length - 1, Math.floor(p * steps.length * 0.999));
          sec.querySelector('.steps').style.setProperty('--fill', p.toFixed(4));
          steps.forEach(function (s, i) { s.classList.toggle('is-active', i <= idx); });
        } else {
          var line = window.innerHeight * 0.62;
          steps.forEach(function (s, i) { if (s.getBoundingClientRect().top < line) idx = i; });
        }
        idx = Math.min(idx, pics.length - 1);
        if (idx === last) return; last = idx;
        pics.forEach(function (im, i) { im.classList.toggle('is-on', i === idx); });
        if (cap) cap.textContent = pics[idx].dataset.caption || '';
        steps.forEach(function (s, i) { s.classList.toggle('is-current', i === idx); });
      }
      window.addEventListener('scroll', function () { requestAnimationFrame(pick); }, { passive: true });
      pick();
    });

    /* Stacking-card tabs scroll to their card */
    document.querySelectorAll('[data-stack]').forEach(function (sec) {
      var marks = sec.querySelectorAll('.stack-mark');
      sec.querySelectorAll('.stack-tab').forEach(function (t, i) {
        t.addEventListener('click', function () { if (marks[i]) window.scrollTo({ top: marks[i].getBoundingClientRect().top + window.scrollY - (i === marks.length - 1 ? 300 : 104), behavior: reduce ? 'auto' : 'smooth' }); });
      });
    });

    /* Carousel: arrow buttons, and drag to scroll with a mouse */
    document.querySelectorAll('[data-carousel]').forEach(function (wrap) {
      var track = wrap.querySelector('.carousel-track');
      var prev = wrap.querySelector('[data-prev]'), next = wrap.querySelector('[data-next]');
      function by(dir) { var card = track.querySelector(':scope > *'); var w = card ? card.getBoundingClientRect().width + 20 : 320; track.scrollBy({ left: dir * w, behavior: reduce ? 'auto' : 'smooth' }); }
      function sync() { if (prev) prev.disabled = track.scrollLeft < 4; if (next) next.disabled = track.scrollLeft + track.clientWidth > track.scrollWidth - 4; }
      if (prev) prev.addEventListener('click', function () { by(-1); });
      if (next) next.addEventListener('click', function () { by(1); });
      track.addEventListener('scroll', sync, { passive: true }); sync();
      var down = false, sx = 0, sl = 0, moved = false;
      track.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = track.scrollLeft; track.classList.add('is-dragging'); });
      window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; track.scrollLeft = sl - dx; });
      window.addEventListener('pointerup', function () { if (!down) return; down = false; track.classList.remove('is-dragging'); });
      track.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    });

    /* FAQ accordion */
    document.querySelectorAll('.faq-q').forEach(function (b) {
      b.addEventListener('click', function () {
        var open = b.getAttribute('aria-expanded') !== 'true';
        b.setAttribute('aria-expanded', String(open));
        b.closest('.faq-item').classList.toggle('is-open', open);
      });
    });
  }
})();
