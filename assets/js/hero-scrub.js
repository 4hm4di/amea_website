/* AMEA home hero: the background film follows the scroll position.
   The hero pins while the visitor scrolls through the wrapper, and the
   video's currentTime is eased towards the scroll progress. Visitors who
   prefer reduced motion, or have Save-Data on, keep the still poster. */
(function () {
  'use strict';
  var wrap = document.querySelector('[data-hero-scrub]');
  if (!wrap) return;
  var video = wrap.querySelector('.hero-video');
  if (!video) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var saveData = navigator.connection && navigator.connection.saveData;
  if (reduce || saveData) return;

  var small = Math.min(window.innerWidth, screen.width || window.innerWidth) < 900;
  video.muted = true;
  video.setAttribute('muted', '');
  video.src = small ? video.getAttribute('data-src-sm') : video.getAttribute('data-src-lg');

  var hero = wrap.querySelector('.hero');
  var duration = 0, target = 0, current = 0, seeking = false, raf = 0;

  /* If the hero is taller than the screen (short laptops, small phones),
     it pins by its bottom edge so the buttons stay reachable. */
  function layout() {
    wrap.classList.add('is-scrub');
    wrap.style.setProperty('--hero-top', Math.min(0, window.innerHeight - hero.offsetHeight) + 'px');
    update();
  }

  function progress() {
    var r = wrap.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    if (span <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / span));
  }

  function update() {
    if (!duration) return;
    var p = progress();
    wrap.style.setProperty('--hp', p.toFixed(4));
    target = p * Math.max(0, duration - 0.05);
    if (!raf) raf = requestAnimationFrame(tick);
  }

  function tick() {
    raf = 0;
    current += (target - current) * 0.2;
    if (Math.abs(target - current) < 0.004) current = target;
    if (!seeking && Math.abs(video.currentTime - current) > 0.01) {
      seeking = true;
      try { video.currentTime = current; } catch (e) { seeking = false; }
    }
    if (current !== target) raf = requestAnimationFrame(tick);
  }

  video.addEventListener('seeked', function () {
    seeking = false;
    if (Math.abs(video.currentTime - current) > 0.01 && !raf) raf = requestAnimationFrame(tick);
  });
  video.addEventListener('loadedmetadata', function () {
    duration = video.duration || 0;
    update();
  });
  video.addEventListener('loadeddata', function () { wrap.classList.add('is-video-ready'); });

  /* iOS Safari only paints seeked frames once the element has played. */
  var primed = video.play();
  if (primed && primed.then) primed.then(function () { video.pause(); update(); }).catch(function () {});

  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', layout);
  if ('ResizeObserver' in window) new ResizeObserver(function () { wrap.style.setProperty('--hero-top', Math.min(0, window.innerHeight - hero.offsetHeight) + 'px'); }).observe(hero);
  layout();
})();
