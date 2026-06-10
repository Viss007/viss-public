(function () {
      var SNAP = 30;
      /** #mod-floor-canvas inner size in px (floor plate can be wider than tall). */
      function getCanvasWidth() {
        if (!canvas) return 720;
        var w = canvas.clientWidth;
        return w || 720;
      }
      function getCanvasHeight() {
        if (!canvas) return 720;
        var h = canvas.clientHeight;
        return h || 720;
      }
      var SQ_M_PER_CELL = 0.25;
      var M_PER_CELL = 0.5;
      var EUR_PER_SQM = 1650;
      var MAGNET = 14;
      /** Minimum module size in grid cells (1 cell = 30px = 0.5 m). */
      var MIN_CELLS = 2;
      /** Pointer movement (px) before drag is treated as intentional (reduces focus noise). */
      var DRAG_ACTIVATE_PX = 5;
      var MODULES = {
        living: { label: 'Living Room', gw: 8, gh: 5, icon: '🛋️', color: '#3d6e9f', pdfRgb: [61, 110, 159] },
        kitchen: { label: 'Kitchen', gw: 6, gh: 4, icon: '🍴', color: '#c17f4a', pdfRgb: [193, 127, 74] },
        bedroom: { label: 'Bedroom', gw: 6, gh: 6, icon: '🛏️', color: '#4a8c5c', pdfRgb: [74, 140, 92] },
        bathroom: { label: 'Bathroom', gw: 4, gh: 4, icon: '🚿', color: '#6b8fa3', pdfRgb: [107, 143, 163] },
        toilet: { label: 'Toilet', gw: 2, gh: 2, icon: '🚽', color: '#5a7d8c', pdfRgb: [90, 125, 140] },
        bath_toilet: { label: 'Bath/Toilet', gw: 3, gh: 4, icon: '🚿🚽', color: '#5f86a0', pdfRgb: [95, 134, 160] },
        office: { label: 'Office', gw: 5, gh: 4, icon: '💼', color: '#6b5b95', pdfRgb: [107, 91, 149] },
        hallway: { label: 'Hall', gw: 6, gh: 2, icon: '🚪', color: '#8aa8c4', pdfRgb: [138, 168, 196] },
        garage: { label: 'Garage', gw: 8, gh: 6, icon: '🚗', color: '#5c6478', pdfRgb: [92, 100, 120] },
        garden: { label: 'Garden', gw: 6, gh: 6, icon: '🪴', color: '#2f6f4e', pdfRgb: [47, 111, 78] },
        front_yard: { label: 'FRONT YARD', gw: 6, gh: 4, icon: '🏡', color: '#3d8b6e', pdfRgb: [61, 139, 110] },
        back_yard: { label: 'BACK YARD', gw: 6, gh: 6, icon: '🌳', color: '#256340', pdfRgb: [37, 99, 64] },
        storage: { label: 'Storage Room', gw: 3, gh: 3, icon: '📦', color: '#8b7355', pdfRgb: [139, 115, 85] },
        balcony: { label: 'Balcony', gw: 4, gh: 2, icon: '🌤️', color: '#4a90c2', pdfRgb: [74, 144, 194] },
        boiler: { label: 'Boiler Room', gw: 2, gh: 2, icon: '🔥', color: '#a0523d', pdfRgb: [160, 82, 61] }
      };
      var canvas = document.getElementById('mod-floor-canvas');
      var layer = document.getElementById('mod-floor-modules');
      var totalEl = document.getElementById('mod-sim-total');
      var roomsEl = document.getElementById('mod-sim-rooms');
      var priceEl = document.getElementById('mod-sim-price');
      var genBtn = document.getElementById('mod-sim-generate');
      var pdfBtn = document.getElementById('mod-sim-pdf');
      var submitDesignBtn = document.getElementById('mod-sim-submit-design');
      var modal = document.getElementById('mod-sim-modal');
      var modalBackdrop = document.getElementById('mod-sim-modal-backdrop');
      var modalCancel = document.getElementById('mod-sim-modal-cancel');
      var modalConfirm = document.getElementById('mod-sim-modal-confirm');
      var submitOverlay = document.getElementById('mod-sim-submit-overlay');
      var submitOverlayBackdrop = document.getElementById('mod-sim-submit-overlay-backdrop');
      var submitOverlayClose = document.getElementById('mod-sim-submit-overlay-close');
      var submitOverlayBody = document.getElementById('mod-sim-submit-overlay-body');
      var submitOverlaySuccessView = document.getElementById('mod-sim-submit-overlay-success-view');
      var paletteRoot = document.querySelector('.mod-sim__palette');
      var paletteToggle = document.getElementById('mod-sim-palette-toggle');
      var palettePanel = document.getElementById('mod-sim-palette-panel');
      if (!canvas || !layer || !totalEl || !roomsEl || !priceEl) return;

      if (paletteRoot && paletteToggle && palettePanel) {
        function setPaletteCollapsed(collapsed) {
          paletteRoot.classList.toggle('mod-sim__palette--collapsed', collapsed);
          paletteToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
          paletteToggle.setAttribute('aria-label', collapsed ? 'Expand room modules' : 'Collapse room modules');
        }
        paletteToggle.addEventListener('click', function () {
          var collapsed = !paletteRoot.classList.contains('mod-sim__palette--collapsed');
          setPaletteCollapsed(collapsed);
        });
      }

      var eurFmt = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
      var uid = 0;
      function snap(n) {
        return Math.round(n / SNAP) * SNAP;
      }
      function clamp(v, lo, hi) {
        return Math.max(lo, Math.min(hi, v));
      }
      function formatDims(gw, gh) {
        return (gw * M_PER_CELL).toFixed(1) + ' m × ' + (gh * M_PER_CELL).toFixed(1) + ' m';
      }
      function hexToRgb(hex) {
        var h = hex.replace('#', '');
        return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
      }
      function applyModuleSize(el, gw, gh) {
        var def = MODULES[el.dataset.module];
        if (!def) return;
        var left = parseFloat(el.style.left) || 0;
        var top = parseFloat(el.style.top) || 0;
        var extW = getCanvasWidth();
        var extH = getCanvasHeight();
        var maxGw = Math.floor((extW - left) / SNAP);
        var maxGh = Math.floor((extH - top) / SNAP);
        gw = Math.min(Math.max(MIN_CELLS, gw), maxGw);
        gh = Math.min(Math.max(MIN_CELLS, gh), maxGh);
        el.dataset.gw = String(gw);
        el.dataset.gh = String(gh);
        el.style.width = gw * SNAP + 'px';
        el.style.height = gh * SNAP + 'px';
        var dim = el.querySelector('.mod-sim-module__dim-hint');
        if (dim) dim.textContent = formatDims(gw, gh);
        el.setAttribute('aria-label', def.label + ', ' + formatDims(gw, gh));
      }
      function getModuleCells(el) {
        var gw = parseInt(el.dataset.gw, 10);
        var gh = parseInt(el.dataset.gh, 10);
        var def = MODULES[el.dataset.module];
        if (!def) return { gw: 1, gh: 1 };
        if (!gw || !gh) {
          gw = def.gw;
          gh = def.gh;
        }
        return { gw: gw, gh: gh };
      }
      function createModuleEl(key, x, y) {
        var def = MODULES[key];
        if (!def) return null;
        var w = def.gw * SNAP;
        var h = def.gh * SNAP;
        var el = document.createElement('div');
        el.className = 'mod-sim-module mod-sim-module--' + key;
        el.dataset.uid = String(++uid);
        el.dataset.module = key;
        var extW = getCanvasWidth();
        var extH = getCanvasHeight();
        el.style.left = clamp(snap(x), 0, extW - w) + 'px';
        el.style.top = clamp(snap(y), 0, extH - h) + 'px';
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute(
          'title',
          'Drag to move, corner to resize. Keys: arrows nudge 0.5 m; Shift+arrows 2 m.'
        );
        applyModuleSize(el, def.gw, def.gh);
        var inner = document.createElement('div');
        inner.className = 'mod-sim-module__inner';
        var ic = document.createElement('span');
        ic.className = 'mod-sim-module__icon';
        ic.setAttribute('aria-hidden', 'true');
        ic.textContent = def.icon;
        var floor = document.createElement('span');
        floor.className = 'mod-sim-module__floor';
        floor.setAttribute('aria-hidden', 'true');
        var t = document.createElement('span');
        t.className = 'mod-sim-module__label';
        t.textContent = def.label;
        inner.appendChild(ic);
        inner.appendChild(floor);
        inner.appendChild(t);
        var removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'mod-sim-module__remove';
        removeBtn.setAttribute('aria-label', 'Remove ' + def.label);
        removeBtn.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>';
        removeBtn.addEventListener('pointerdown', function (e) {
          e.stopPropagation();
        });
        removeBtn.addEventListener('click', function (e) {
          e.stopPropagation();
          e.preventDefault();
          el.remove();
          updateSummary();
        });
        var dim = document.createElement('span');
        dim.className = 'mod-sim-module__dim-hint';
        dim.textContent = formatDims(def.gw, def.gh);
        var resizeHandle = document.createElement('button');
        resizeHandle.type = 'button';
        resizeHandle.className = 'mod-sim-module__resize';
        resizeHandle.setAttribute('aria-label', 'Resize ' + def.label);
        resizeHandle.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">' +
          '<path d="M7 17L17 7M14 7L17 7L17 10M10 17L7 17L7 14"/>' +
          '</svg>';
        var bottomBar = document.createElement('div');
        bottomBar.className = 'mod-sim-module__bottom-bar';
        bottomBar.appendChild(dim);
        bottomBar.appendChild(resizeHandle);
        el.appendChild(inner);
        el.appendChild(removeBtn);
        el.appendChild(bottomBar);
        layer.appendChild(el);
        bindModuleDrag(el);
        bindModuleResize(el, resizeHandle);
        updateSummary();
        return el;
      }
      function bindModuleResize(el, handle) {
        var state = null;
        var moveRaf = null;
        var pending = null;
        function flushResize() {
          moveRaf = null;
          if (!state || !pending) return;
          var dx = pending.clientX - state.sx;
          var dy = pending.clientY - state.sy;
          var rawW = state.sw + dx;
          var rawH = state.sh + dy;
          var left = parseFloat(el.style.left) || 0;
          var top = parseFloat(el.style.top) || 0;
          var extW0 = getCanvasWidth();
          var extH0 = getCanvasHeight();
          var maxGw = Math.floor((extW0 - left) / SNAP);
          var maxGh = Math.floor((extH0 - top) / SNAP);
          var gw = Math.min(Math.max(MIN_CELLS, Math.round(rawW / SNAP)), maxGw);
          var gh = Math.min(Math.max(MIN_CELLS, Math.round(rawH / SNAP)), maxGh);
          applyModuleSize(el, gw, gh);
          scheduleSummary();
        }
        function onMove(e) {
          if (!state || state.el !== el) return;
          pending = { clientX: e.clientX, clientY: e.clientY };
          if (!moveRaf) moveRaf = requestAnimationFrame(flushResize);
        }
        function onUp(e) {
          if (!state || state.el !== el) return;
          if (moveRaf != null) {
            cancelAnimationFrame(moveRaf);
            moveRaf = null;
            flushResize();
          }
          pending = null;
          try {
            handle.releasePointerCapture(e.pointerId);
          } catch (err) {}
          el.classList.remove('mod-sim-module--resizing');
          if (canvas) canvas.classList.remove('mod-sim-canvas--resizing');
          state = null;
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          document.removeEventListener('pointercancel', onUp);
          finalizePosition(el);
          updateSummary();
        }
        handle.addEventListener('pointerdown', function (e) {
          if (e.button !== 0) return;
          e.preventDefault();
          e.stopPropagation();
          var r = getRect(el);
          var left = r.x;
          var top = r.y;
          var extW0 = getCanvasWidth();
          var extH0 = getCanvasHeight();
          state = {
            el: el,
            sx: e.clientX,
            sy: e.clientY,
            sw: r.w,
            sh: r.h,
            maxGw: Math.floor((extW0 - left) / SNAP),
            maxGh: Math.floor((extH0 - top) / SNAP)
          };
          pending = { clientX: e.clientX, clientY: e.clientY };
          el.classList.add('mod-sim-module--resizing');
          if (canvas) canvas.classList.add('mod-sim-canvas--resizing');
          try {
            handle.setPointerCapture(e.pointerId);
          } catch (err2) {}
          document.addEventListener('pointermove', onMove, { passive: true });
          document.addEventListener('pointerup', onUp);
          document.addEventListener('pointercancel', onUp);
        });
      }
      function getRect(el) {
        var x = parseFloat(el.style.left) || 0;
        var y = parseFloat(el.style.top) || 0;
        var w = el.offsetWidth;
        var h = el.offsetHeight;
        return { x: x, y: y, w: w, h: h, r: x + w, b: y + h };
      }
      /** Snap to nearest other module edge within MAGNET (smallest correction wins per axis). */
      function magnetize(el) {
        var me = getRect(el);
        var bestDx = null;
        var bestDy = null;
        var others = layer.querySelectorAll('.mod-sim-module');
        for (var i = 0; i < others.length; i++) {
          var o = others[i];
          if (o === el) continue;
          var r = getRect(o);
          if (!(me.b <= r.y + 1 || me.y >= r.b - 1)) {
            var dR = r.r - me.x;
            if (Math.abs(dR) <= MAGNET && (bestDx === null || Math.abs(dR) < Math.abs(bestDx))) bestDx = dR;
            var dL = r.x - me.r;
            if (Math.abs(dL) <= MAGNET && (bestDx === null || Math.abs(dL) < Math.abs(bestDx))) bestDx = dL;
          }
          if (!(me.r <= r.x + 1 || me.x >= r.r - 1)) {
            var dB = r.b - me.y;
            if (Math.abs(dB) <= MAGNET && (bestDy === null || Math.abs(dB) < Math.abs(bestDy))) bestDy = dB;
            var dT = r.y - me.b;
            if (Math.abs(dT) <= MAGNET && (bestDy === null || Math.abs(dT) < Math.abs(bestDy))) bestDy = dT;
          }
        }
        if (bestDx !== null || bestDy !== null) {
          var extMW = getCanvasWidth();
          var extMH = getCanvasHeight();
          var nx = me.x + (bestDx !== null ? bestDx : 0);
          var ny = me.y + (bestDy !== null ? bestDy : 0);
          me.x = clamp(snap(nx), 0, extMW - me.w);
          me.y = clamp(snap(ny), 0, extMH - me.h);
          el.style.left = me.x + 'px';
          el.style.top = me.y + 'px';
        }
      }
      function finalizePosition(el) {
        var extW = getCanvasWidth();
        var extH = getCanvasHeight();
        var r = getRect(el);
        el.style.left = clamp(snap(r.x), 0, extW - r.w) + 'px';
        el.style.top = clamp(snap(r.y), 0, extH - r.h) + 'px';
        magnetize(el);
        var r2 = getRect(el);
        extW = getCanvasWidth();
        extH = getCanvasHeight();
        el.style.left = clamp(snap(r2.x), 0, extW - r2.w) + 'px';
        el.style.top = clamp(snap(r2.y), 0, extH - r2.h) + 'px';
      }
      function bindModuleDrag(el) {
        var drag = null;
        var moveRaf = null;
        var pending = null;
        function flushDragMove() {
          moveRaf = null;
          if (!drag || !pending) return;
          var cr = canvas.getBoundingClientRect();
          var nx = pending.clientX - cr.left - drag.ox;
          var ny = pending.clientY - cr.top - drag.oy;
          var extDW = getCanvasWidth();
          var extDH = getCanvasHeight();
          el.style.left = clamp(nx, 0, extDW - el.offsetWidth) + 'px';
          el.style.top = clamp(ny, 0, extDH - el.offsetHeight) + 'px';
          scheduleSummary();
        }
        function onPointerDown(e) {
          if (e.button !== 0) return;
          if (e.target.closest && e.target.closest('.mod-sim-module__resize')) return;
          if (e.target.closest && e.target.closest('.mod-sim-module__remove')) return;
          e.preventDefault();
          var rect = el.getBoundingClientRect();
          drag = {
            el: el,
            ox: e.clientX - rect.left,
            oy: e.clientY - rect.top,
            startX: e.clientX,
            startY: e.clientY,
            active: false
          };
          try {
            el.setPointerCapture(e.pointerId);
          } catch (errCap) {}
        }
        function onPointerMove(e) {
          if (!drag || drag.el !== el) return;
          if (!drag.active) {
            var adx = Math.abs(e.clientX - drag.startX);
            var ady = Math.abs(e.clientY - drag.startY);
            if (adx < DRAG_ACTIVATE_PX && ady < DRAG_ACTIVATE_PX) return;
            drag.active = true;
            el.classList.add('mod-sim-module--lift');
            if (canvas) canvas.classList.add('mod-sim-canvas--dragging');
          }
          pending = { clientX: e.clientX, clientY: e.clientY };
          if (!moveRaf) moveRaf = requestAnimationFrame(flushDragMove);
        }
        function onPointerUp(e) {
          if (!drag || drag.el !== el) return;
          if (moveRaf != null) {
            cancelAnimationFrame(moveRaf);
            moveRaf = null;
            if (pending && drag.active) flushDragMove();
          }
          pending = null;
          try {
            el.releasePointerCapture(e.pointerId);
          } catch (errRel) {}
          el.classList.remove('mod-sim-module--lift');
          if (canvas) canvas.classList.remove('mod-sim-canvas--dragging');
          if (drag.active) finalizePosition(el);
          drag = null;
          updateSummary();
        }
        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', onPointerUp);
        el.addEventListener('pointercancel', onPointerUp);
        el.addEventListener('keydown', function (e) {
          if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
          e.preventDefault();
          var step = e.shiftKey ? SNAP * 4 : SNAP;
          var r = getRect(el);
          var dx = 0;
          var dy = 0;
          if (e.key === 'ArrowLeft') dx = -step;
          else if (e.key === 'ArrowRight') dx = step;
          else if (e.key === 'ArrowUp') dy = -step;
          else if (e.key === 'ArrowDown') dy = step;
          var extW = getCanvasWidth();
          var extH = getCanvasHeight();
          el.style.left = clamp(snap(r.x + dx), 0, extW - r.w) + 'px';
          el.style.top = clamp(snap(r.y + dy), 0, extH - r.h) + 'px';
          finalizePosition(el);
          updateSummary();
        });
      }
      var summaryRaf = null;
      function updateSummary() {
        var sum = 0;
        var n = 0;
        layer.querySelectorAll('.mod-sim-module').forEach(function (el) {
          var key = el.dataset.module;
          var def = MODULES[key];
          if (def) {
            var c = getModuleCells(el);
            sum += c.gw * c.gh * SQ_M_PER_CELL;
            n += 1;
          }
        });
        totalEl.textContent = (Math.round(sum * 10) / 10) + ' m²';
        roomsEl.textContent = String(n);
        priceEl.textContent = eurFmt.format(Math.round(sum * EUR_PER_SQM));
      }
      function scheduleSummary() {
        if (summaryRaf != null) return;
        summaryRaf = requestAnimationFrame(function () {
          summaryRaf = null;
          updateSummary();
        });
      }
      function clearModules() {
        layer.innerHTML = '';
        updateSummary();
      }
      var paletteDrag = null;
      function isPointerOverCanvas(e) {
        var cr = canvas.getBoundingClientRect();
        return e.clientX >= cr.left && e.clientX <= cr.right && e.clientY >= cr.top && e.clientY <= cr.bottom;
      }
      var paletteMoveRaf = null;
      var palettePending = null;
      function flushPaletteMove() {
        paletteMoveRaf = null;
        if (!paletteDrag || !palettePending) return;
        var e = palettePending;
        var cr = canvas.getBoundingClientRect();
        var ox = paletteDrag.ox;
        var oy = paletteDrag.oy;
        var nx = e.clientX - cr.left - ox;
        var ny = e.clientY - cr.top - oy;
        if (!paletteDrag.el) {
          if (isPointerOverCanvas(e)) {
            paletteDrag.el = createModuleEl(paletteDrag.key, nx, ny);
            if (paletteDrag.el) {
              paletteDrag.el.classList.add('mod-sim-module--lift');
            }
          }
          return;
        }
        var el = paletteDrag.el;
        var extPW = getCanvasWidth();
        var extPH = getCanvasHeight();
        el.style.left = clamp(nx, 0, extPW - el.offsetWidth) + 'px';
        el.style.top = clamp(ny, 0, extPH - el.offsetHeight) + 'px';
        scheduleSummary();
      }
      function paletteMove(e) {
        if (!paletteDrag) return;
        palettePending = e;
        if (!paletteMoveRaf) paletteMoveRaf = requestAnimationFrame(flushPaletteMove);
      }
      function endPaletteDrag(e) {
        if (!paletteDrag) return;
        if (paletteMoveRaf != null) {
          cancelAnimationFrame(paletteMoveRaf);
          paletteMoveRaf = null;
        }
        palettePending = e;
        flushPaletteMove();
        palettePending = null;
        var chip = paletteDrag.chip;
        if (canvas) {
          canvas.classList.remove('mod-sim-canvas--palette-drag');
        }
        if (paletteRoot) {
          paletteRoot.classList.remove('mod-sim__palette--grabbing');
        }
        if (chip) {
          chip.classList.remove('mod-sim-chip--dragging');
          chip.removeAttribute('aria-grabbed');
          try {
            if (e.pointerId != null) {
              chip.releasePointerCapture(e.pointerId);
            }
          } catch (err) {}
        }
        var el = paletteDrag.el;
        if (el) {
          if (!isPointerOverCanvas(e)) {
            el.remove();
            updateSummary();
          } else {
            el.classList.remove('mod-sim-module--lift');
            finalizePosition(el);
            updateSummary();
          }
        }
        paletteDrag = null;
        document.removeEventListener('pointermove', paletteMove);
        document.removeEventListener('pointerup', endPaletteDrag);
        document.removeEventListener('pointercancel', endPaletteDrag);
      }
      document.querySelectorAll('.mod-sim-chip').forEach(function (chip) {
        chip.addEventListener('pointerdown', function (e) {
          if (e.button !== 0) return;
          e.preventDefault();
          var key = chip.dataset.module;
          var def = MODULES[key];
          if (!def) return;
          var ox = def.gw * SNAP / 2;
          var oy = def.gh * SNAP / 2;
          paletteDrag = { key: key, ox: ox, oy: oy, el: null, chip: chip };
          chip.classList.add('mod-sim-chip--dragging');
          chip.setAttribute('aria-grabbed', 'true');
          if (canvas) {
            canvas.classList.add('mod-sim-canvas--palette-drag');
          }
          if (paletteRoot) {
            paletteRoot.classList.add('mod-sim__palette--grabbing');
          }
          try {
            chip.setPointerCapture(e.pointerId);
          } catch (err2) {}
          document.addEventListener('pointermove', paletteMove);
          document.addEventListener('pointerup', endPaletteDrag);
          document.addEventListener('pointercancel', endPaletteDrag);
        });
      });

      /**
       * Modular floor plans (grid cells gx, gy; positions are top-left in cells; 1 cell = 30px = 0.5 m).
       * Together, presets exercise every key in MODULES (same set as .mod-sim-chip data-module).
       * Each Generate Layout click cycles to the next preset.
       */
      var LAYOUT_PRESETS = [
        /* 0 — Garden wing + balcony off kitchen */
        [
          { k: 'living', gx: 0, gy: 0 },
          { k: 'kitchen', gx: 8, gy: 0 },
          { k: 'hallway', gx: 14, gy: 0 },
          { k: 'balcony', gx: 8, gy: 4 },
          { k: 'garden', gx: 0, gy: 5 },
          { k: 'bedroom', gx: 6, gy: 5 },
          { k: 'bath_toilet', gx: 12, gy: 5 },
          { k: 'office', gx: 15, gy: 5 },
          { k: 'front_yard', gx: 0, gy: 11 }
        ],
        /* 1 — Garage entry + storage + boiler under kitchen wing */
        [
          { k: 'garage', gx: 0, gy: 0 },
          { k: 'living', gx: 8, gy: 0 },
          { k: 'kitchen', gx: 0, gy: 6 },
          { k: 'hallway', gx: 6, gy: 6 },
          { k: 'storage', gx: 0, gy: 10 },
          { k: 'boiler', gx: 3, gy: 10 },
          { k: 'bedroom', gx: 12, gy: 3 },
          { k: 'bathroom', gx: 6, gy: 8 },
          { k: 'office', gx: 10, gy: 8 }
        ],
        /* 2 — Separate WC + full bath + garden rear */
        [
          { k: 'living', gx: 0, gy: 0 },
          { k: 'kitchen', gx: 8, gy: 0 },
          { k: 'hallway', gx: 14, gy: 0 },
          { k: 'bedroom', gx: 0, gy: 5 },
          { k: 'bathroom', gx: 6, gy: 5 },
          { k: 'toilet', gx: 10, gy: 5 },
          { k: 'office', gx: 12, gy: 5 },
          { k: 'garden', gx: 0, gy: 11 }
        ],
        /* 3 — Storage mudroom + bath/toilet core */
        [
          { k: 'living', gx: 0, gy: 0 },
          { k: 'kitchen', gx: 8, gy: 0 },
          { k: 'hallway', gx: 14, gy: 0 },
          { k: 'storage', gx: 0, gy: 5 },
          { k: 'boiler', gx: 3, gy: 5 },
          { k: 'bath_toilet', gx: 5, gy: 5 },
          { k: 'bedroom', gx: 8, gy: 5 },
          { k: 'office', gx: 14, gy: 5 },
          { k: 'balcony', gx: 0, gy: 8 }
        ],
        /* 4 — Garage + deep garden + office */
        [
          { k: 'garage', gx: 0, gy: 0 },
          { k: 'living', gx: 8, gy: 0 },
          { k: 'kitchen', gx: 0, gy: 6 },
          { k: 'garden', gx: 6, gy: 6 },
          { k: 'bedroom', gx: 0, gy: 12 },
          { k: 'bathroom', gx: 6, gy: 12 },
          { k: 'office', gx: 10, gy: 12 }
        ],
        /* 5 — Balcony + split toilet + garden courtyard */
        [
          { k: 'living', gx: 0, gy: 0 },
          { k: 'kitchen', gx: 8, gy: 0 },
          { k: 'hallway', gx: 14, gy: 0 },
          { k: 'balcony', gx: 8, gy: 4 },
          { k: 'bedroom', gx: 0, gy: 5 },
          { k: 'bathroom', gx: 6, gy: 5 },
          { k: 'toilet', gx: 10, gy: 5 },
          { k: 'office', gx: 12, gy: 5 },
          { k: 'garden', gx: 0, gy: 11 }
        ],
        /* 6 — Utility stack + garage pad */
        [
          { k: 'living', gx: 0, gy: 0 },
          { k: 'kitchen', gx: 8, gy: 0 },
          { k: 'hallway', gx: 14, gy: 0 },
          { k: 'storage', gx: 0, gy: 5 },
          { k: 'boiler', gx: 3, gy: 5 },
          { k: 'bedroom', gx: 5, gy: 5 },
          { k: 'bath_toilet', gx: 11, gy: 5 },
          { k: 'office', gx: 14, gy: 5 },
          { k: 'garage', gx: 0, gy: 11 }
        ],
        /* 7 — Garden suite + balcony nook */
        [
          { k: 'living', gx: 0, gy: 0 },
          { k: 'kitchen', gx: 8, gy: 0 },
          { k: 'hallway', gx: 14, gy: 0 },
          { k: 'bedroom', gx: 0, gy: 5 },
          { k: 'bath_toilet', gx: 6, gy: 5 },
          { k: 'garden', gx: 9, gy: 5 },
          { k: 'office', gx: 15, gy: 5 },
          { k: 'balcony', gx: 0, gy: 11 }
        ],
        /* 8 — Garage + garden + bath cluster */
        [
          { k: 'garage', gx: 0, gy: 0 },
          { k: 'living', gx: 8, gy: 0 },
          { k: 'kitchen', gx: 0, gy: 6 },
          { k: 'hallway', gx: 6, gy: 6 },
          { k: 'bedroom', gx: 12, gy: 3 },
          { k: 'bathroom', gx: 6, gy: 8 },
          { k: 'toilet', gx: 10, gy: 8 },
          { k: 'garden', gx: 0, gy: 10 }
        ],
        /* 9 — Premium mix: balcony, storage, boiler, garden */
        [
          { k: 'living', gx: 0, gy: 0 },
          { k: 'kitchen', gx: 8, gy: 0 },
          { k: 'hallway', gx: 14, gy: 0 },
          { k: 'balcony', gx: 8, gy: 4 },
          { k: 'bedroom', gx: 0, gy: 5 },
          { k: 'bathroom', gx: 6, gy: 5 },
          { k: 'office', gx: 10, gy: 5 },
          { k: 'storage', gx: 15, gy: 5 },
          { k: 'boiler', gx: 18, gy: 5 },
          { k: 'garden', gx: 0, gy: 11 }
        ],
        /* 10 — Street front + utility strip (front_yard; chips not in 0–9 get coverage here) */
        [
          { k: 'living', gx: 0, gy: 0 },
          { k: 'kitchen', gx: 8, gy: 0 },
          { k: 'hallway', gx: 14, gy: 0 },
          { k: 'bedroom', gx: 0, gy: 5 },
          { k: 'bathroom', gx: 6, gy: 5 },
          { k: 'office', gx: 10, gy: 5 },
          { k: 'storage', gx: 15, gy: 5 },
          { k: 'boiler', gx: 18, gy: 5 },
          { k: 'front_yard', gx: 0, gy: 11 }
        ],
        /* 11 — Garage row + rear back_yard (garden beside bedroom wing) */
        [
          { k: 'garage', gx: 0, gy: 0 },
          { k: 'living', gx: 8, gy: 0 },
          { k: 'kitchen', gx: 16, gy: 0 },
          { k: 'hallway', gx: 22, gy: 0 },
          { k: 'balcony', gx: 22, gy: 2 },
          { k: 'garden', gx: 0, gy: 6 },
          { k: 'bedroom', gx: 6, gy: 6 },
          { k: 'bathroom', gx: 12, gy: 6 },
          { k: 'office', gx: 16, gy: 6 },
          { k: 'back_yard', gx: 22, gy: 9 }
        ]
      ];
      var layoutPresetIndex = 0;
      /** After the first successful Generate Layout, further generates ask for confirmation first. */
      var hasGeneratedLayoutOnce = false;
      /** Set when the confirm dialog was opened from Generate Layout (second+ press). */
      var modalPending = null;

      function applyPresetLayout() {
        clearModules();
        var plan = LAYOUT_PRESETS[layoutPresetIndex % LAYOUT_PRESETS.length];
        layoutPresetIndex += 1;
        plan.forEach(function (p) {
          createModuleEl(p.k, p.gx * SNAP, p.gy * SNAP);
        });
      }

      if (genBtn) {
        genBtn.addEventListener('click', function () {
          if (!hasGeneratedLayoutOnce) {
            applyPresetLayout();
            hasGeneratedLayoutOnce = true;
          } else {
            modalPending = 'generate';
            openNewDesignModal();
          }
        });
      }
      function openNewDesignModal() {
        if (!modal) return;
        modal.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        if (modalCancel) modalCancel.focus();
      }
      function closeNewDesignModal() {
        if (!modal) return;
        modal.setAttribute('hidden', '');
        document.body.style.overflow = '';
        modalPending = null;
      }
      if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeNewDesignModal);
      }
      if (modalCancel) {
        modalCancel.addEventListener('click', closeNewDesignModal);
      }
      if (modalConfirm) {
        modalConfirm.addEventListener('click', function () {
          if (modalPending === 'generate') {
            applyPresetLayout();
          }
          closeNewDesignModal();
        });
      }

      function resetSubmitOverlayToFormView() {
        if (submitOverlayBody) submitOverlayBody.removeAttribute('hidden');
        if (submitOverlaySuccessView) submitOverlaySuccessView.setAttribute('hidden', '');
        if (submitOverlay) {
          submitOverlay.setAttribute('aria-labelledby', 'mod-sim-submit-overlay-title');
        }
      }

      function openSubmitDesignOverlay() {
        if (!submitOverlay) return;
        if (modal && !modal.hasAttribute('hidden')) {
          closeNewDesignModal();
        }
        resetSubmitOverlayToFormView();
        submitOverlay.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        submitOverlay.setAttribute('aria-labelledby', 'mod-sim-submit-overlay-title');
        var firstInput = document.getElementById('mod-design-submit-name');
        if (firstInput) {
          firstInput.focus();
        }
      }

      function openSubmitDesignOverlaySuccessOnLoad() {
        if (!submitOverlay) return;
        submitOverlay.removeAttribute('hidden');
        document.body.style.overflow = 'hidden';
        submitOverlay.setAttribute('aria-labelledby', 'mod-sim-submit-overlay-success-title');
        if (submitOverlayClose) {
          submitOverlayClose.focus();
        }
      }

      function closeSubmitDesignOverlay() {
        if (!submitOverlay) return;
        resetSubmitOverlayToFormView();
        submitOverlay.setAttribute('hidden', '');
        document.body.style.overflow = '';
        if (submitDesignBtn) {
          submitDesignBtn.focus();
        }
      }

      if (submitOverlayBackdrop) {
        submitOverlayBackdrop.addEventListener('click', closeSubmitDesignOverlay);
      }
      if (submitOverlayClose) {
        submitOverlayClose.addEventListener('click', closeSubmitDesignOverlay);
      }

      document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        if (submitOverlay && !submitOverlay.hasAttribute('hidden')) {
          closeSubmitDesignOverlay();
          return;
        }
        if (modal && !modal.hasAttribute('hidden')) {
          closeNewDesignModal();
        }
      });
      function downloadPdf() {
        var j = window.jspdf;
        var JsPDF = j && (j.jsPDF || j.default);
        if (typeof JsPDF !== 'function') {
          window.alert('PDF library failed to load. Check your connection and try again.');
          return;
        }
        var doc = new JsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
        var modules = layer.querySelectorAll('.mod-sim-module');
        var sum = 0;
        var lines = [];
        modules.forEach(function (el) {
          var key = el.dataset.module;
          var def = MODULES[key];
          if (!def) return;
          var c = getModuleCells(el);
          var a = c.gw * c.gh * SQ_M_PER_CELL;
          sum += a;
          lines.push(def.label + ' — ' + formatDims(c.gw, c.gh) + ' — ' + (Math.round(a * 10) / 10) + ' m²');
        });
        var y = 18;
        doc.setFillColor(10, 37, 64);
        doc.rect(0, 0, 210, 14, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text('Modulus — floor layout', 14, 10);
        doc.setTextColor(10, 37, 64);
        doc.setFontSize(10);
        y = 24;
        doc.text('Generated ' + new Date().toLocaleString(), 14, y);
        y += 8;
        doc.setFont('helvetica', 'bold');
        doc.text('Room schedule', 14, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        if (lines.length === 0) {
          doc.setTextColor(100, 100, 100);
          doc.text('No modules placed.', 14, y);
          y += 6;
        } else {
          lines.forEach(function (ln) {
            doc.text(ln, 14, y);
            y += 5;
            if (y > 270) {
              doc.addPage();
              y = 20;
            }
          });
        }
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.text('Totals', 14, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        var rooms = modules.length;
        var price = Math.round(sum * EUR_PER_SQM);
        doc.text('Total area: ' + (Math.round(sum * 10) / 10) + ' m²', 14, y);
        y += 5;
        doc.text('Rooms placed: ' + rooms, 14, y);
        y += 5;
        doc.text('Estimated build (€' + EUR_PER_SQM + '/m²): ' + eurFmt.format(price), 14, y);
        y += 6;
        doc.setFontSize(8);
        doc.setTextColor(90, 90, 90);
        doc.text('Indicative estimate only. Not a quote.', 14, y);
        y += 10;
        var boxW = 120;
        var boxH = 120;
        if (y + boxH + 18 > 278) {
          doc.addPage();
          y = 20;
        }
        doc.setTextColor(10, 37, 64);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Plan (top view, 1 cell = 0.5 m)', 14, y);
        y += 4;
        var ox = 14;
        var oy = y + 4;
        doc.setDrawColor(180, 190, 200);
        doc.setLineWidth(0.3);
        var cw = getCanvasWidth();
        var ch = getCanvasHeight();
        var pdfScale = Math.min(boxW / cw, boxH / ch);
        var drawW = cw * pdfScale;
        var drawH = ch * pdfScale;
        var offPdfX = ox + (boxW - drawW) / 2;
        var offPdfY = oy + (boxH - drawH) / 2;
        doc.rect(offPdfX, offPdfY, drawW, drawH, 'S');
        modules.forEach(function (el) {
          var key = el.dataset.module;
          var def = MODULES[key];
          if (!def) return;
          var px = parseFloat(el.style.left) || 0;
          var py = parseFloat(el.style.top) || 0;
          var pw = el.offsetWidth;
          var ph = el.offsetHeight;
          var rgb = def.pdfRgb || hexToRgb(def.color);
          doc.setFillColor(rgb[0], rgb[1], rgb[2]);
          doc.rect(offPdfX + px * pdfScale, offPdfY + py * pdfScale, pw * pdfScale, ph * pdfScale, 'F');
          doc.setDrawColor(10, 37, 64);
          doc.setLineWidth(0.2);
          doc.rect(offPdfX + px * pdfScale, offPdfY + py * pdfScale, pw * pdfScale, ph * pdfScale, 'S');
        });
        doc.save('modulus-floor-layout.pdf');
      }
      if (pdfBtn) {
        pdfBtn.addEventListener('click', downloadPdf);
      }
      if (submitDesignBtn) {
        submitDesignBtn.addEventListener('click', openSubmitDesignOverlay);
      }
      if (submitOverlay && submitOverlay.getAttribute('data-open-success-on-load')) {
        openSubmitDesignOverlaySuccessOnLoad();
      } else if (submitOverlay && submitOverlay.getAttribute('data-open-on-load')) {
        openSubmitDesignOverlay();
      }
      if (window.ResizeObserver && canvas) {
        var resizeRaf = null;
        new ResizeObserver(function () {
          if (resizeRaf != null) cancelAnimationFrame(resizeRaf);
          resizeRaf = requestAnimationFrame(function () {
            resizeRaf = null;
            layer.querySelectorAll('.mod-sim-module').forEach(function (el) {
              finalizePosition(el);
            });
          });
        }).observe(canvas);
      }
      updateSummary();
    })();