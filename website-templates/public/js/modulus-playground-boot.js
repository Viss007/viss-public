(function () {
  function markInView(el) {
    if (!el) return;
    el.classList.add('dvele-inview');
  }

  function alreadyInView(el) {
    if (!el) return false;
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var inset = vh * 0.08;
    return r.bottom > inset && r.top < vh - inset;
  }

  function watch(el) {
    if (!el) return;
    if (el.dataset.vissaiRevealWatched === '1') return;
    el.dataset.vissaiRevealWatched = '1';
    if (!('IntersectionObserver' in window)) {
      markInView(el);
      return;
    }
    if (alreadyInView(el)) {
      markInView(el);
      return;
    }
    var io = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          markInView(entry.target);
          obs.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.1 }
    );
    io.observe(el);
  }

  function bindScrollReveal(root) {
    watch(root.querySelector('#top'));
    watch(root.querySelector('#process'));
    root.querySelectorAll('#care .dvele-benefit').forEach(function (article) {
      watch(article);
    });
    watch(root.querySelector('section.dvele-stat'));
  }

  function bindDrawer(root) {
    var openBtn = root.querySelector('#dvele-open-menu');
    var closeBtn = root.querySelector('#dvele-close-menu');
    var drawer = root.querySelector('#dvele-drawer');
    if (!openBtn || !drawer) return;

    function setOpen(open) {
      drawer.classList.toggle('is-open', open);
      openBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    }

    if (openBtn.dataset.vissaiDrawerOpen !== '1') {
      openBtn.dataset.vissaiDrawerOpen = '1';
      openBtn.addEventListener('click', function () {
        setOpen(true);
      });
    }
    if (closeBtn && closeBtn.dataset.vissaiDrawerClose !== '1') {
      closeBtn.dataset.vissaiDrawerClose = '1';
      closeBtn.addEventListener('click', function () {
        setOpen(false);
      });
    }
    drawer.querySelectorAll('a').forEach(function (a) {
      if (a.dataset.vissaiDrawerLink === '1') return;
      a.dataset.vissaiDrawerLink = '1';
      a.addEventListener('click', function () {
        setOpen(false);
      });
    });
  }

  function bindAuth(root) {
    var lightbox = root.querySelector('#dvele-auth-lightbox');
    if (!lightbox) return;
    if (lightbox.dataset.vissaiAuthBound === '1') return;
    lightbox.dataset.vissaiAuthBound = '1';

    var panelLogin = root.querySelector('#dvele-auth-panel-login');
    var panelRegister = root.querySelector('#dvele-auth-panel-register');
    var tabLogin = root.querySelector('#dvele-auth-tab-login');
    var tabRegister = root.querySelector('#dvele-auth-tab-register');
    var lastFocus = null;

    function setAuthMode(mode) {
      var isRegister = mode === 'register';
      if (panelLogin) panelLogin.hidden = isRegister;
      if (panelRegister) panelRegister.hidden = !isRegister;
      if (tabLogin) tabLogin.setAttribute('aria-selected', isRegister ? 'false' : 'true');
      if (tabRegister) tabRegister.setAttribute('aria-selected', isRegister ? 'true' : 'false');
    }

    function focusFirstInput(section) {
      if (!section) return;
      var inp = section.querySelector('input');
      if (inp) window.setTimeout(function () { inp.focus(); }, 0);
    }

    function openAuth(panel) {
      lastFocus = document.activeElement;
      lightbox.removeAttribute('hidden');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      setAuthMode(panel === 'register' ? 'register' : 'login');
      focusFirstInput(panel === 'register' ? panelRegister : panelLogin);
    }

    function setPasswordToggleState(btn, visible) {
      var wrap = btn.closest('.dvele-auth-lightbox__input-wrap');
      var input = wrap && wrap.querySelector('.dvele-auth-lightbox__input--password');
      if (!input) return;
      input.type = visible ? 'text' : 'password';
      btn.setAttribute('aria-pressed', visible ? 'true' : 'false');
      btn.setAttribute('aria-label', visible ? 'Hide password' : 'Show password');
      btn.classList.toggle('dvele-auth-lightbox__pw-toggle--revealed', visible);
    }

    function resetPasswordToggles() {
      lightbox.querySelectorAll('[data-auth-pw-toggle]').forEach(function (btn) {
        setPasswordToggleState(btn, false);
      });
    }

    function closeAuth() {
      lightbox.setAttribute('hidden', '');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      setAuthMode('login');
      resetPasswordToggles();
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    root.querySelectorAll('[data-action="open-auth"]').forEach(function (btn) {
      if (btn.dataset.vissaiAuthOpen === '1') return;
      btn.dataset.vissaiAuthOpen = '1';
      btn.addEventListener('click', function () {
        openAuth(btn.getAttribute('data-auth-panel') || 'login');
      });
    });

    lightbox.querySelectorAll('.dvele-auth-lightbox__tab[data-auth-mode]').forEach(function (tab) {
      tab.addEventListener('click', function (e) {
        e.stopPropagation();
        var mode = tab.getAttribute('data-auth-mode');
        if (mode !== 'login' && mode !== 'register') return;
        setAuthMode(mode);
        focusFirstInput(mode === 'register' ? panelRegister : panelLogin);
      });
    });

    lightbox.querySelectorAll('[data-auth-close]').forEach(function (el) {
      el.addEventListener('click', closeAuth);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (lightbox.hasAttribute('hidden')) return;
      closeAuth();
    });

    lightbox.querySelectorAll('form[data-auth-form]').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        var mode = form.getAttribute('data-auth-form');
        if (mode !== 'login') {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        var errEl = document.getElementById('dvele-auth-login-error');
        var loginUrl = form.getAttribute('data-login-url');
        if (errEl) {
          errEl.hidden = true;
          errEl.textContent = '';
        }
        if (!loginUrl) return;
        var fd = new FormData(form);
        var csrf = document.querySelector('meta[name="csrf-token"]');
        fetch(loginUrl, {
          method: 'POST',
          headers: {
            'X-CSRF-TOKEN': csrf ? csrf.content : '',
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            email: fd.get('email'),
            password: fd.get('password'),
          }),
        })
          .then(function (r) {
            return r.json().then(function (j) {
              return { ok: r.ok, body: j };
            });
          })
          .then(function (res) {
            if (res.ok && res.body && res.body.ok) {
              if (res.body.redirect) {
                window.location.href = res.body.redirect;
              } else {
                window.location.reload();
              }
              return;
            }
            var msg = 'Sign in failed.';
            if (res.body) {
              if (res.body.error) msg = res.body.error;
              else if (res.body.message) msg = res.body.message;
            }
            if (errEl) {
              errEl.textContent = msg;
              errEl.hidden = false;
            }
          })
          .catch(function () {
            if (errEl) {
              errEl.textContent = 'Network error.';
              errEl.hidden = false;
            }
          });
      });
    });

    lightbox.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-auth-pw-toggle]');
      if (!btn || !lightbox.contains(btn)) return;
      e.preventDefault();
      var wrap = btn.closest('.dvele-auth-lightbox__input-wrap');
      var input = wrap && wrap.querySelector('.dvele-auth-lightbox__input--password');
      if (!input) return;
      setPasswordToggleState(btn, input.type === 'password');
    });
  }

  function loadKontaktaiInview() {
    if (!document.getElementById('mod-contact-map')) return;
    document.querySelectorAll('script[data-vissai-kontaktai]').forEach(function (el) {
      el.remove();
    });
    var s = document.createElement('script');
    s.src = '/js/kontaktai-inview.js?v=1';
    s.dataset.vissaiKontaktai = '1';
    s.async = false;
    document.body.appendChild(s);
  }

  function loadModSimScript() {
    function appendSim() {
      document.querySelectorAll('script[data-vissai-mod-sim]').forEach(function (el) {
        el.remove();
      });
      var s = document.createElement('script');
      s.src = '/js/modulus-mod-sim.js?v=1';
      s.dataset.vissaiModSim = '1';
      s.async = false;
      document.body.appendChild(s);
    }
    if (document.querySelector('script[data-vissai-jspdf]') || window.jspdf) {
      appendSim();
      return;
    }
    var j = document.createElement('script');
    j.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    j.crossOrigin = 'anonymous';
    j.dataset.vissaiJspdf = '1';
    j.async = false;
    j.onload = appendSim;
    document.body.appendChild(j);
  }

  function boot() {
    var root = document.querySelector('.tpl-modulus');
    if (!root) return;
    if (root.getAttribute('data-modulus-page') === 'admin' || document.querySelector('[data-modulus-admin-hub]')) {
      if (typeof window.vissaiModulusAdminHubBoot === 'function') {
        window.vissaiModulusAdminHubBoot();
      }
      return;
    }
    if (root.getAttribute('data-modulus-page') === 'reach-out') {
      loadKontaktaiInview();
      return;
    }
    bindScrollReveal(root);
    bindDrawer(root);
    bindAuth(root);
    loadModSimScript();
  }

  window.vissaiModulusPlaygroundBoot = boot;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
