/* Mining page, "From the site": the clip plays silently while it is on
   screen and stops when it scrolls away. A pause button is always there,
   and visitors who prefer reduced motion get the poster plus a play button. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-site-reel]').forEach(function (box) {
    var video = box.querySelector('video');
    var btn = box.querySelector('.reel-toggle');
    if (!video || !btn) return;
    var userPaused = reduce;
    var inView = false;

    function label() {
      var playing = !video.paused;
      btn.setAttribute('aria-pressed', playing ? 'false' : 'true');
      btn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
      box.classList.toggle('is-playing', playing);
    }
    function play() {
      if (!video.getAttribute('src')) video.setAttribute('src', video.getAttribute('data-src'));
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    }

    btn.addEventListener('click', function () {
      if (video.paused) { userPaused = false; play(); }
      else { userPaused = true; video.pause(); }
    });
    video.addEventListener('play', label);
    video.addEventListener('pause', label);

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
        if (inView && !userPaused) play();
        else if (!inView && !video.paused) video.pause();
      }, { threshold: 0.35 }).observe(box);
    } else if (!userPaused) {
      play();
    }
    label();
  });
})();
