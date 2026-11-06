// Concept behaviour for /chartahealth.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Draw the yellow underline on a testimonial's key phrase when it comes
  //    into view (scrolling down, or sliding in from the carousel).
  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('hl-ready');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > 0.6) { e.target.classList.add('is-drawn'); io.unobserve(e.target); }
      });
    }, { threshold: [0, 0.6, 1] });
    document.querySelectorAll('mark.hl').forEach(function (m) { io.observe(m); });
  }

  // 2. Solutions tabs: the isometric illustrations are inlined so they can be
  //    drawn in line by line every time their tab is shown. Every drawing
  //    starts from the same point (bottom centre of the frame) and spreads
  //    outward. Charta's Finsweet tabs script rebuilds the panes from a CMS
  //    list after load, so this works on whatever images exist when a pane
  //    becomes active rather than on the initial markup.
  var cache = {}, uid = 0;
  var SHAPES = 'line,rect,polygon,polyline,circle,path';

  function inline(img) {
    var url = img.getAttribute('src');
    var load = cache[url] || (cache[url] = fetch(url).then(function (r) { return r.text(); }));
    return load.then(function (text) {
      if (!img.parentNode) return null;
      var n = ++uid;
      // ids must stay unique once several drawings live in one document
      text = text.replace(/id="([^"]+)"/g, 'id="$1-' + n + '"').replace(/url\(#([^)]+)\)/g, 'url(#$1-' + n + ')');
      var box = document.createElement('div');
      box.className = img.className + ' illo';
      box.setAttribute('role', 'img');
      box.setAttribute('aria-label', img.getAttribute('alt') || '');
      box.innerHTML = text;
      var svg = box.querySelector('svg');
      svg.removeAttribute('width'); svg.removeAttribute('height');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      img.replaceWith(box);
      return box;
    });
  }

  function draw(box) {
    var svg = box && box.querySelector('svg');
    if (!svg || reduce || !svg.animate) return;
    var vb = svg.viewBox.baseVal, root = svg.getBoundingClientRect();
    if (!root.width) return;
    var k = root.width / vb.width;
    // shared origin: bottom centre of the canvas
    var ox = root.left + root.width / 2, oy = root.top + root.height;
    var items = [], far = 0, near = Infinity;
    svg.querySelectorAll(SHAPES).forEach(function (el) {
      if (el.closest('defs')) return;
      var r = el.getBoundingClientRect();
      var d = Math.hypot(r.left + r.width / 2 - ox, r.top + r.height / 2 - oy) / k;
      far = Math.max(far, d); near = Math.min(near, d);
      items.push([el, d]);
    });
    items.forEach(function (it) {
      var el = it[0], delay = 120 + 1700 * ((it[1] - near) / Math.max(1, far - near));
      var cs = getComputedStyle(el);
      var stroked = cs.stroke && cs.stroke !== 'none';
      var dashed = cs.strokeDasharray && cs.strokeDasharray !== 'none' && !el.hasAttribute('data-drawn');
      var fo = cs.fillOpacity, so = cs.strokeOpacity;
      if (stroked && !dashed) {
        el.setAttribute('pathLength', '1');
        el.setAttribute('stroke-dasharray', '1 1');
        el.setAttribute('data-drawn', '');
        el.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
          { duration: 1400, delay: delay, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'backwards' });
      } else if (stroked) {
        el.animate([{ strokeOpacity: 0 }, { strokeOpacity: so }], { duration: 1000, delay: delay, fill: 'backwards' });
      }
      if (cs.fill && cs.fill !== 'none') {
        el.animate([{ fillOpacity: 0 }, { fillOpacity: fo }],
          { duration: 1000, delay: delay + 600, easing: 'ease-out', fill: 'backwards' });
      }
    });
  }

  function activate(pane) {
    var box = pane.querySelector('.illo');
    if (box) { requestAnimationFrame(function () { draw(box); }); return; }
    var img = pane.querySelector('img[src*="/illustrations/"]');
    if (img) inline(img).then(function (b) { if (b && pane.classList.contains('w--tab-active')) requestAnimationFrame(function () { draw(b); }); });
  }

  var section = document.querySelector('.section_solutions-tabs');
  if (!section || !window.fetch) return;
  // inline every drawing up front (they are small) so tab switches are instant
  section.querySelectorAll('img[src*="/illustrations/"]').forEach(function (img) { inline(img); });
  new MutationObserver(function (muts) {
    muts.forEach(function (m) {
      var el = m.target;
      if (m.type === 'attributes' && el.classList && el.classList.contains('w-tab-pane') && el.classList.contains('w--tab-active') &&
          (m.oldValue || '').indexOf('w--tab-active') < 0) activate(el);
      if (m.type === 'childList') m.addedNodes.forEach(function (nd) {
        if (nd.querySelectorAll) nd.querySelectorAll('img[src*="/illustrations/"]').forEach(function (img) { inline(img); });
      });
    });
  }).observe(section, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true, childList: true });
  // first draw when the section scrolls into view
  if ('IntersectionObserver' in window) {
    var seen = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) {
        seen.disconnect();
        var p = section.querySelector('.w-tab-pane.w--tab-active');
        if (p) activate(p);
      }
    }, { threshold: 0.4 });
    seen.observe(section.querySelector('.w-tabs') || section);
  }
})();

