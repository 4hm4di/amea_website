/* AMEA home hero: the background film follows the scroll position.
   The film is a sequence of still frames drawn to a canvas, which works
   the same in every browser and on every phone (including iPhones in Low
   Power Mode, where video seeking is unreliable). Frames load coarse to
   fine, so scrubbing works straight away and sharpens as the rest arrive.
   Visitors who prefer reduced motion, or have Save-Data on, keep the
   still poster. */
(function () {
  'use strict';
  var wrap = document.querySelector('[data-hero-scrub]');
  if (!wrap) return;
  var canvas = wrap.querySelector('.hero-canvas');
  var hero = wrap.querySelector('.hero');
  if (!canvas || !hero || !canvas.getContext) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  if (reduce || saveData) return;

  var small = Math.min(window.innerWidth, screen.width || window.innerWidth) < 900;
  var base = canvas.getAttribute(small ? 'data-frames-sm' : 'data-frames-lg');
  var count = parseInt(canvas.getAttribute('data-count'), 10) || 0;
  if (!base || !count) return;

  var ctx = canvas.getContext('2d');
  var frames = new Array(count);
  var ready = new Array(count);
  var target = 0, current = 0, drawn = -1, raf = 0, started = false;

  function src(i) { var n = String(i + 1); while (n.length < 3) n = '0' + n; return base + n + '.webp'; }

  /* Coarse-to-fine order: first frame, then every 32nd, 16th, 8th ... */
  var order = [0], seen = { 0: true };
  for (var step = 32; step >= 1; step = step >> 1) {
    for (var k = 0; k < count; k += step) if (!seen[k]) { seen[k] = true; order.push(k); }
  }
  if (!seen[count - 1]) order.push(count - 1);

  var next = 0, active = 0, LIMIT = 6;
  function pump() {
    while (active < LIMIT && next < order.length) load(order[next++]);
  }
  function load(i) {
    active++;
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      active--; frames[i] = img; ready[i] = true;
      if (!started) { started = true; wrap.classList.add('is-video-ready'); }
      drawn = -1; schedule(); pump();
    };
    img.onerror = function () { active--; pump(); };
    img.src = src(i);
  }

  function nearest(i) {
    if (ready[i]) return i;
    for (var d = 1; d < count; d++) {
      if (i - d >= 0 && ready[i - d]) return i - d;
      if (i + d < count && ready[i + d]) return i + d;
    }
    return -1;
  }

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; drawn = -1; }
  }

  function draw(i) {
    var f = nearest(i);
    if (f < 0 || f === drawn) return;
    var img = frames[f], cw = canvas.width, ch = canvas.height;
    if (!cw || !ch) return;
    /* object-fit: cover, honouring the focal point set in CSS */
    var pos = (getComputedStyle(canvas).objectPosition || '50% 50%').split(' ');
    var px = parseFloat(pos[0]) / 100, py = parseFloat(pos[1] || pos[0]) / 100;
    if (isNaN(px)) px = .5; if (isNaN(py)) py = .5;
    var s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    var dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    ctx.drawImage(img, (cw - dw) * px, (ch - dh) * py, dw, dh);
    drawn = f;
  }

  function progress() {
    var r = wrap.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / span));
  }

  function schedule() { if (!raf) raf = requestAnimationFrame(tick); }
  function tick() {
    raf = 0;
    current += (target - current) * 0.22;
    if (Math.abs(target - current) < 0.05) current = target;
    draw(Math.round(current));
    if (current !== target || drawn !== nearest(Math.round(current))) schedule();
  }

  function update() {
    var p = progress();
    wrap.style.setProperty('--hp', p.toFixed(4));
    target = p * (count - 1);
    schedule();
  }

  /* If the hero is taller than the screen (short laptops, small phones),
     it pins by its bottom edge so the buttons stay reachable. */
  function pinOffset() { wrap.style.setProperty('--hero-top', Math.min(0, window.innerHeight - hero.offsetHeight) + 'px'); }
  function layout() { wrap.classList.add('is-scrub'); pinOffset(); size(); update(); }

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', layout);
  if ('ResizeObserver' in window) new ResizeObserver(function () { pinOffset(); size(); schedule(); }).observe(hero);
  layout();
  pump();
})();
