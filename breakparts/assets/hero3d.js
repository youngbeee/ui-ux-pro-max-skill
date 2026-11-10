/* ==========================================================================
   BREAK PARTS · Sistema 3D de piezas (hero)
   - Las piezas orbitan alrededor del logo sobre una pista en perspectiva.
   - Arrastre / swipe para girar, flechas del teclado, botones anterior/siguiente.
   - Clic en la pieza del frente: busca esa familia en el catálogo.
   - Sin dependencias (CSS 3D). Funciona también abriendo el HTML desde el disco.
   Para cambiar nombres o búsquedas, define window.BP_HERO3D en assets/config.js:
     window.BP_HERO3D = { piezas: [{ id: 'master', img: 'assets/piezas/master.webp',
                                      nombre: 'Bomba de freno', buscar: 'bomba de freno' }, …] };
   ========================================================================== */
(function () {
  'use strict';

  var PIEZAS = [
    { id: 'master',    nombre: 'Bomba de freno (máster)', buscar: 'bomba de freno' },
    { id: 'servo',     nombre: 'Servofreno',              buscar: 'servo' },
    { id: 'pastillas', nombre: 'Pastillas de freno',      buscar: 'pastilla' },
    { id: 'disco',     nombre: 'Disco de freno',          buscar: 'disco' },
    { id: 'caliper',   nombre: 'Cáliper y disco',         buscar: 'caliper' },
    { id: 'bombin',    nombre: 'Bombín de rueda',         buscar: 'bombin' },
    { id: 'zapatas',   nombre: 'Zapatas',                 buscar: 'zapata' },
    { id: 'abs',       nombre: 'Módulo hidráulico',       buscar: 'hidraulico' }
  ];

  var TILT = 13 * Math.PI / 180;      // inclinación de la cámara (rad)
  var DWELL = 3200;                   // ms que cada pieza se queda al frente en reproducción automática
  var IDLE_AFTER_USER = 7000;         // ms sin tocar antes de volver a girar solo
  var TAU = Math.PI * 2;

  var stage = document.getElementById('stage');
  if (!stage) return;

  var cfg = window.BP_HERO3D || {};
  var piezas = (Array.isArray(cfg.piezas) && cfg.piezas.length ? cfg.piezas : PIEZAS).map(function (p) {
    return {
      id: p.id,
      nombre: p.nombre,
      buscar: p.buscar || p.nombre,
      img: p.img || ('assets/piezas/' + p.id + '.webp')
    };
  });
  var n = piezas.length;
  var step = TAU / n;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- DOM ---------- */
  var LOGO = '<svg viewBox="0 0 48 48" aria-hidden="true">' +
    '<circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" stroke-width="5"/>' +
    '<circle cx="24" cy="24" r="6.5" fill="none" stroke="currentColor" stroke-width="3"/>' +
    '<g fill="currentColor"><circle cx="24" cy="12.5" r="1.8"/><circle cx="34.9" cy="20.4" r="1.8"/><circle cx="30.8" cy="33.3" r="1.8"/><circle cx="17.2" cy="33.3" r="1.8"/><circle cx="13.1" cy="20.4" r="1.8"/></g>' +
    '<path d="M30.5 4.6 A20.5 20.5 0 0 1 43.6 18" fill="none" stroke="#D71920" stroke-width="7.5" stroke-linecap="round"/></svg>';
  var ARROW_L = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
  var ARROW_R = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';
  var ARROW_GO = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  var root = document.createElement('div');
  root.className = 'orbit';
  root.tabIndex = -1;
  root.setAttribute('role', 'region');
  root.setAttribute('aria-roledescription', 'carrusel 3D');
  root.setAttribute('aria-label', 'Piezas de frenos y embragues');
  root.innerHTML =
    '<p class="orbit__hint" aria-hidden="true">Arrastra para girar</p>' +
    '<div class="orbit__scene"><div class="orbit__world">' +
      '<div class="orbit__track"></div><div class="orbit__track--in"></div>' +
      '<div class="orbit__core">' + LOGO + '</div>' +
    '</div></div>' +
    '<div class="orbit__hud">' +
      '<button class="orbit__btn" type="button" data-dir="-1" aria-label="Pieza anterior">' + ARROW_L + '</button>' +
      '<div class="orbit__info">' +
        '<span class="orbit__count mono"></span>' +
        '<span class="orbit__name" aria-live="off"></span>' +
        '<button class="orbit__go" type="button">Ver en catálogo ' + ARROW_GO + '</button>' +
      '</div>' +
      '<button class="orbit__btn" type="button" data-dir="1" aria-label="Pieza siguiente">' + ARROW_R + '</button>' +
    '</div>';

  var scene = root.querySelector('.orbit__scene');
  var world = root.querySelector('.orbit__world');
  var core = root.querySelector('.orbit__core');
  var elCount = root.querySelector('.orbit__count');
  var elName = root.querySelector('.orbit__name');
  var elGo = root.querySelector('.orbit__go');

  var items = [];
  var shadows = [];
  piezas.forEach(function (p, i) {
    var sh = document.createElement('div');
    sh.className = 'orbit__shadow';
    world.appendChild(sh);
    shadows.push(sh);

    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'orbit__item';
    b.tabIndex = -1;
    b.setAttribute('aria-label', p.nombre + ': ver en el catálogo');
    var img = new Image();
    img.src = p.img;
    img.alt = '';
    img.decoding = 'async';
    img.draggable = false;
    if (i > 2) img.loading = 'lazy';
    b.appendChild(img);
    b.addEventListener('click', function () { onItemClick(i); });
    world.appendChild(b);
    items.push(b);
  });

  stage.appendChild(root);

  /* ---------- Medidas ---------- */
  var R = 200, SIZE = 160;
  function measure() {
    var w = scene.clientWidth, h = scene.clientHeight;
    if (!w || !h) return;
    R = Math.min(w * 0.37, h * 0.44);
    SIZE = R * 0.74;
    root.style.setProperty('--o-r', R + 'px');
    root.style.setProperty('--o-size', SIZE + 'px');
    root.style.setProperty('--o-floor', (SIZE * 0.46) + 'px');
    root.style.setProperty('--o-persp', Math.round(w * 2.4) + 'px');
    dirty = true;
  }

  /* ---------- Estado ---------- */
  var angle = 0;            // giro actual (rad)
  var target = 0;           // giro objetivo (rad) o null
  var vel = 0;              // rad/s (inercia tras arrastrar)
  var front = 0;
  var lastFront = -1;
  var dragging = false;
  var hover = false;
  var focused = false;
  var visible = true;
  var lastUser = -Infinity;
  var nextAuto = performance.now() + DWELL;
  var parX = 0, parY = 0, parTX = 0, parTY = 0;
  var dirty = true;
  var raf = 0;
  var t0 = performance.now();

  function mod(a, m) { return ((a % m) + m) % m; }
  function frontIndex(a) { return mod(Math.round(-a / step), n); }
  function angleFor(k, from) {
    var base = -k * step;
    return base + TAU * Math.round((from - base) / TAU);
  }
  function goTo(k, user) {
    k = mod(k, n);
    target = angleFor(k, target == null ? angle : target);
    vel = 0;
    if (user) touched();
    if (reduce) { angle = target; target = null; }
    kick();
  }
  function touched() {
    lastUser = performance.now();
    nextAuto = lastUser + IDLE_AFTER_USER;
    root.classList.add('is-touched');
    elName.setAttribute('aria-live', 'polite');
  }

  /* ---------- Render ---------- */
  function render(now) {
    var t = (now - t0) / 1000;
    world.style.transform = 'rotateX(' + (-TILT - parY * 0.06) + 'rad) rotateY(' + (parX * 0.10) + 'rad)';
    core.style.transform = 'rotateY(' + (-parX * 0.10) + 'rad) rotateX(' + (TILT + parY * 0.06) + 'rad) rotateZ(' + (reduce ? 0 : t * 12) + 'deg)';

    for (var i = 0; i < n; i++) {
      var a = angle + i * step;
      var s = Math.sin(a), c = Math.cos(a);
      var x = s * R, z = c * R;
      var bob = reduce ? 0 : Math.sin(t * 1.3 + i * 1.7) * SIZE * 0.025;
      var turn = -s * 24 - parX * 5.7;             // gira hacia el centro al pasar por los lados
      var k = (c + 1) / 2;                          // 0 = atrás, 1 = al frente
      items[i].style.transform =
        'translate3d(' + x.toFixed(2) + 'px,' + bob.toFixed(2) + 'px,' + z.toFixed(2) + 'px)' +
        ' rotateX(' + (TILT + parY * 0.06) + 'rad) rotateY(' + turn.toFixed(2) + 'deg)';
      items[i].style.opacity = (0.38 + 0.62 * k).toFixed(3);
      shadows[i].style.transform =
        'translate3d(' + x.toFixed(2) + 'px,' + (SIZE * 0.46).toFixed(2) + 'px,' + z.toFixed(2) + 'px)' +
        ' rotateX(90deg) scale(' + (0.9 - bob / SIZE * 2).toFixed(3) + ',0.55)';
      shadows[i].style.opacity = (0.4 + 0.6 * k).toFixed(3);
    }

    front = frontIndex(angle);
    if (front !== lastFront) {
      if (lastFront >= 0) {
        items[lastFront].tabIndex = -1;
        shadows[lastFront].classList.remove('is-front');
      }
      items[front].tabIndex = 0;
      shadows[front].classList.add('is-front');
      elCount.textContent = pad(front + 1) + ' / ' + pad(n);
      elName.textContent = piezas[front].nombre;
      elGo.setAttribute('aria-label', 'Ver ' + piezas[front].nombre + ' en el catálogo');
      lastFront = front;
    }
  }
  function pad(v) { return v < 10 ? '0' + v : '' + v; }

  /* ---------- Bucle ---------- */
  var prev = performance.now();
  function tick(now) {
    raf = 0;
    var dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    var moving = false;

    if (!dragging) {
      if (Math.abs(vel) > 0.02) {
        angle += vel * dt;
        vel *= Math.pow(0.03, dt);
        moving = true;
        if (Math.abs(vel) <= 0.35) { vel = 0; target = angleFor(frontIndex(angle), angle); }
      } else if (target != null) {
        var d = target - angle;
        angle += d * (1 - Math.exp(-dt * 6.5));
        if (Math.abs(d) < 0.0008) { angle = target; target = null; }
        moving = true;
      } else if (!reduce && !hover && !focused && visible && now >= nextAuto) {
        goTo(frontIndex(angle) + 1, false);
        nextAuto = now + DWELL;
        moving = true;
      }
    }

    // paralaje suave con el puntero
    parX += (parTX - parX) * (1 - Math.exp(-dt * 5));
    parY += (parTY - parY) * (1 - Math.exp(-dt * 5));
    if (Math.abs(parTX - parX) > 0.001 || Math.abs(parTY - parY) > 0.001) moving = true;

    if (moving || dirty || !reduce) { render(now); dirty = false; }
    if (visible && !document.hidden && (!reduce || moving || dragging)) raf = requestAnimationFrame(tick);
  }
  function kick() {
    if (!raf && visible && !document.hidden) {
      prev = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }

  /* ---------- Arrastre ---------- */
  var startX = 0, startY = 0, lastX = 0, lastT = 0, moved = 0, pid = null, suppressClick = false;

  root.addEventListener('pointerdown', function (e) {
    if (e.button !== 0 || e.target.closest('.orbit__hud')) return;
    pid = e.pointerId;
    startX = lastX = e.clientX;
    startY = e.clientY;
    lastT = performance.now();
    moved = 0;
    suppressClick = false;
    dragging = false;
    vel = 0;
  });
  root.addEventListener('pointermove', function (e) {
    if (pid === e.pointerId) {
      var dx = e.clientX - lastX;
      if (!dragging) {
        var tx = e.clientX - startX, ty = e.clientY - startY;
        if (Math.abs(tx) < 6 || Math.abs(tx) < Math.abs(ty)) return;
        dragging = true;
        target = null;
        root.classList.add('is-drag');
        try { root.setPointerCapture(pid); } catch (err) { /* sin captura */ }
        touched();
        kick();
      }
      var now = performance.now();
      var dA = dx / Math.max(R, 1) * 0.9;
      angle += dA;
      var dtm = Math.max(1, now - lastT) / 1000;
      vel = vel * 0.6 + (dA / dtm) * 0.4;
      lastX = e.clientX;
      lastT = now;
      moved += Math.abs(dx);
      dirty = true;
    } else if (e.pointerType === 'mouse' && !reduce) {
      var r = root.getBoundingClientRect();
      parTX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      parTY = ((e.clientY - r.top) / r.height - 0.5) * 2;
      kick();
    }
  });
  function endDrag(e) {
    if (pid !== e.pointerId) return;
    pid = null;
    if (dragging) {
      dragging = false;
      suppressClick = moved > 6;
      root.classList.remove('is-drag');
      if (performance.now() - lastT > 120) vel = 0;
      if (Math.abs(vel) <= 0.35) target = angleFor(frontIndex(angle), angle);
      touched();
      kick();
    }
  }
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);
  root.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
  root.addEventListener('pointerleave', function () {
    hover = false;
    parTX = parTY = 0;
    nextAuto = Math.max(nextAuto, performance.now() + 1500);
    kick();
  });
  root.addEventListener('focusin', function () { focused = true; });
  root.addEventListener('focusout', function (e) {
    if (!root.contains(e.relatedTarget)) { focused = false; nextAuto = performance.now() + DWELL; kick(); }
  });

  /* ---------- Acciones ---------- */
  function onItemClick(i) {
    if (suppressClick) { suppressClick = false; return; }
    if (i === front && target == null) buscarEnCatalogo(piezas[i]);
    else goTo(i, true);
  }

  root.querySelectorAll('.orbit__btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var base = target != null ? frontIndex(target) : front;
      goTo(base + Number(b.getAttribute('data-dir')), true);
    });
  });
  elGo.addEventListener('click', function () { buscarEnCatalogo(piezas[front]); });

  root.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      var base = target != null ? frontIndex(target) : front;
      goTo(base + (e.key === 'ArrowRight' ? 1 : -1), true);
      if (root.contains(document.activeElement) && document.activeElement.classList.contains('orbit__item')) {
        var k = mod(base + (e.key === 'ArrowRight' ? 1 : -1), n);
        items[k].tabIndex = 0;
        items[k].focus({ preventScroll: true });
      }
    }
  });

  function buscarEnCatalogo(p) {
    var q = document.getElementById('q');
    var cat = document.getElementById('catalogo');
    if (q) {
      q.value = p.buscar;
      ['input', 'change'].forEach(function (type) { q.dispatchEvent(new Event(type, { bubbles: true })); });
      q.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, key: 'Enter' }));
    }
    if (cat) cat.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------- Visibilidad y tamaño ---------- */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) { nextAuto = performance.now() + DWELL; kick(); }
    }, { threshold: 0.05 }).observe(root);
  }
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) { nextAuto = performance.now() + DWELL; kick(); }
  });
  if ('ResizeObserver' in window) new ResizeObserver(function () { measure(); kick(); }).observe(scene);
  else window.addEventListener('resize', function () { measure(); kick(); });

  measure();
  render(performance.now());
  kick();
})();