// 3. Resources + webinars: hand-drawn doodles (arrows, squiggles, scribbles)
//    draw themselves into the open space around the cards, hold for a few
//    seconds, then fade. Arrows point at the nearest card or button. A few at
//    a time, varied in size and speed, never over the cards or copy.
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !document.body.animate) return;
  // Resources and webinars are two sections with the same class; each gets its own layer.
  document.querySelectorAll('.section_featured-resources').forEach(setup);
  function setup(host) {

  var NS = 'http://www.w3.org/2000/svg';
  var INK = '#0f2d29';
  var MAX = 7;
  var layer = document.createElement('div');
  layer.className = 'doodles';
  layer.setAttribute('aria-hidden', 'true');
  host.appendChild(layer);

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function j(n) { return n + rnd(-2.2, 2.2); } // hand wobble
  function pt(x, y) { return j(x).toFixed(1) + ' ' + j(y).toFixed(1); }

  // Each shape returns its box (w x h in its own units) and its strokes.
  var SHAPES = {
    arrow: function () {
      var bend = rnd(-22, 22);
      return { w: 100, h: 100, aim: true, paths: [
        'M' + pt(8, 86) + ' C' + pt(30 + bend, 60) + ' ' + pt(50 - bend, 34) + ' ' + pt(88, 14),
        'M' + pt(66, 12) + ' L' + pt(89, 13) + ' L' + pt(84, 36)
      ] };
    },
    loopArrow: function () {
      return { w: 120, h: 90, aim: true, paths: [
        'M' + pt(6, 74) + ' C' + pt(30, 70) + ' ' + pt(50, 20) + ' ' + pt(38, 22) + ' S' + pt(30, 58) + ' ' + pt(58, 52) + ' S' + pt(96, 28) + ' ' + pt(112, 18),
        'M' + pt(92, 12) + ' L' + pt(113, 17) + ' L' + pt(104, 37)
      ] };
    },
    squiggle: function () {
      var n = Math.round(rnd(3, 5)), d = 'M' + pt(4, 20);
      for (var i = 0; i < n; i++) {
        var x = 4 + (i + 1) * (152 / n), up = i % 2 ? 34 : 6;
        d += ' Q' + pt(x - 76 / n, up) + ' ' + pt(x, 20);
      }
      return { w: 160, h: 40, paths: [d] };
    },
    loops: function () {
      var d = 'M' + pt(4, 30);
      for (var i = 0; i < 4; i++) {
        var x = 18 + i * 34;
        d += ' C' + pt(x + 14, 30) + ' ' + pt(x + 16, 4) + ' ' + pt(x + 4, 6) + ' S' + pt(x - 6, 30) + ' ' + pt(x + 30, 30);
      }
      return { w: 160, h: 40, paths: [d] };
    },
    scribble: function () {
      var d = '', turns = rnd(1.4, 2.1), steps = 40;
      for (var i = 0; i <= steps; i++) {
        var t = i / steps * turns * Math.PI * 2, r = 1 - i / steps * .22;
        var x = 50 + Math.cos(t) * 44 * r + rnd(-1.5, 1.5), y = 32 + Math.sin(t) * 26 * r + rnd(-1.5, 1.5);
        d += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      return { w: 100, h: 64, paths: [d] };
    },
    spiral: function () {
      var d = '', steps = 46;
      for (var i = 0; i <= steps; i++) {
        var t = i / steps * Math.PI * 5, r = 4 + i / steps * 40;
        d += (i ? ' L' : 'M') + (50 + Math.cos(t) * r).toFixed(1) + ' ' + (50 + Math.sin(t) * r).toFixed(1);
      }
      return { w: 100, h: 100, paths: [d] };
    },
    zigzag: function () {
      var d = 'M' + pt(4, 22), n = 7;
      for (var i = 1; i <= n; i++) d += ' L' + pt(4 + i * (132 / n), i % 2 ? 6 : 22);
      return { w: 140, h: 28, paths: [d, 'M' + pt(14, 26) + ' L' + pt(128, 24)] };
    },
    sparkle: function () {
      return { w: 70, h: 70, paths: [
        'M' + pt(35, 4) + ' L' + pt(35, 24), 'M' + pt(35, 46) + ' L' + pt(35, 66),
        'M' + pt(4, 35) + ' L' + pt(24, 35), 'M' + pt(46, 35) + ' L' + pt(66, 35),
        'M' + pt(14, 14) + ' L' + pt(24, 24), 'M' + pt(46, 46) + ' L' + pt(56, 56)
      ] };
    },
    burst: function () {
      var p = [];
      for (var i = 0; i < 7; i++) {
        var a = -Math.PI * .95 + i * (Math.PI * .9 / 6), r0 = 18, r1 = rnd(36, 46);
        p.push('M' + pt(50 + Math.cos(a) * r0, 54 + Math.sin(a) * r0) + ' L' + pt(50 + Math.cos(a) * r1, 54 + Math.sin(a) * r1));
      }
      return { w: 100, h: 60, paths: p };
    }
  };
  var KINDS = ['arrow', 'arrow', 'loopArrow', 'squiggle', 'loops', 'scribble', 'spiral', 'zigzag', 'sparkle', 'burst'];

  // edge > 0 shrinks the cards by that much so a doodle can tuck over a
  // corner or edge; copy and buttons are always kept clear.
  function obstacles(box, edge) {
    var list = [];
    host.querySelectorAll('.resources-index_item, h2, h3, p, .button, .tag').forEach(function (el) {
      var rects = [el.getBoundingClientRect()];
      // headings and paragraphs are full-width blocks; keep clear of the words, not the box
      if (/^(H2|H3|P)$/.test(el.tagName)) { var rg = document.createRange(); rg.selectNodeContents(el); rects = [].slice.call(rg.getClientRects()); }
      var m = edge && /resources-index_item/.test(el.className) ? -edge : 14;
      rects.forEach(function (r) {
        if (!r.width || !r.height) return;
        list.push({ l: r.left - box.left - m, t: r.top - box.top - m, r: r.right - box.left + m, b: r.bottom - box.top + m, el: el });
      });
    });
    return list;
  }
  function hits(a, list) {
    for (var i = 0; i < list.length; i++) {
      var o = list[i];
      if (a.l < o.r && a.r > o.l && a.t < o.b && a.b > o.t) return true;
    }
    return false;
  }

  var live = [];
  function spawn() {
    if (live.length >= MAX) return;
    var box = host.getBoundingClientRect();
    var obs = obstacles(box), overlap = Math.random() < .35;
    var kind = pick(KINDS), s = SHAPES[kind]();
    // size: mostly small and medium, the odd big one
    var scale = Math.random() < .25 ? rnd(1.8, 2.6) : rnd(.85, 1.5);
    var rot = rnd(-22, 22), w, h, spot = null;
    // only place doodles where people are looking: the visible part of the section
    var top = Math.max(8, -box.top + 70), bottom = Math.min(box.height - 8, window.innerHeight - box.top - 8);
    var others = live.map(function (d) { return d.box; });
    // try the chosen size first, then smaller, so tight gaps still get the odd small one
    for (var k = 0; k < 3 && !spot; k++, scale *= .7) {
      w = s.w * scale; h = s.h * scale;
      var pad = Math.max(w, h) * .12;
      var place = overlap ? obstacles(box, Math.min(w, h) * .45) : obs;
      for (var tries = 0; tries < 60 && !spot; tries++) {
        var x = rnd(8, box.width - w - 8), y = rnd(top, bottom - h);
        var a = { l: x - pad, t: y - pad, r: x + w + pad, b: y + h + pad };
        if (!hits(a, place) && !hits(a, others)) spot = { x: x, y: y, box: a };
      }
    }
    if (!spot) return;
    if (s.aim) {
      // arrows lean toward the nearest card or button
      var cx = spot.x + w / 2, cy = spot.y + h / 2, best = null, bd = 1e9;
      obs.forEach(function (o) {
        if (!/resources-index_item|button/.test(o.el.className)) return;
        var ox = Math.max(o.l, Math.min(cx, o.r)), oy = Math.max(o.t, Math.min(cy, o.b));
        var dd = Math.hypot(ox - cx, oy - cy);
        if (dd < bd) { bd = dd; best = [ox, oy]; }
      });
      if (best) rot = Math.atan2(best[1] - cy, best[0] - cx) * 180 / Math.PI + 45; // drawn pointing up-right (-45deg)
    }
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + s.w + ' ' + s.h);
    svg.setAttribute('width', w.toFixed(0));
    svg.setAttribute('height', h.toFixed(0));
    svg.style.left = spot.x.toFixed(0) + 'px';
    svg.style.top = spot.y.toFixed(0) + 'px';
    svg.style.transform = 'rotate(' + rot.toFixed(1) + 'deg)';
    if (overlap && hits(spot.box, obs)) svg.classList.add('is-over');
    var stroke = rnd(3, 4.5) * Math.min(1.35, Math.max(.9, scale));
    var opacity = rnd(.35, .55).toFixed(2);
    var speed = rnd(.7, 1.6) * (900 + 500 * scale); // ms for the main stroke
    var at = 0;
    s.paths.forEach(function (d, i) {
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', INK);
      path.setAttribute('stroke-opacity', opacity);
      path.setAttribute('stroke-width', stroke.toFixed(1));
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      path.setAttribute('pathLength', '1');
      path.setAttribute('stroke-dasharray', '1 1');
      svg.appendChild(path);
      var dur = i === 0 ? speed : Math.max(160, speed * (s.paths.length > 3 ? .3 : .35));
      path.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }],
        { duration: dur, delay: at, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'both' });
      at += s.paths.length > 3 ? dur * .45 : dur * .9;
    });
    layer.appendChild(svg);
    var item = { box: spot.box, el: svg };
    live.push(item);
    var hold = rnd(2600, 4200);
    var fade = svg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 900, delay: at + hold, easing: 'ease-in', fill: 'forwards' });
    fade.onfinish = function () { svg.remove(); live.splice(live.indexOf(item), 1); };
  }

  var timer = null, visible = false;
  function loop() {
    if (!visible || document.hidden) { timer = null; return; }
    spawn();
    timer = setTimeout(loop, rnd(350, 900));
  }
  new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting;
    if (visible && !timer) timer = setTimeout(loop, 400);
  }, { threshold: 0.15 }).observe(host);
  document.addEventListener('visibilitychange', function () { if (!document.hidden && visible && !timer) loop(); });
  }
})();
