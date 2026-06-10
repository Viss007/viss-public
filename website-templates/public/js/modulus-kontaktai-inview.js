/**
 * /reach-out scroll reveals — same contract as welcome (section#id + .dvele-inview).
 * Pairs with preset_libraries/animations/fade-rise-from-* in dvele-clone-rve.css.
 * Handles hash jumps (e.g. #contact-form): sections scrolled past still get .dvele-inview
 * because IntersectionObserver does not fire for bands the browser skips.
 */
(function () {
  var ids = ['top', 'mod-contact-map', 'mod-contact-reviews', 'mod-contact-split'];

  function dbg() {
    if (!window.__KONTAKTAI_ANIM_DEBUG__ && !/\banim_debug=1\b/.test(location.search || '')) return;
    console.info.apply(console, ['[kontaktai-anim]'].concat([].slice.call(arguments)));
  }

  function markInView(el) {
    if (!el) return;
    el.classList.add('dvele-inview');
    dbg('dvele-inview →', el.id || el.className);
  }

  function isScrolledPast(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    var past = r.bottom <= 0;
    if (past) dbg('scrolledPast (above fold)', el.id, { top: Math.round(r.top), bottom: Math.round(r.bottom) });
    return past;
  }

  function alreadyInView(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var inset = vh * 0.08;
    var ok = r.bottom > inset && r.top < vh - inset;
    dbg('alreadyInView', el.id, { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: vh, ok: ok });
    return ok;
  }

  function watch(el) {
    if (!el) {
      dbg('watch: element missing');
      return;
    }
    if (!('IntersectionObserver' in window)) {
      dbg('no IntersectionObserver — marking all in view');
      markInView(el);
      return;
    }
    if (isScrolledPast(el)) {
      markInView(el);
      return;
    }
    if (alreadyInView(el)) {
      markInView(el);
      return;
    }
    dbg('observing', el.id);
    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          dbg('intersection', entry.target.id, 'isIntersecting=', entry.isIntersecting, 'ratio=', entry.intersectionRatio);
          if (!entry.isIntersecting) return;
          markInView(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: '0px 0px -5% 0px', threshold: 0.06 }
    );
    io.observe(el);
  }

  function boot() {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) dbg('MISSING id in DOM:', id);
      watch(el);
    });
  }

  function scheduleBoot() {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        dbg('boot()');
        boot();
      });
    });
  }

  function reconcileAfterLayout() {
    dbg('reconcileAfterLayout');
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el || el.classList.contains('dvele-inview')) return;
      if (isScrolledPast(el) || alreadyInView(el)) {
        markInView(el);
      }
    });
  }

  function reconcileAfterHashScroll() {
    requestAnimationFrame(function () {
      requestAnimationFrame(reconcileAfterLayout);
    });
  }

  dbg('script loaded', { href: location.href, readyState: document.readyState, hasIO: 'IntersectionObserver' in window });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scheduleBoot, { once: true });
  } else {
    scheduleBoot();
  }

  window.addEventListener('load', function () {
    reconcileAfterHashScroll();
    setTimeout(reconcileAfterHashScroll, 0);
    setTimeout(reconcileAfterHashScroll, 120);
  }, { once: true });
  window.addEventListener('hashchange', function () {
    reconcileAfterHashScroll();
  });

  /** DevTools: __kontaktaiInviewReport() → { id, inview, rect }[] */
  window.__kontaktaiInviewReport = function () {
    return ids.map(function (id) {
      var el = document.getElementById(id);
      if (!el) return { id: id, missing: true };
      var r = el.getBoundingClientRect();
      return {
        id: id,
        dveleInview: el.classList.contains('dvele-inview'),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
      };
    });
  };
})();
